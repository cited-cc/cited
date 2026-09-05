export type ExportErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "too_large"
  | "rate_limited"
  | "bad_request";

export class ExportError extends Error {
  readonly code: ExportErrorCode;
  readonly status: number;

  constructor(code: ExportErrorCode, message: string, status: number) {
    super(message);
    this.name = "ExportError";
    this.code = code;
    this.status = status;
  }
}
