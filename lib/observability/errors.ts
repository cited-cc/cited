import { NextResponse } from "next/server";

/**
 * Safe application errors. Customer-facing messages must never leak
 * SQL, provider payloads, stack traces, or cross-workspace existence.
 */

export type AppErrorCode =
  | "auth"
  | "permission"
  | "not_found"
  | "validation"
  | "billing"
  | "entitlement"
  | "provider"
  | "rate_limit"
  | "job"
  | "internal";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly safeMessage: string;
  readonly safeErrorCode: string;

  constructor(input: {
    code: AppErrorCode;
    message: string;
    safeMessage: string;
    status: number;
    safeErrorCode?: string;
  }) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.status = input.status;
    this.safeMessage = input.safeMessage;
    this.safeErrorCode = input.safeErrorCode ?? input.code;
  }
}

/** Prefer `@/lib/auth` AuthError for session gates. This is for API-safe responses. */
export class UnauthenticatedError extends AppError {
  constructor(safeMessage = "Sign in to continue.", status = 401) {
    super({
      code: "auth",
      message: safeMessage,
      safeMessage,
      status,
      safeErrorCode: "unauthenticated",
    });
    this.name = "UnauthenticatedError";
  }
}

export class PermissionError extends AppError {
  constructor(safeMessage = "You do not have access to this resource.") {
    super({
      code: "permission",
      message: safeMessage,
      safeMessage,
      status: 403,
      safeErrorCode: "forbidden",
    });
    this.name = "PermissionError";
  }
}

export class NotFoundError extends AppError {
  constructor(safeMessage = "Not found.") {
    super({
      code: "not_found",
      message: safeMessage,
      safeMessage,
      status: 404,
      safeErrorCode: "not_found",
    });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(safeMessage: string) {
    super({
      code: "validation",
      message: safeMessage,
      safeMessage,
      status: 400,
      safeErrorCode: "validation_error",
    });
    this.name = "ValidationError";
  }
}

export class BillingError extends AppError {
  constructor(safeMessage: string, status = 402) {
    super({
      code: "billing",
      message: safeMessage,
      safeMessage,
      status,
      safeErrorCode: "billing_error",
    });
    this.name = "BillingError";
  }
}

export class EntitlementError extends AppError {
  constructor(safeMessage: string) {
    super({
      code: "entitlement",
      message: safeMessage,
      safeMessage,
      status: 403,
      safeErrorCode: "entitlement_denied",
    });
    this.name = "EntitlementError";
  }
}

export class ProviderError extends AppError {
  constructor(safeMessage: string, status = 502) {
    super({
      code: "provider",
      message: safeMessage,
      safeMessage,
      status,
      safeErrorCode: "provider_error",
    });
    this.name = "ProviderError";
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, safeMessage?: string) {
    super({
      code: "rate_limit",
      message: safeMessage ?? "Too many requests. Try again shortly.",
      safeMessage: safeMessage ?? "Too many requests. Try again shortly.",
      status: 429,
      safeErrorCode: "rate_limited",
    });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class JobError extends AppError {
  constructor(safeMessage: string) {
    super({
      code: "job",
      message: safeMessage,
      safeMessage,
      status: 500,
      safeErrorCode: "job_error",
    });
    this.name = "JobError";
  }
}

export function toSafeErrorResponse(
  error: unknown,
  correlationId?: string,
): NextResponse {
  if (error instanceof AppError) {
    const headers: HeadersInit = {};
    if (error instanceof RateLimitError) {
      headers["Retry-After"] = String(error.retryAfterSeconds);
    }
    return NextResponse.json(
      {
        error: error.safeMessage,
        code: error.safeErrorCode,
        ...(correlationId ? { correlationId } : {}),
      },
      { status: error.status, headers },
    );
  }

  return NextResponse.json(
    {
      error: "Something went wrong. Try again.",
      code: "internal",
      ...(correlationId ? { correlationId } : {}),
    },
    { status: 500 },
  );
}
