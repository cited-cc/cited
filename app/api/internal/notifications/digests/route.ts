import { handleCronJobRoute } from "@/lib/jobs/adapters/http";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  return handleCronJobRoute(request, {
    jobId: "notifications.digests",
    unauthorizedEvent: "notifications.digest.unauthorized",
    failedEvent: "notifications.digest.failed",
  });
}

export async function GET(request: Request) {
  return POST(request);
}
