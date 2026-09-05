/**
 * Privacy-preserving request fingerprints for abuse protection.
 * Never store raw IPs forever; hash at the boundary.
 */

export {
  fingerprintFromRequest,
  hashRateLimitFingerprint,
} from "@/lib/security/rate-limit";
