"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { TextInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

export function Combobox({
  options,
  value = "",
  onChange,
  placeholder = "Search…",
  mono = false,
  invalid = false,
  disabled = false,
  id,
  className,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const query = draft ?? value;

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setDraft(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectOption(opt: ComboboxOption) {
    setDraft(null);
    onChange?.(opt.value);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setDraft(null);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      selectOption(filtered[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <TextInput
        id={id}
        value={query}
        disabled={disabled}
        invalid={invalid}
        mono={mono}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border border-cited-line bg-cited-surface-raised py-1 cited-overlay-shadow"
        >
          {filtered.map((opt, index) => (
            <li key={opt.value} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full px-3 py-2 text-left text-sm text-cited-ink transition hover:bg-cited-surface-hover",
                  index === activeIndex && "bg-cited-surface-hover",
                  mono && "font-mono text-[13px]",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(opt)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
