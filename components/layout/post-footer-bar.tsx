import { CitationBracket, FootnoteGlyph } from "@/components/shared/cited-glyphs";
import { CitedMark } from "@/components/shared/cited-mark";
import { cn } from "@/lib/utils";

export type PostFooterBarProps = {
  variant?: "marketing" | "docs" | "minimal";
  className?: string;
};

const COPYRIGHT_YEAR = 2026;

type Tone = "accent" | "paper" | "faint" | "outline-paper" | "outline-accent";
type DisplaySize = "xl" | "lg" | "md";

type StripItem =
  | { kind: "mark"; compact?: boolean }
  | { kind: "display"; text: string; tone: Tone; size: DisplaySize }
  | { kind: "domain"; size: DisplaySize }
  | { kind: "phrase"; text: string; tone: Tone; size: Exclude<DisplaySize, "xl"> }
  | { kind: "outline"; text: string; tone: "paper" | "accent"; size: "lg" | "xl" }
  | { kind: "mono"; text: string; tone: Tone; display?: boolean }
  | { kind: "bracket"; compact?: boolean }
  | { kind: "dot"; compact?: boolean }
  | { kind: "rule"; compact?: boolean }
  | { kind: "plus"; compact?: boolean }
  | { kind: "wordmark" };

const PRIMARY_ITEMS: readonly StripItem[] = [
  { kind: "mark" },
  { kind: "domain", size: "xl" },
  { kind: "bracket" },
  {
    kind: "phrase",
    text: "Built for people who want the receipt.",
    tone: "paper",
    size: "lg",
  },
  { kind: "rule" },
  { kind: "mark" },
  {
    kind: "phrase",
    text: "Citation evidence on file",
    tone: "accent",
    size: "md",
  },
  { kind: "outline", text: "cited", tone: "paper", size: "xl" },
  { kind: "dot" },
  { kind: "outline", text: "Open the receipt", tone: "accent", size: "lg" },
  { kind: "display", text: "CITED", tone: "paper", size: "lg" },
  { kind: "mark" },
  { kind: "plus" },
  {
    kind: "phrase",
    text: "Source ledger for AI search",
    tone: "faint",
    size: "md",
  },
  { kind: "bracket" },
  {
    kind: "phrase",
    text: "Selected prompts. Supported surfaces.",
    tone: "paper",
    size: "md",
  },
  { kind: "mark" },
  {
    kind: "phrase",
    text: "Know when you are cited",
    tone: "accent",
    size: "lg",
  },
  { kind: "rule" },
  { kind: "mono", text: "SOURCE LEDGER", tone: "outline-paper", display: true },
];

const SECONDARY_ITEMS: readonly StripItem[] = [
  { kind: "mono", text: "CITATION INBOX", tone: "faint", display: true },
  { kind: "plus", compact: true },
  { kind: "mark", compact: true },
  { kind: "rule", compact: true },
  { kind: "mono", text: "Evidence note", tone: "outline-paper" },
  { kind: "bracket", compact: true },
  { kind: "mono", text: "CITED", tone: "accent", display: true },
  { kind: "dot", compact: true },
  { kind: "mono", text: "Proof on file", tone: "paper" },
  { kind: "plus", compact: true },
  { kind: "mono", text: "First seen by Cited", tone: "faint" },
  { kind: "mark", compact: true },
  { kind: "rule", compact: true },
  { kind: "mono", text: "SOURCE SLIP", tone: "outline-accent", display: true },
  { kind: "bracket", compact: true },
  { kind: "mono", text: "Occurrence ledger", tone: "paper" },
  { kind: "wordmark" },
  { kind: "plus", compact: true },
  { kind: "mono", text: "CITED.CC", tone: "paper", display: true },
  { kind: "dot", compact: true },
  { kind: "mono", text: "Keep the receipt", tone: "outline-paper" },
  { kind: "mark", compact: true },
  { kind: "rule", compact: true },
  { kind: "mono", text: "Watch the prompts that matter", tone: "accent" },
];

