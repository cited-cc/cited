import { cn } from "@/lib/utils";

type CitedMarkProps = {
  className?: string;
  size?: number;
  title?: string;
  decorative?: boolean;
};

/**
 * Polished app-icon tile: soft continuous corners, elevated face, and a
 * hairline rim so the mark reads on both paper and inverse chrome.
 */
export function CitedMark({
  className,
  size = 24,
  title = "Cited",
  decorative = false,
}: CitedMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      {/* Soft app-icon radius (~31% of edge), not a hard square */}
      <rect width="32" height="32" rx="10" fill="#1E1B25" />
      {/* Soft top face lift */}
      <rect
        x="1"
        y="1"
        width="30"
        height="14"
        rx="9"
        fill="#FFFFFF"
        fillOpacity="0.08"
      />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="9.5"
        stroke="#FBF7F0"
        strokeOpacity="0.22"
      />
      {/* Left citation bracket */}
      <path
        d="M10 8.5H8.75C7.78 8.5 7 9.28 7 10.25v11.5C7 22.72 7.78 23.5 8.75 23.5H10"
        stroke="#FBF7F0"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right citation bracket */}
      <path
        d="M22 8.5h1.25c.97 0 1.75.78 1.75 1.75v11.5c0 .97-.78 1.75-1.75 1.75H22"
        stroke="#FBF7F0"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Source-slip lines */}
      <rect
        x="11.5"
        y="11"
        width="9"
        height="1.75"
        rx="0.875"
        fill="#FBF7F0"
        fillOpacity="0.35"
      />
      <rect
        x="11.5"
        y="15.125"
        width="9"
        height="2.25"
        rx="1.125"
        fill="#5CE1E6"
      />
      <rect
        x="11.5"
        y="19.5"
        width="6.5"
        height="1.75"
        rx="0.875"
        fill="#FBF7F0"
        fillOpacity="0.55"
      />
    </svg>
  );
}
