import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "subtle"
  | "danger"
  | "citation";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

/** Use on buttons inside responsive action rows. */
export const buttonRowItemClassName = "w-full sm:w-auto";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-cited-ink text-cited-canvas hover:bg-cited-primary-hover active:bg-cited-primary-hover border border-transparent shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_8px_20px_rgba(21,19,26,0.12)]",
  secondary:
    "bg-cited-surface-raised text-cited-ink border border-cited-line hover:bg-cited-surface-hover hover:border-cited-line-strong",
  ghost:
    "bg-transparent text-cited-ink-muted border border-transparent hover:bg-cited-surface-hover hover:text-cited-ink",
  subtle:
    "bg-cited-surface text-cited-ink-muted border border-cited-line-subtle hover:bg-cited-surface-hover hover:text-cited-ink",
  danger:
    "bg-cited-danger-muted text-cited-danger border border-cited-danger/20 hover:bg-cited-danger/20",
  citation:
    "bg-cited-accent-bright text-cited-accent-ink border border-transparent hover:brightness-105",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "h-8 min-h-8 rounded-[var(--cited-radius-sm)] px-3 text-[length:var(--text-caption)]",
  sm: "h-9 min-h-9 rounded-[var(--cited-radius-sm)] px-4 text-[length:var(--text-body-sm)]",
  md: "h-10 min-h-10 rounded-[var(--cited-radius-md)] px-4 text-[length:var(--text-body-md)]",
  lg: "h-12 min-h-12 rounded-[var(--cited-radius-md)] px-6 text-[length:var(--text-body-lg)]",
  icon: "h-10 w-10 min-h-10 min-w-10 rounded-[var(--cited-radius-md)] p-0",
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(
    "box-border inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-sans font-medium leading-none transition-[background-color,border-color,color,filter,opacity,transform,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cited-canvas active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

type ButtonContentProps = {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size: ButtonSize;
  children?: ReactNode;
};

function ButtonContent({
  loading,
  leftIcon,
  rightIcon,
  size,
  children,
}: ButtonContentProps) {
  return (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0" aria-hidden>
          {leftIcon}
        </span>
      ) : null}
      {size === "icon" ? children : children}
      {!loading && rightIcon ? (
        <span className="inline-flex shrink-0" aria-hidden>
          {rightIcon}
        </span>
      ) : null}
    </>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      href,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const classes = buttonClassName(variant, size, className);
    const content = (
      <ButtonContent
        loading={loading}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        size={size}
      >
        {children}
      </ButtonContent>
    );

    if (href && !isDisabled) {
      const { onClick, ...rest } = props;
      return (
        <Link
          href={href}
          className={classes}
          aria-busy={loading || undefined}
          onClick={onClick as ComponentProps<typeof Link>["onClick"]}
          {...(rest as Omit<ComponentProps<typeof Link>, "href" | "className" | "children" | "onClick">)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  },
);

type ButtonRowProps = {
  children: ReactNode;
  className?: string;
};

/** Responsive row for form-backed or standalone action buttons. */
export function ButtonRow({ children, className }: ButtonRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonRowFormProps = {
  action: string | ((formData: FormData) => void | Promise<void>);
  children: ReactNode;
  className?: string;
};

/** Wrapper for a single action button inside ButtonRow. */
export function ButtonRowForm({
  action,
  children,
  className,
}: ButtonRowFormProps) {
  return (
    <form action={action} className={cn("w-full sm:w-auto", className)}>
      {children}
    </form>
  );
}
