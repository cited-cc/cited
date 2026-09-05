/**
 * Safe structured logging. Prefer this over console.log in production paths.
 */
export { logger, redactObject, type LogContext, type LogLevel } from "@/lib/security/logger";
