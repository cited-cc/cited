const URL_CREDENTIAL_PATTERN =
  /(?:postgres(?:ql)?|postgresql):\/\/[^@\s]+@[^\s/]+/gi;
const PASSWORD_PARAM_PATTERN = /([?&](?:password|pass)=)[^&\s]+/gi;

export type DatabaseErrorCode =
  | "connection_failed"
  | "query_failed"
  | "unique_violation"
  | "concurrency_conflict"
  | "not_found"
  | "configuration_error"
  | "migration_failed"
  | "provider_mismatch";

export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode;
  readonly cause?: unknown;

  constructor(
    code: DatabaseErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(redactDatabaseMessage(message));
    this.name = "DatabaseError";
    this.code = code;
    this.cause = cause;
  }
}

export function redactDatabaseMessage(message: string): string {
  return message
    .replace(URL_CREDENTIAL_PATTERN, "postgres://[redacted]@[redacted]")
    .replace(PASSWORD_PARAM_PATTERN, "$1[redacted]");
}

export function mapPgError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  const pg = error as { code?: string; message?: string; detail?: string };
  const message = redactDatabaseMessage(
    pg.message ?? (error instanceof Error ? error.message : "Database operation failed."),
  );

  if (pg.code === "23505") {
    return new DatabaseError("unique_violation", message, error);
  }
  if (pg.code === "40001" || pg.code === "40P01") {
    return new DatabaseError("concurrency_conflict", message, error);
  }

  return new DatabaseError("query_failed", message, error);
}

export function serializeDatabaseErrorForClient(error: unknown): {
  code: DatabaseErrorCode;
  message: string;
} {
  const mapped =
    error instanceof DatabaseError ? error : mapPgError(error);
  return {
    code: mapped.code,
    message: mapped.message,
  };
}
