# Notebook

The Notebook is a quiet evidence ledger for citation-linked observations, decisions, and saved context. It is not a docs product, wiki, or project-management tool.

## Purpose and scope

Primary flow:

1. A citation event appears.
2. A founder opens the evidence.
3. They attach context, observation, decision, or follow-up.
4. The evidence remains durable and reviewable.

Notes may stand alone in a workspace, but the product center of gravity remains citation evidence.

Out of scope: nested folders, collaborative cursors, page blocks, rich canvases, attachments, embeds, public share links.

## Visibility

| Visibility | Who can read |
| --- | --- |
| `workspace` | Authorized workspace members with note-view access |
| `private` | Author only |

Private notes must not appear in another member's list, search, counts, filters, linked previews, or direct routes (generic not-found).

## Citation-linked notes

`citation_event_id` is optional. Linked notes show a compact read-only evidence reference (event type, prompt, surface, first seen) and an Open evidence action. Do not duplicate the full response transcript into every note body.

## Revision history

Table: `notebook_entry_revisions`.

- Revision 1 is created on note create.
- Later revisions are created only when title or body meaningfully changes.
- Revision numbers are server-assigned and sequential per note.
- Restore creates a new current revision; history is never rewritten.

Copy:

> Restoring creates a new current version. Previous versions remain in the record.

## Permissions

| Role | Create | View workspace | Edit own | Archive own | Pin |
| --- | --- | --- | --- | --- | --- |
| owner/admin | yes | yes | own | own + workspace notes | own + workspace |
| member | yes | yes | own | own | own (+ workspace if author) |
| viewer | no | yes | no | no | no |

Pin semantics: per-note. Workspace pins are shared. Private pins are personal because only the author can see the note.

## Archiving and soft delete

- Archive sets `archived_at` and never deletes note text.
- Soft delete sets `deleted_at`; revision history is retained.
- Event archival does not delete linked notebook notes.
- Creating a note does not auto-save or auto-resolve the citation event.

## Search and filters

Server-scoped search over title and body (and linked event context only when the user can access that event). URL state uses validated IDs and view names only. Cursor pagination: pinned first where relevant, then `updated_at DESC`, stable ID tie-breaker.

Views: All, Pinned, Linked to citations, Private, Archived.
