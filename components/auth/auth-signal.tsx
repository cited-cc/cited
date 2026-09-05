import { cn } from "@/lib/utils";

type AuthSignalProps = {
  className?: string;
};

/**
 * Decorative stacked citation notes for the auth aside (memo folded-signal role).
 */
export function AuthSignal({ className }: AuthSignalProps) {
  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ perspective: "1000px" }}
      aria-hidden
    >
      <div
        className="relative h-44 w-64"
        style={{ transformStyle: "preserve-3d" }}
      >
        <NoteCard
          z={3}
          foldGap={22}
          accent="var(--cited-accent-bright)"
          surface="var(--cited-surface)"
        />
        <NoteCard
          z={2}
          foldGap={12}
          accent="var(--cited-ink)"
          surface="var(--cited-surface-raised)"
        />
        <NoteCard
          z={1}
          foldGap={2}
          accent="var(--cited-ink-muted)"
          surface="var(--cited-surface)"
        />
      </div>
    </div>
  );
}

function NoteCard({
  z,
  foldGap,
  accent,
  surface,
}: {
  z: number;
  foldGap: number;
  accent: string;
  surface: string;
}) {
  return (
    <div
      className="absolute inset-0 rounded-[var(--cited-radius-lg)] border border-cited-line shadow-[var(--cited-shadow-note)]"
      style={{
        backgroundColor: surface,
        transformStyle: "preserve-3d",
        transformOrigin: "top center",
        transform: `rotateX(${foldGap * 0.35}deg) translateZ(${(3 - z) * -8}px)`,
        zIndex: z,
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span className="h-2 w-20 rounded-full bg-cited-line" />
      </div>
      <div className="space-y-2 px-4 pt-4">
        <span className="block h-2.5 w-44 rounded-full bg-cited-line" />
        <span className="block h-2.5 w-32 rounded-full bg-cited-line" />
        <span
          className="mt-3 block h-6 w-24 rounded-[var(--cited-radius-sm)] opacity-90"
          style={{ backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
