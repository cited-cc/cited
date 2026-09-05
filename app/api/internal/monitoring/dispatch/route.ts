import { handleCronJobRoute } from "@/lib/jobs/adapters/http";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  return handleCronJobRoute(request, {
    jobId: "monitoring.dispatch",
    unauthorizedEvent: "monitoring.dispatch.unauthorized",
    failedEvent: "monitoring.dispatch.failed",
  });
}

export async function GET(request: Request) {
  return POST(request);
}
