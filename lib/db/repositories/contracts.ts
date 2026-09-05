import type { Tables } from "@/lib/db/types";

export type ScanRunRow = Tables<"scan_runs">;

export interface MonitoringRepository {
  releaseExpiredLeases(): Promise<number>;
  claimDueScanRuns(input: {
    limit: number;
    workerId: string;
    leaseSeconds?: number;
  }): Promise<ScanRunRow[]>;
}

export interface RateLimitRepository {
  getBucket(key: string): Promise<{ hitCount: number; windowStartedAt: string } | null>;
  upsertBucket(input: {
    key: string;
    hitCount: number;
    windowStartedAt: string;
    updatedAt: string;
  }): Promise<void>;
}

export interface AuthRepository {
  countWorkspaceOwners(): Promise<number>;
  hasAnyInternalUser(): Promise<boolean>;
}

export interface DatabaseRepositories {
  monitoring: MonitoringRepository;
  rateLimit: RateLimitRepository;
  auth: AuthRepository;
}
