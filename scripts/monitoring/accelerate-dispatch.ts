#!/usr/bin/env npx tsx
/**
 * Drain the paid monitoring scan queue (local dispatcher, production env).
 *
 * Usage:
 *   npx vercel env run --environment=production -- npx tsx scripts/monitoring/accelerate-dispatch.ts
 */
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { runMonitoringDispatcher } from "@/lib/monitoring/dispatcher";

async function queueCounts(): Promise<Record<string, number>> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("scan_runs").select("status");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const status = row.status as string;
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return counts;
}

async function main(): Promise<void> {
  const maxRounds = Number(
    process.argv.find((arg) => arg.startsWith("--rounds="))?.split("=")[1] ?? "10",
  );

  for (let round = 1; round <= maxRounds; round += 1) {
    const before = await queueCounts();
    const queuedBefore = before.queued ?? 0;
    if (queuedBefore === 0) {
      console.log("Queue empty.", before);
      return;
    }

    console.log(`Round ${round}: before`, before);
    const summary = await runMonitoringDispatcher();
    console.log(`Round ${round}: summary`, summary);

    const after = await queueCounts();
    console.log(`Round ${round}: after`, after);

    if ((after.queued ?? 0) === 0) {
      console.log("Queue drained.");
      return;
    }
    if ((after.queued ?? 0) >= queuedBefore) {
      console.log("No queue progress; stopping.");
      return;
    }
  }

  console.log("Reached max rounds with queue still pending.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
