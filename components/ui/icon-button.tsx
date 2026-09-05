"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: Extract<ButtonSize, "xs" | "sm" | "md" | "lg" | "icon">;
  tooltip?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      icon,
      variant = "ghost",
      size = "icon",
      tooltip,
      className,
      title,
      ...props
    },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size === "icon" ? "icon" : size}
        aria-label={label}
        title={tooltip ?? title ?? label}
        className={cn(size !== "icon" && "px-2", className)}
        {...props}
      >
        {icon}
      </Button>
    );
  },
);
