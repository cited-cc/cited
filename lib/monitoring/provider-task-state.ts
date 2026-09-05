/** Provider task statuses persisted in provider_tasks.status */
export type ProviderTaskStatus =
  | "submitted"
  | "pending"
  | "completed"
  | "failed"
  | "abandoned";

export type ProviderTaskPhase =
  | "intent_recorded"
  | "submitted"
  | "pending"
  | "completed"
  | "failed"
  | "abandoned"
  | "ambiguous";

export type ProviderSubmissionState =
  | "none"
  | "intent"
  | "accepted"
  | "ambiguous"
  | "reconciled";

export const PROVIDER_TASK_TERMINAL: ReadonlySet<ProviderTaskPhase> = new Set([
  "completed",
  "failed",
  "abandoned",
]);

const PROVIDER_TRANSITIONS: Record<
  ProviderTaskPhase,
  ReadonlySet<ProviderTaskPhase>
> = {
  intent_recorded: new Set(["submitted", "pending", "completed", "ambiguous", "failed"]),
  submitted: new Set(["pending", "completed", "failed", "ambiguous"]),
  pending: new Set(["pending", "completed", "failed", "ambiguous"]),
  ambiguous: new Set(["pending", "completed", "failed", "abandoned"]),
  completed: new Set(),
  failed: new Set(),
  abandoned: new Set(),
};

export function resolveProviderTaskPhase(input: {
  status: ProviderTaskStatus;
  submissionState?: string | null;
}): ProviderTaskPhase {
  if (input.submissionState === "ambiguous") {
    return "ambiguous";
  }
  if (input.submissionState === "intent") {
    return "intent_recorded";
  }
  switch (input.status) {
    case "submitted":
      return "submitted";
    case "pending":
      return "pending";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "abandoned":
      return "abandoned";
    default: {
      const _exhaustive: never = input.status;
      return _exhaustive;
    }
  }
}

export function assertProviderTaskTransition(
  from: ProviderTaskPhase,
  to: ProviderTaskPhase,
): void {
  if (from === to) return;
  if (PROVIDER_TASK_TERMINAL.has(from)) {
    throw new ProviderTaskStateTransitionError(
      `Illegal provider transition from terminal "${from}" to "${to}".`,
    );
  }
  const allowed = PROVIDER_TRANSITIONS[from];
  if (!allowed?.has(to)) {
    throw new ProviderTaskStateTransitionError(
      `Illegal provider transition from "${from}" to "${to}".`,
    );
  }
}

export function canPollProviderTask(phase: ProviderTaskPhase): boolean {
  return phase === "pending" || phase === "submitted" || phase === "ambiguous";
}

export class ProviderTaskStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderTaskStateTransitionError";
  }
}

export function allProviderTaskPhases(): ProviderTaskPhase[] {
  return Object.keys(PROVIDER_TRANSITIONS) as ProviderTaskPhase[];
}

export function transitionsFromProviderPhase(
  phase: ProviderTaskPhase,
): ProviderTaskPhase[] {
  return [...(PROVIDER_TRANSITIONS[phase] ?? [])];
}
