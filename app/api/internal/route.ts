import { listJobIds, listRegisteredJobs } from "@/lib/jobs/registry";

export const runtime = "nodejs";

export async function GET() {
  const jobs = listRegisteredJobs().map((registered) =>
    Object.freeze({
      id: registered.definition.id,
      httpPath: registered.httpPath,
      schedule: registered.definition.defaultSchedule.cron,
      deploymentModes: registered.definition.deploymentModes,
      timeoutMs: registered.definition.timeoutMs,
    }),
  );

  return Response.json(
    {
      ok: true,
      jobs,
      jobIds: listJobIds(),
      cli: "npm run jobs:run -- <job-id>",
      worker: "npm run jobs:worker",
    },
    { status: 200 },
  );
}

export async function POST() {
  return Response.json({ error: "Method not allowed." }, { status: 405 });
}
