import { buildDitherAvatarSpec } from "@/lib/avatars/dither-avatar";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
} as const;

type DitherAvatarProps = {
  seed: string;
  size?: keyof typeof SIZE_CLASS | number;
  className?: string;
  title?: string;
};

export function DitherAvatar({
  seed,
  size = "md",
  className,
  title,
}: DitherAvatarProps) {
  const spec = buildDitherAvatarSpec(seed);
  const dimension = typeof size === "number" ? size : undefined;
  const sizeClass = typeof size === "string" ? SIZE_CLASS[size] : undefined;

  return (
    <svg
      role="img"
      aria-label={title ?? "Account avatar"}
      viewBox={`0 0 ${spec.gridSize} ${spec.gridSize}`}
      width={dimension}
      height={dimension}
      shapeRendering="crispEdges"
      className={cn(
        "shrink-0 overflow-hidden rounded-md border border-cited-line-subtle bg-cited-canvas",
        sizeClass,
        className,
      )}
    >
      {spec.pixels.map((fill, index) => {
        const x = index % spec.gridSize;
        const y = Math.floor(index / spec.gridSize);
        return (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}
