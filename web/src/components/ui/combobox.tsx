import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "../../lib/cn";

export type ComboboxOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

type ComboboxProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: ComboboxOption<T>[];
  "aria-labelledby"?: string;
  className?: string;
  flash?: boolean;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn(
        "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
        open && "rotate-180"
      )}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.063a.75.75 0 111.1 1.02l-4.25 4.657a.75.75 0 01-1.11 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-emerald-400"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Combobox<T extends string = string>({
  value,
  onChange,
  options,
  "aria-labelledby": ariaLabelledby,
  className,
  flash,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedOption = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        listboxRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Reset focused index when opening
  useEffect(() => {
    if (open) {
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      // Focus the listbox when opened
      listboxRef.current?.focus();
    }
  }, [open, selectedIndex]);

  // Scroll focused option into view
  useEffect(() => {
    if (!open || focusedIndex < 0) return;
    const listbox = listboxRef.current;
    const focusedEl = listbox?.children[focusedIndex] as HTMLElement | undefined;
    focusedEl?.scrollIntoView({ block: "nearest" });
  }, [open, focusedIndex]);

  const selectOption = useCallback(
    (opt: ComboboxOption<T>) => {
      onChange(opt.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen(true);
        break;
    }
  };

  const handleListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          selectOption(options[focusedIndex]);
        }
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={ariaLabelledby}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "input mt-2 flex items-center justify-between gap-2 text-start transition-colors duration-1000 ease-out",
          flash && "border-emerald-300/70 bg-emerald-500/10",
          className
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{selectedOption?.label}</span>
          {selectedOption?.description && (
            <span className="truncate text-xs text-slate-400">
              {selectedOption.description}
            </span>
          )}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          ref={listboxRef}
          id={listId}
          role="listbox"
          aria-labelledby={ariaLabelledby}
          aria-activedescendant={
            focusedIndex >= 0 ? `${listId}-opt-${focusedIndex}` : undefined
          }
          tabIndex={0}
          onKeyDown={handleListKeyDown}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-emerald-500/20 bg-black/95 py-1 shadow-xl shadow-emerald-500/10 backdrop-blur-xl focus:outline-none"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIndex;

            return (
              <div
                key={opt.value}
                id={`${listId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => selectOption(opt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectOption(opt);
                  }
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={cn(
                  "dir-row cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  isFocused && "bg-emerald-500/15",
                  isSelected && "text-emerald-300"
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{opt.label}</span>
                  {opt.description && (
                    <span className="truncate text-xs text-slate-400">
                      {opt.description}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span className="shrink-0">
                    <CheckIcon />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
