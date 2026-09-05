import { describe, expect, it } from "vitest";

import {
  canArchiveInboxEvents,
  canResolveInboxEvents,
  canSaveInboxEvents,
  canTriageInboxEvents,
} from "@/lib/auth/permissions";
import { INBOX_BULK_SELECTION_CAP } from "@/lib/inbox/types";
import { EMPTY_MEMBER_STATE } from "@/lib/inbox/types";

describe("inbox member state semantics", () => {
  it("treats missing member state as unseen / unsaved / unarchived", () => {
    expect(EMPTY_MEMBER_STATE.seenAt).toBeNull();
    expect(EMPTY_MEMBER_STATE.savedAt).toBeNull();
    expect(EMPTY_MEMBER_STATE.archivedAt).toBeNull();
    expect(EMPTY_MEMBER_STATE.resolvedAt).toBeNull();
  });

  it("caps bulk selection", () => {
    expect(INBOX_BULK_SELECTION_CAP).toBeLessThanOrEqual(50);
    expect(INBOX_BULK_SELECTION_CAP).toBeGreaterThan(0);
  });

  it("keeps viewer from archive/resolve while allowing seen/save", () => {
    expect(canTriageInboxEvents("viewer")).toBe(true);
    expect(canSaveInboxEvents("viewer")).toBe(true);
    expect(canArchiveInboxEvents("viewer")).toBe(false);
    expect(canResolveInboxEvents("viewer")).toBe(false);
  });
});

describe("inbox query isolation contracts", () => {
  it("documents that list/detail queries require workspace scope helpers", async () => {
    const queries = await import("@/lib/inbox/queries");
    expect(typeof queries.listInboxEvents).toBe("function");
    expect(typeof queries.getInboxEventPreview).toBe("function");
    expect(typeof queries.assertEventInWorkspace).toBe("function");
    expect(typeof queries.assertEventsInWorkspace).toBe("function");
    expect(typeof queries.getInboxTabCounts).toBe("function");
  });

  it("exports triage actions without bulk delete", async () => {
    const actions = await import("@/lib/inbox/actions");
    expect(typeof actions.markEventSeenAction).toBe("function");
    expect(typeof actions.markEventSavedAction).toBe("function");
    expect(typeof actions.archiveEventAction).toBe("function");
    expect(typeof actions.restoreEventAction).toBe("function");
    expect(typeof actions.resolveEventAction).toBe("function");
    expect(typeof actions.reopenEventAction).toBe("function");
    expect(typeof actions.bulkMarkSeenAction).toBe("function");
    expect(typeof actions.bulkArchiveAction).toBe("function");
    expect(typeof actions.loadMoreInboxEventsAction).toBe("function");
    expect(
      Object.keys(actions).some((key) => key.toLowerCase().includes("delete")),
    ).toBe(false);
  });
});
