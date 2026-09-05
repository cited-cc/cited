import { connect as connectTls } from "node:tls";
import { connect as connectPlain } from "node:net";

import {
  getOptionalServerEnv,
  isNotificationsEnabled,
} from "@/lib/env";
import type {
  EmailProvider,
  NotificationEmailPayload,
} from "@/lib/notifications/providers/email-types";
import type { EmailSendResult } from "@/lib/notifications/types";
import { logger } from "@/lib/security/logger";

const DEFAULT_TIMEOUT_MS = 15_000;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function parseAddress(value: string): { mailbox: string; address: string } {
  const match = value.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      mailbox: match[1].trim().replace(/^"|"$/g, ""),
      address: match[2].trim(),
    };
  }
  return { mailbox: "", address: value.trim() };
}

async function readResponse(socket: NodeJS.ReadableStream): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      reject(new Error("SMTP response timeout."));
    }, DEFAULT_TIMEOUT_MS);

    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      const text = Buffer.concat(chunks).toString("utf8");
      const lines = text.split(/\r?\n/).filter(Boolean);
      const last = lines.at(-1);
      if (last && /^\d{3} /.test(last)) {
        cleanup();
        resolve(text);
      }
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function sendCommand(
  socket: NodeJS.WritableStream & NodeJS.ReadableStream,
  command: string,
): Promise<string> {
  socket.write(`${command}\r\n`);
  return readResponse(socket);
}

function destroySocket(
  socket: NodeJS.WritableStream & NodeJS.ReadableStream,
): void {
  (socket as import("node:net").Socket).destroy();
}

function expectCode(response: string, code: number): boolean {
  return response.split(/\r?\n/).some((line) => line.startsWith(String(code)));
}

async function deliverSmtpMessage(input: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  replyTo?: string;
}): Promise<EmailSendResult> {
  const socket = input.secure
    ? connectTls({ host: input.host, port: input.port, servername: input.host })
    : connectPlain({ host: input.host, port: input.port });

  try {
    await readResponse(socket);
    await sendCommand(socket, `EHLO cited.local`);

    if (!input.secure) {
      const startTls = await sendCommand(socket, "STARTTLS");
      if (!expectCode(startTls, 220)) {
        return {
          status: "failed",
          retryable: false,
          code: "smtp_starttls_failed",
          safeMessage: "SMTP STARTTLS failed.",
        };
      }
      const upgraded = await new Promise<
        NodeJS.WritableStream & NodeJS.ReadableStream
      >((resolve, reject) => {
        const tlsSocket = connectTls({
          socket: socket as unknown as import("node:net").Socket,
          servername: input.host,
        });
        tlsSocket.once("secureConnect", () => resolve(tlsSocket));
        tlsSocket.once("error", reject);
      });
      destroySocket(socket);
      return deliverAuthenticated(upgraded, input);
    }

    return deliverAuthenticated(
      socket as NodeJS.WritableStream & NodeJS.ReadableStream,
      input,
    );
  } catch {
    destroySocket(socket);
    return {
      status: "failed",
      retryable: true,
      code: "smtp_network_error",
      safeMessage: "SMTP network error.",
    };
  }
}

async function deliverAuthenticated(
  socket: NodeJS.WritableStream & NodeJS.ReadableStream,
  input: {
    host: string;
    user?: string;
    password?: string;
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
    replyTo?: string;
  },
): Promise<EmailSendResult> {
  try {
    await sendCommand(socket, `EHLO cited.local`);

    if (input.user && input.password) {
      await sendCommand(socket, "AUTH LOGIN");
      await sendCommand(socket, encodeBase64(input.user));
      const authResult = await sendCommand(
        socket,
        encodeBase64(input.password),
      );
      if (!expectCode(authResult, 235)) {
        socket.end();
        return {
          status: "failed",
          retryable: false,
          code: "smtp_auth_failed",
          safeMessage: "SMTP authentication failed.",
        };
      }
    }

    const fromAddress = parseAddress(input.from).address;
    await sendCommand(socket, `MAIL FROM:<${fromAddress}>`);
    await sendCommand(socket, `RCPT TO:<${input.to}>`);

    await sendCommand(socket, "DATA");

    const headerLines = [
      `From: ${input.from}`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="cited-boundary"',
    ];

    if (input.replyTo) {
      headerLines.push(`Reply-To: ${input.replyTo}`);
    }

    for (const [key, value] of Object.entries(input.headers ?? {})) {
      headerLines.push(`${key}: ${value}`);
    }

    const body = [
      ...headerLines,
      "",
      "--cited-boundary",
      "Content-Type: text/plain; charset=utf-8",
      "",
      input.text,
      "--cited-boundary",
      "Content-Type: text/html; charset=utf-8",
      "",
      input.html,
      "--cited-boundary--",
      ".",
    ].join("\r\n");

    const dataResult = await sendCommand(socket, body);
    await sendCommand(socket, "QUIT");
    socket.end();

    if (!expectCode(dataResult, 250)) {
      return {
        status: "failed",
        retryable: true,
        code: "smtp_rejected",
        safeMessage: "SMTP server rejected the message.",
      };
    }

    logger.info("SMTP email sent", {
      event: "notifications.smtp.sent",
      provider: "smtp",
      status: "sent",
    });

    return { status: "sent" };
  } catch {
    destroySocket(socket);
    return {
      status: "failed",
      retryable: true,
      code: "smtp_network_error",
      safeMessage: "SMTP network error.",
    };
  }
}

export const smtpEmailProvider: EmailProvider = Object.freeze({
  id: "smtp",
  async send(payload: NotificationEmailPayload): Promise<EmailSendResult> {
    const env = getOptionalServerEnv();

    if (!payload.bypassNotificationsGate && !isNotificationsEnabled(env)) {
      return { status: "suppressed", reason: "notifications_disabled" };
    }

    if (!env.SMTP_HOST || !env.SMTP_FROM_EMAIL) {
      if (process.env.NODE_ENV === "production") {
        return {
          status: "failed",
          retryable: false,
          code: "smtp_not_configured",
          safeMessage: "Email delivery is not configured.",
        };
      }
      return { status: "suppressed", reason: "smtp_not_configured" };
    }

    if (!isValidEmail(payload.to)) {
      return {
        status: "failed",
        retryable: false,
        code: "invalid_email",
        safeMessage: "Recipient email address is invalid.",
      };
    }

    if (
      !payload.subject.trim() ||
      !payload.html.trim() ||
      !payload.text.trim()
    ) {
      return {
        status: "failed",
        retryable: false,
        code: "invalid_payload",
        safeMessage: "Email payload is incomplete.",
      };
    }

    return deliverSmtpMessage({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE === true,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      from: env.SMTP_FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: payload.headers,
      replyTo: payload.replyTo,
    });
  },
});

export function createSmtpEmailProvider(): EmailProvider {
  return smtpEmailProvider;
}
