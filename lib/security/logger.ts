const SENSITIVE_KEY_PATTERN =
  /(api[_-]?key|token|password|secret|authorization|cookie|set[-_]?cookie|webhook|signature|bearer|private[_-]?key|service[_-]?role|stripe|clerk|resend|dataforseo|supabase)/i;

const CONTENT_REDACT_KEYS = new Set([
  "prompt",
  "promptText",
  "prompt_text",
  "response",
  "responseText",
  "response_text",
  "raw_provider_payload",
  "rawProviderPayload",
  "rawHeaders",
  "headers",
  "email",
  "note",
  "noteBody",
  "note_body",
  "annotation",
  "annotationBody",
  "annotation_body",
  "sourceUrl",
  "source_url",
  "sourceURL",
  "verification_token",
  "unsubscribe_token",
  "slack_webhook",
  "slackWebhook",
  "body",
]);

const REDACTED = "[REDACTED]";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  event?: string;
  workspaceId?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  route?: string;
  status?: string | number;
  durationMs?: number;
  safeErrorCode?: string;
  attemptCount?: number;
  [key: string]: unknown;
};

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key) || CONTENT_REDACT_KEYS.has(key)) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(String(index), item));
  }

  if (value && typeof value === "object") {
    return redactObject(value as Record<string, unknown>);
  }

  return value;
}

export function redactObject(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key) || CONTENT_REDACT_KEYS.has(key)) {
      output[key] = REDACTED;
      continue;
    }
    output[key] = redactValue(key, value);
  }
  return output;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? redactObject(context) : {}),
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
    default: {
      const _exhaustive: never = level;
      console.info(line);
      void _exhaustive;
    }
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    write("debug", message, context),
  info: (message: string, context?: LogContext) =>
    write("info", message, context),
  warn: (message: string, context?: LogContext) =>
    write("warn", message, context),
  error: (message: string, context?: LogContext) =>
    write("error", message, context),
};
