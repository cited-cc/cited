"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type DropdownItem = {
  id: string;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  separatorBefore?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  side?: "top" | "bottom";
  label?: string;
  className?: string;
  menuClassName?: string;
  /** Render the menu in a portal with fixed positioning so it is never clipped. */
  portal?: boolean;
  /** Minimum menu width in px. Defaults to trigger width when unset. */
  menuMinWidth?: number;
};

const MENU_GAP = 6;
const VIEWPORT_PADDING = 8;

function getEnabledIndex(items: DropdownItem[], index: number) {
  if (items[index] && !items[index].disabled) return index;
  return items.findIndex((item) => !item.disabled);
}

function computeMenuStyle({
  triggerRect,
  menuHeight,
  align,
  side,
  menuWidth,
}: {
  triggerRect: DOMRect;
  menuHeight: number;
  align: "start" | "end";
  side: "top" | "bottom";
  menuWidth: number;
}): { style: CSSProperties; resolvedSide: "top" | "bottom" } {
  let resolvedSide = side;
  const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
  const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING;

  if (
    resolvedSide === "top" &&
    menuHeight > 0 &&
    menuHeight + MENU_GAP > spaceAbove &&
    spaceBelow > spaceAbove
  ) {
    resolvedSide = "bottom";
  } else if (
    resolvedSide === "bottom" &&
    menuHeight > 0 &&
    menuHeight + MENU_GAP > spaceBelow &&
    spaceAbove > spaceBelow
  ) {
    resolvedSide = "top";
  }

  let top =
    resolvedSide === "top"
      ? triggerRect.top - MENU_GAP
      : triggerRect.bottom + MENU_GAP;

  let left =
    align === "end" ? triggerRect.right - menuWidth : triggerRect.left;

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PADDING),
  );

  if (resolvedSide === "top" && menuHeight > 0) {
    top = Math.max(VIEWPORT_PADDING + menuHeight, top);
  } else if (resolvedSide === "bottom" && menuHeight > 0) {
    top = Math.min(
      window.innerHeight - VIEWPORT_PADDING - menuHeight,
      top,
    );
  }

  const style: CSSProperties = {
    position: "fixed",
    top,
    left,
    width: menuWidth,
    zIndex: 65,
  };

  if (resolvedSide === "top") {
    style.transform = "translateY(-100%)";
  }

  return { style, resolvedSide };
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  side = "bottom",
  label = "Menu",
  className,
  menuClassName,
  portal = true,
  menuMinWidth,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  /* eslint-disable react-hooks/set-state-in-effect -- hydration gate for portal rendering */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useLayoutEffect(() => {
    if (!open || !portal) return;

    function updatePosition() {
      const triggerEl = triggerRef.current;
      const menuEl = menuRef.current;
      if (!triggerEl) return;

      const triggerRect = triggerEl.getBoundingClientRect();
      const menuWidth = Math.max(
        menuMinWidth ?? 0,
        triggerRect.width,
        180,
      );
      const menuHeight = menuEl?.getBoundingClientRect().height ?? 0;
      const { style } = computeMenuStyle({
        triggerRect,
        menuHeight,
        align,
        side,
        menuWidth,
      });
      setMenuStyle(style);
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, portal, align, side, menuMinWidth, items.length]);

  /* eslint-disable react-hooks/set-state-in-effect -- reset keyboard focus when menu opens */
  useEffect(() => {
    if (!open) return;

    const firstEnabled = getEnabledIndex(items, 0);
    if (firstEnabled >= 0) setActive(firstEnabled);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((current) => {
          for (let index = current + 1; index < items.length; index += 1) {
            if (!items[index]?.disabled) return index;
          }
          return current;
        });
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((current) => {
          for (let index = current - 1; index >= 0; index -= 1) {
            if (!items[index]?.disabled) return index;
          }
          return current;
        });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = items[active];
        if (item && !item.disabled) {
          item.onSelect?.();
          setOpen(false);
        }
      }
    }

    function onPointer(e: globalThis.MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, active, items]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const menuList = (
    <ul
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-label={label}
      style={portal && open ? menuStyle : undefined}
      className={cn(
        "overflow-hidden rounded-md border border-cited-line bg-cited-surface-raised py-1 cited-overlay-shadow",
        portal
          ? "fixed z-[65]"
          : cn(
              "absolute z-50 w-full min-w-0",
              side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
              align === "end" ? "right-0" : "left-0",
            ),
        menuClassName,
      )}
    >
      {items.map((item, index) => (
        <li key={item.id} role="none">
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-cited-surface-hover disabled:opacity-40",
              index === active && "bg-cited-surface-hover",
              item.danger ? "text-cited-danger" : "text-cited-ink",
              item.separatorBefore && "mt-1 border-t border-cited-line-subtle",
            )}
            onMouseEnter={() => setActive(index)}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect?.();
              setOpen(false);
            }}
          >
            <span className="flex min-w-0 items-center gap-2">
              {item.icon ? (
                <span className="shrink-0 text-cited-ink-subtle">{item.icon}</span>
              ) : null}
              <span className="truncate">{item.label}</span>
            </span>
            {item.shortcut ? (
              <span className="font-mono text-[10px] tracking-[0.06em] text-cited-ink-faint">
                {item.shortcut}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );

  const triggerNode = isValidElement<{
    onClick?: (event: MouseEvent) => void;
    "aria-haspopup"?: "menu" | boolean;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
  }>(trigger)
    ? cloneElement(
        trigger as ReactElement<{
          onClick?: (event: MouseEvent) => void;
          "aria-haspopup"?: "menu" | boolean;
          "aria-expanded"?: boolean;
          "aria-controls"?: string;
        }>,
        {
          onClick: (event: MouseEvent) => {
            trigger.props.onClick?.(event);
            if (!event.defaultPrevented) {
              setOpen((value) => !value);
            }
          },
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-controls": open ? menuId : undefined,
        },
      )
    : trigger;

  return (
    <div
      className={cn("group relative", className)}
      data-state={open ? "open" : "closed"}
    >
      <div ref={triggerRef}>{triggerNode}</div>
      {open
        ? portal && mounted
          ? createPortal(menuList, document.body)
          : !portal
            ? menuList
            : null
        : null}
    </div>
  );
}
