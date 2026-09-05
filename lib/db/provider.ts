import "server-only";

export const DATABASE_PROVIDERS = ["supabase", "postgres"] as const;

export type DatabaseProvider = (typeof DATABASE_PROVIDERS)[number];

export type DatabaseHealthState =
  | "ready"
  | "migrations_pending"
  | "unavailable";

export type DatabaseHealthSnapshot = {
  state: DatabaseHealthState;
  provider: DatabaseProvider;
  schemaVersion: string | null;
  pendingMigrations: number;
};
