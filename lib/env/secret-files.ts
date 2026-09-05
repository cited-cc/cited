import "server-only";

import {
  hydrateSecretFilesFromEnv,
  isAllowedSecretFileName,
  readSecretFileContents,
  resolveSecretFromEnv,
  SECRET_FILE_ALLOWLIST,
} from "@/lib/env/secret-files.mjs";

export type SecretFileName = (typeof SECRET_FILE_ALLOWLIST)[number];

export {
  hydrateSecretFilesFromEnv,
  isAllowedSecretFileName,
  readSecretFileContents,
  resolveSecretFromEnv,
  SECRET_FILE_ALLOWLIST,
};
