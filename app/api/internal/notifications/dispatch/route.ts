import { handleCronJobRoute } from "@/lib/jobs/adapters/http";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  return handleCronJobRoute(request, {
    jobId: "notifications.dispatch",
    unauthorizedEvent: "notifications.dispatch.unauthorized",
    failedEvent: "notifications.dispatch.failed",
  });
}

export async function GET(request: Request) {
  return POST(request);
}
