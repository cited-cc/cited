# Annotations

Annotations are short contextual observations attached to citation evidence. They are not chat, tickets, or a public commenting system.

## Target kinds

| Kind | Shape |
| --- | --- |
| `event` | Note about the overall citation event. No response/evidence IDs or anchors. |
| `response` | Note about a monitored response. May include validated text anchors. |
| `evidence` | Note about a source/evidence card. Requires `citation_evidence_id`. |

## Visibility

- `workspace`: visible to authorized workspace members
- `private`: visible only to the author

Visibility changes are allowed only by the annotation author.

## Selection validation

Client may submit selected text, offsets, limited context, and `aiResponseId`.

Server must verify:

1. User is authorized for the workspace
2. Response belongs to the selected event and workspace
3. Offsets are valid integers with `end > start`
4. Selected text exactly matches the stored immutable response slice
5. Selection and context lengths are bounded
6. Optional `target_text_hash` matches the SHA-256 of the stored response

On failure, show:

> That evidence selection could not be saved. Try selecting the text again.

Do not trust client offsets alone. Do not store full response text inside annotations.

## Permissions

| Role | Create | View workspace | Edit own | Delete own | Resolve workspace |
| --- | --- | --- | --- | --- | --- |
| owner/admin | yes | yes | yes | yes | yes |
| member | yes | yes | yes | yes | own only |
| viewer | no | yes | no | no | no |

Private annotations are never visible to other members.

## Resolution and deletion

- Resolve is a lightweight state (`resolved_at`), not deletion.
- Soft-delete via `deleted_at`; deleted annotations are hidden from normal UI.
- Restore is available to author or admin when soft-deleted cleanly.
- Activity actions: `created`, `edited`, `resolved`, `reopened`, `deleted`, `restored` (no body text stored in activity).

## Safety

- Plain text only. No HTML, markdown injection, embeds, or @mentions.
- Body max 4000 characters. Anchor max 1000. Context max 200 each side.
- Accessible non-selection paths: annotate event, annotate response, annotate source.
- Never use `dangerouslySetInnerHTML`.
