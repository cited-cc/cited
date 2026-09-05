import Link from "next/link";

import { CitedMark } from "@/components/shared/cited-mark";
import { CitedWordmark } from "@/components/shared/cited-wordmark";
import { cn } from "@/lib/utils";

type CitedLogoProps = {
  className?: string;
  href?: string | null;
  markSize?: number;
  showWordmark?: boolean;
  onClick?: () => void;
};

export function CitedLogo({
  className,
  href = "/",
  markSize = 24,
  showWordmark = true,
  onClick,
}: CitedLogoProps) {
  const content = (
    <>
      <CitedMark size={markSize} decorative={showWordmark} />
      {showWordmark ? <CitedWordmark /> : null}
      <span className="sr-only">Cited home</span>
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-2.5 rounded-sm text-cited-ink transition-opacity hover:opacity-90 focus-visible:outline-none",
    className,
  );

  if (href === null) {
    return (
      <span className={classes} onClick={onClick}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  );
}
