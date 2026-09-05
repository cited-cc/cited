# Cited design system

Cited is a lightweight AI citation-monitoring product. The visual system should feel like a private research notebook for a company’s presence in AI answers: calm, editorial, and evidence-first.

Future phases must reuse these primitives. Do not invent ad hoc page styles.

## Product visual direction

- Vanilla paper canvas (`#fbf7f0`), Memo / Slurp family
- Ink primary CTAs (`#15131a` on paper); Pamphlet Blue as light brand accent
- Memo.ly typography: Bricolage + Onest + IBM Plex Mono
- Filled ink logo tile with Pamphlet Blue source-slip bar
- Quiet motion, hairline dividers, tactile note edges
- No neon cyberpunk, glassmorphism stacks, purple AI clichés, or pill soup

## Color tokens

Defined in `app/globals.css` and exposed to Tailwind as `cited-*` colors.

| Token | Role |
| --- | --- |
| `--cited-canvas` | `#fbf7f0` vanilla paper |
| `--cited-surface*` | white / soft paper note surfaces |
| `--cited-ink*` | near-black text + primary CTA fill |
| `--cited-accent` / bright | Pamphlet Blue `#5ce1e6` (proof, focus, logo bar) |
| `--cited-citation` / warning / info / success | aliases of Pamphlet Blue (legacy `--cited-yellow` also maps here) |
| `--cited-danger` | destructive only |

Rules:

- At most two accent colors inside a single component unless comparing event types
- No rainbow status dashboards
- No full-screen accent washes

## Surface hierarchy

1. Canvas (`cited-canvas`)
2. Standard surface (`cited-surface`)
3. Raised note / menu / dialog (`cited-surface-raised`)
4. Hover / selected (`cited-surface-hover`)

Note elevation:

```css
box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset,
            0 10px 28px rgba(28,28,24,0.08);
```

Stronger overlay shadow only for dialogs, sheets, and the command palette.

Atmosphere: subtle grain + restrained radial light via `.cited-atmosphere` and `.cited-grain`. Respect `prefers-reduced-motion`.

## Typography

Memo.ly-aligned faces via `next/font`:

| Role | Face |
| --- | --- |
| Display | Bricolage Grotesque (600/700) |
| UI / body | Onest (400/500/600) |
| Mono / labels | IBM Plex Mono (400/500) |

Utility classes:

| Class | Role |
| --- | --- |
| `.type-display` | Hero (`text-display-xl`, weight 700, lh 0.97) |
| `.type-heading` | Section (`text-display-md`, weight 600, lh 1.05) |
| `.type-evidence` | Evidence title (`text-heading-sm`) |
| `.type-title` | Card title (`text-body-lg`, weight 500) |
| `.type-body` / `.type-body-sm` | Body lead / meta body |
| `.type-meta` | Mono label |
| `.type-citation-meta` | Citation metadata |
| `.type-micro` | Uppercase mono eyebrows (`tracking 0.18em`) |
| `.type-legal` | Legal / docs reading |

Avoid oversized marketing headlines inside the authenticated app.

## Spacing, radius, borders

- 4px base scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`
- App shell max width ~1440px; readable content ~960–1240px
- Mobile side padding ≥ 16px
- Radius: `3 / 5 / 8 / 12 / 16` (xs → xl), Memo.ly scale
- Prefer hairline dividers and tone shifts over boxing every section

## Brand mark

Components:

- `CitedMark` — bracket pair framing an evidence index mark
- `CitedWordmark` — lowercase `cited`
- `CitedLogo` — mark + wordmark lockup
- Favicon: `public/cited-mark.svg`

Do not include `.cc` in the primary wordmark.

## Buttons

`components/ui/button.tsx`

Variants: `primary`, `secondary`, `ghost`, `subtle`, `danger`, `citation`  
Sizes: `xs`, `sm`, `md`, `lg`, `icon`

Also: `IconButton` with required accessible label.

## Form controls

`TextInput`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FormField`

- Warm-black inset surfaces
- Accent focus ring
- Mono mode for domains, URLs, and technical IDs
- Labels are never placeholder-only

## Badges and signals

`Badge` / `SignalBadge` variants:

`default`, `new`, `citation`, `mention`, `recommendation`, `missed_opportunity`, `competitor`, `success`, `warning`, `danger`, `neutral`

Use mono metadata labels (`NEW`, `CITED`, `MISSED`), not colorful SaaS pills.

## Surfaces and overlays

`Card`, `NoteCard`, `InsetPanel`, `Divider`, `SectionHeader`, `EmptyState`, `Callout`, `Skeleton`, `Tooltip`, `Popover`, `DropdownMenu`, `Dialog`, `Sheet`, `Toast`, `Tabs`, `SegmentedControl`, `PaginationShell`, `CommandMenu`

### NoteCard

Signature citation-slip component. Variants: `default`, `citation`, `mention`, `opportunity`, `competitor`, `saved`, `warning`.

## Citation-specific components

| Component | Purpose |
| --- | --- |
| `CitationMarker` | `[01]`, `CITED`, `SOURCE` |
| `AiSurfaceBadge` | Neutral metadata badges for AI surfaces |
| `PromptReference` | Prompt evidence with truncate / copy |
| `SourceLink` | Safe truncated URL display |
| `HighlightedEvidence` | Tokenized highlights (no unsafe HTML) |
| `ScanStatusIndicator` | queued → failed / paused |
| `EventStateMarker` | new / seen / saved / archived / resolved |

Custom glyphs: `CitationBracket`, `CitationIndex`, `SourceSlip`, `EvidenceMarker`, `FootnoteGlyph`, `OccurrenceLedger`, `NotebookGlyph`, `PromptGlyph`, `AlertSlip`, `CitationDeskGlyph`, `ScanPulse`.

## App shell

- Desktop sidebar ~272px with logo, New monitor, primary nav, workspace block, account
- Mobile header + accessible sheet navigation
- `AppPageHeader` for page context
- Command palette (`⌘K` / `Ctrl+K`) with extensible command registry

Routes styled in Phase 2:

- `/app` Signal Desk
- `/app/inbox`
- `/app/monitors`
- `/app/notebook`
- `/app/settings`
- `/app/billing`

## Marketing primitives

`MarketingHeader`, `MarketingFooter`, `MarketingContainer`, `Eyebrow`, `MarketingSection`, `FeatureFrame`, `ProductPreviewFrame`, `QuoteBlock`, `InlineCta`

Ready for Phase 3 content without redesign.

## Motion

- CSS transitions by default
- Note cards rise 1–2px on hover (disabled under reduced motion)
- Command palette and dialogs use opacity / overlay, not bounce
- Scan pulse is restrained and reduced-motion safe

## Accessibility

- Visible `:focus-visible` rings using `cited-accent`
- Icon-only controls require `aria-label`
- Dialogs and sheets trap focus and restore it on close
- Menus and command palette are keyboard operable
- Do not communicate state by color alone
- Decorative marks use `aria-hidden`
- Tooltips are never the only path to critical information

## Anti-patterns

Avoid:

- Hard-coded hex colors in page files
- Fake live citation metrics or fabricated customer domains
- Giant glass panels and glow stacks
- Pill clusters and emoji-as-icons
- Hover-only affordances
- Lorem Ipsum
- Inconsistent casing of “Cited” (product name) vs `cited` (wordmark)

## Implementation map

```text
app/globals.css
components/ui/*
components/shared/*
components/app/*
components/marketing/*
lib/utils/cn.ts
docs/design-system.md
```