function toneClass(tone: Tone) {
  switch (tone) {
    case "accent":
      return "text-cited-accent-bright";
    case "paper":
      return "text-cited-on-inverse";
    case "faint":
      return "text-cited-on-inverse-faint";
    case "outline-paper":
      return "cited-brand-strip-outline cited-brand-strip-outline-paper";
    case "outline-accent":
      return "cited-brand-strip-outline cited-brand-strip-outline-accent";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function displaySizeClass(size: DisplaySize) {
  switch (size) {
    case "xl":
      return "text-[clamp(2.75rem,6vw,5.5rem)]";
    case "lg":
      return "text-[clamp(1.35rem,2.8vw,2.75rem)]";
    case "md":
      return "text-[clamp(1.05rem,2vw,1.65rem)]";
    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}

function StripGlyph({ item }: { item: StripItem }) {
  switch (item.kind) {
    case "mark": {
      const size = item.compact ? 28 : 52;
      return (
        <CitedMark
          decorative
          size={size}
          className={cn(
            item.compact
              ? "h-[clamp(1.25rem,2vw,1.75rem)] w-[clamp(1.25rem,2vw,1.75rem)]"
              : "h-[clamp(2rem,3.5vw,3.25rem)] w-[clamp(2rem,3.5vw,3.25rem)]",
          )}
        />
      );
    }
    case "display":
      return (
        <span
          className={cn(
            "font-display font-bold uppercase leading-none tracking-tight",
            displaySizeClass(item.size),
            toneClass(item.tone),
          )}
        >
          {item.text}
        </span>
      );
    case "domain":
      return (
        <span
          className={cn(
            "font-display font-extrabold lowercase leading-none tracking-[-0.04em] text-cited-on-inverse",
            displaySizeClass(item.size),
          )}
        >
          cited
          <span className="text-cited-accent-bright">.</span>
          cc
        </span>
      );
    case "phrase":
      return (
        <span
          className={cn(
            "whitespace-nowrap font-display leading-none tracking-tight",
            item.size === "lg"
              ? "text-[clamp(1.35rem,2.8vw,2.75rem)] font-bold"
              : "text-[clamp(1.05rem,2vw,1.65rem)] font-semibold",
            toneClass(item.tone),
          )}
        >
          {item.text}
        </span>
      );
    case "outline":
      return (
        <span
          className={cn(
            "whitespace-nowrap font-display font-bold leading-none tracking-tight",
            item.size === "xl"
              ? "text-[clamp(2rem,4vw,3.5rem)]"
              : "text-[clamp(1.35rem,2.8vw,2.75rem)]",
            item.tone === "paper"
              ? "cited-brand-strip-outline cited-brand-strip-outline-paper"
              : "cited-brand-strip-outline cited-brand-strip-outline-accent",
            item.text === "cited" && "lowercase",
          )}
        >
          {item.text}
        </span>
      );
    case "mono":
      return (
        <span
          className={cn(
            "whitespace-nowrap uppercase leading-none",
            item.display
              ? "font-display text-[clamp(0.75rem,1.4vw,0.875rem)] font-bold tracking-[0.22em]"
              : "font-mono text-[clamp(0.65rem,1.1vw,0.75rem)] tracking-[0.18em]",
            toneClass(item.tone),
          )}
        >
          {item.text}
        </span>
      );
    case "bracket":
      return (
        <CitationBracket
          size={item.compact ? 12 : 18}
          className="text-cited-accent-bright/80"
        />
      );
    case "dot":
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-cited-accent-bright/35",
            item.compact ? "h-1.5 w-1.5" : "h-2.5 w-2.5",
          )}
          aria-hidden
        >
          <span className="h-[3px] w-[3px] rounded-full bg-cited-accent-bright/70" />
        </span>
      );
    case "rule":
      return (
        <span
          className={cn(
            "inline-block w-px bg-cited-on-inverse/20",
            item.compact ? "h-5" : "h-8 sm:h-10",
          )}
          aria-hidden
        />
      );
    case "plus":
      return (
        <span
          className={cn(
            "font-mono leading-none text-cited-on-inverse/30",
            item.compact ? "text-xs" : "text-lg",
          )}
          aria-hidden
        >
          +
        </span>
      );
    case "wordmark":
      return (
        <span
          className="font-display text-[clamp(0.875rem,1.5vw,1rem)] font-bold lowercase leading-none tracking-tight text-cited-accent-bright"
          aria-hidden
        >
          cited
        </span>
      );
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}

function StripRow({
  items,
  idPrefix,
  gapClass,
  padClass,
}: {
  items: readonly StripItem[];
  idPrefix: string;
  gapClass: string;
  padClass: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center", gapClass, padClass)}>
      {items.map((item, index) => (
        <div
          key={`${idPrefix}-${item.kind}-${index}`}
          className="flex shrink-0 items-center"
        >
          <StripGlyph item={item} />
        </div>
      ))}
    </div>
  );
}

function MarqueeTrack({
  items,
  duration,
  reverse = false,
  gapClass,
  padClass,
  idPrefix,
}: {
  items: readonly StripItem[];
  duration: string;
  reverse?: boolean;
  gapClass: string;
  padClass: string;
  idPrefix: string;
}) {
  return (
    <div
      className={cn(
        "cited-brand-strip-track flex w-max items-center",
        gapClass,
        reverse && "cited-brand-strip-track-reverse",
      )}
      style={{ ["--cited-marquee-duration" as string]: duration }}
    >
      <StripRow
        items={items}
        idPrefix={`${idPrefix}-a`}
        gapClass={gapClass}
        padClass={padClass}
      />
      <StripRow
        items={items}
        idPrefix={`${idPrefix}-b`}
        gapClass={gapClass}
        padClass={padClass}
      />
    </div>
  );
}

/**
 * Brand signature strip below the marketing footer.
 * Public pages only. No Accomplish link (no verified URL in repo).
 */
export function PostFooterBar({
  variant = "marketing",
  className,
}: PostFooterBarProps) {
  const compact = variant === "minimal";

  return (
    <section
      aria-label="Cited brand signature"
      className={cn(
        "cited-ledger-shimmer relative overflow-hidden border-t border-cited-inverse-line bg-cited-inverse text-cited-on-inverse",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cited-accent-bright/35 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(251 247 240) 1px, transparent 1px), linear-gradient(to bottom, rgb(251 247 240) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-cited-accent-bright/[0.04] blur-3xl"
      />

      {!compact ? (
        <>
          <div className="relative motion-reduce:hidden">
            <div className="cited-brand-strip-fade overflow-hidden" aria-hidden>
              <MarqueeTrack
                items={PRIMARY_ITEMS}
                duration="72s"
                gapClass="gap-10 sm:gap-14 lg:gap-20"
                padClass="py-7 sm:py-9"
                idPrefix="primary"
              />
            </div>
            <div
              className="cited-brand-strip-fade overflow-hidden border-t border-cited-inverse-line/80"
              aria-hidden
            >
              <MarqueeTrack
                items={SECONDARY_ITEMS}
                duration="96s"
                reverse
                gapClass="gap-6 sm:gap-10 lg:gap-14"
                padClass="py-4 sm:py-5"
                idPrefix="secondary"
              />
            </div>
          </div>

          <div className="relative hidden motion-reduce:block">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 px-5 py-8 sm:gap-x-12 sm:px-8 sm:py-10">
              <CitedMark decorative size={52} className="h-12 w-12" />
              <span className="font-display text-[clamp(2.75rem,6vw,5.5rem)] font-extrabold lowercase leading-none tracking-[-0.04em] text-cited-on-inverse">
                cited
                <span className="text-cited-accent-bright">.</span>
                cc
              </span>
              <CitationBracket
                size={18}
                className="text-cited-accent-bright/80"
              />
              <span className="whitespace-nowrap font-display text-[clamp(1.35rem,2.8vw,2.75rem)] font-bold leading-none tracking-tight text-cited-on-inverse">
                Built for people who want the receipt.
              </span>
              <span
                className="inline-block h-8 w-px bg-cited-on-inverse/20 sm:h-10"
                aria-hidden
              />
              <span className="whitespace-nowrap font-display text-[clamp(1.05rem,2vw,1.65rem)] font-semibold leading-none tracking-tight text-cited-accent-bright">
                Citation evidence on file
              </span>
              <span className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold lowercase leading-none tracking-tight cited-brand-strip-outline cited-brand-strip-outline-paper">
                cited
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 border-t border-cited-inverse-line/80 px-5 py-5 sm:gap-x-8 sm:px-8 sm:py-6">
              <span className="font-display text-[clamp(0.75rem,1.4vw,0.875rem)] font-bold uppercase leading-none tracking-[0.22em] text-cited-on-inverse-faint">
                SOURCE LEDGER
              </span>
              <span
                className="font-mono text-xs leading-none text-cited-on-inverse/30"
                aria-hidden
              >
                +
              </span>
              <FootnoteGlyph size={12} className="text-cited-accent-bright" />
              <span className="whitespace-nowrap font-mono text-[clamp(0.65rem,1.1vw,0.75rem)] uppercase leading-none tracking-[0.18em] text-cited-on-inverse">
                Proof on file
              </span>
              <span className="font-display text-[clamp(0.75rem,1.4vw,0.875rem)] font-bold uppercase leading-none tracking-[0.22em] text-cited-accent-bright">
                CITED
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] text-cited-on-inverse-muted uppercase">
            <FootnoteGlyph size={12} className="text-cited-accent-bright" />
            <span className="text-cited-accent-bright">[</span>
            <span className="text-cited-on-inverse">CITED</span>
            <span className="text-cited-accent-bright">]</span>
            <span className="hidden text-cited-on-inverse-faint sm:inline">
              {"//"}
            </span>
            <span className="hidden text-cited-on-inverse-muted sm:inline">
              SOURCE LEDGER
            </span>
          </p>
          <p className="type-meta text-cited-on-inverse-faint">
            Built for people who want the receipt.
          </p>
        </div>
      )}

      <div className="relative border-t border-cited-inverse-line/60 px-5 pb-8 pt-5 sm:px-8 sm:pb-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-cited-on-inverse-faint">
            © {COPYRIGHT_YEAR} Cited. All rights reserved.
          </p>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.24em] text-cited-accent-bright sm:text-right">
            Cited · The citation inbox for AI search
          </p>
        </div>
      </div>

      <p className="sr-only">
        Cited. Citation inbox for AI search. Built for people who want the
        receipt. Citation evidence on file. Source ledger. Know when you are
        cited. Selected prompts. Supported surfaces.
      </p>
    </section>
  );
}
