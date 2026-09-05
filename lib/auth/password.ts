import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export const PASSWORD_HASH_VERSION = "scrypt-v1";
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 256;

const SCRYPT_KEY_LENGTH = 64;

export class PasswordValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordValidationError";
  }
}

export function normalizePasswordInput(password: string): string {
  return password.normalize("NFKC");
}

export function assertPasswordLength(password: string): void {
  const normalized = normalizePasswordInput(password);
  if (normalized.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordValidationError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }
  if (normalized.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordValidationError(
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordLength(password);
  const normalized = normalizePasswordInput(password);
  const salt = randomBytes(16);
  const derived = (await scryptAsync(normalized, salt, SCRYPT_KEY_LENGTH)) as Buffer;

  return [
    PASSWORD_HASH_VERSION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const normalized = normalizePasswordInput(password);
  const parts = encodedHash.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const [version, saltB64, hashB64] = parts;
  if (version !== PASSWORD_HASH_VERSION || !saltB64 || !hashB64) {
    return false;
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64url");
    expected = Buffer.from(hashB64, "base64url");
  } catch {
    return false;
  }

  if (expected.length !== SCRYPT_KEY_LENGTH) {
    return false;
  }

  const derived = (await scryptAsync(normalized, salt, SCRYPT_KEY_LENGTH)) as Buffer;

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

/** Constant-time dummy verify for nonexistent accounts. */
export async function verifyPasswordDummy(password: string): Promise<void> {
  const dummySalt = Buffer.alloc(16, 0);
  await scryptAsync(normalizePasswordInput(password), dummySalt, SCRYPT_KEY_LENGTH);
}
