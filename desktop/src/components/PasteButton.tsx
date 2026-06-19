import { useEffect, useState } from "react";

import { cn } from "../lib/cn";

type PasteButtonProps = {
  label: string;
  disabled?: boolean;
  onPaste: (text: string) => void | Promise<void>;
  className?: string;
};

function PasteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 4.5h6m-7 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v5m0 0 2-2m-2 2-2-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 4.5a2.5 2.5 0 0 1 5 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PasteButton({
  label,
  disabled = false,
  onPaste,
  className,
}: PasteButtonProps) {
  const [pasteSupported, setPasteSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detectPasteSupport() {
      const hasClipboardReadText =
        typeof navigator !== "undefined" &&
        !!navigator.clipboard &&
        typeof navigator.clipboard.readText === "function";
      const secureContext =
        typeof window === "undefined" ? true : window.isSecureContext;

      if (!hasClipboardReadText || !secureContext) {
        if (!cancelled) setPasteSupported(false);
        return;
      }

      if (
        typeof navigator === "undefined" ||
        !navigator.permissions ||
        typeof navigator.permissions.query !== "function"
      ) {
        if (!cancelled) setPasteSupported(false);
        return;
      }

      try {
        const status = await navigator.permissions.query({
          name: "clipboard-read" as PermissionName,
        });
        if (!cancelled) setPasteSupported(status.state === "granted");
      } catch {
        if (!cancelled) setPasteSupported(false);
      }
    }

    void detectPasteSupport();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!pasteSupported) return null;

  async function onClick() {
    if (disabled) return;

    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      await onPaste(text);
    } catch {
      // Ignore clipboard failures (permissions, insecure context, etc.).
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "h-9 w-9",
        "text-slate-400 transition-colors hover:text-slate-200",
        "bg-transparent hover:bg-transparent",
        "focus-visible:outline-none focus-visible:text-slate-100",
        "disabled:opacity-25 disabled:hover:text-slate-400",
        className,
      )}
    >
      <PasteIcon />
      <span className="sr-only">{label}</span>
    </button>
  );
}
