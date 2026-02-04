import { useEffect, useMemo, useRef } from "react";

import type { Lang, Strings } from "../i18n";
import { cn } from "../lib/cn";

type ShortcutRow = {
  keys: string;
  action: string;
};

type KeyboardShortcutsHelpProps = {
  open: boolean;
  lang: Lang;
  strings: Strings;
  onClose: () => void;
};

function kbdLabel(keys: string) {
  return (
    <span
      dir="ltr"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-200"
    >
      {keys.split("+").map((k, i) => (
        <span
          key={`${i}-${k}`}
          className="rounded-md border border-emerald-500/20 bg-black/40 px-2 py-1"
        >
          {k.trim()}
        </span>
      ))}
    </span>
  );
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter((el) => !el.hasAttribute("disabled"));
}

export function KeyboardShortcutsHelp({
  open,
  lang,
  strings,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const rows = useMemo((): ShortcutRow[] => {
    const ctrlOrCmd = "Ctrl/Cmd";

    return [
      { keys: "1", action: strings.shortcutGoToSplit },
      { keys: "2", action: strings.shortcutGoToCombine },
      { keys: "?", action: strings.shortcutShowHelp },
      { keys: `${ctrlOrCmd}+Enter`, action: strings.shortcutSubmitForm },
      { keys: `${ctrlOrCmd}+Shift+C`, action: strings.shortcutCopyResult },
    ];
  }, [strings]);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      lastFocusedRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const items = focusableElements(dialog);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      const active = document.activeElement as HTMLElement | null;
      if (!active) return;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" aria-hidden={false}>
      <button
        type="button"
        aria-label={strings.shortcutClose}
        tabIndex={-1}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto flex min-h-full max-w-2xl items-center px-4 py-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={strings.keyboardShortcuts}
          className="glass w-full p-4 sm:p-6"
        >
          <div className="dir-row items-start justify-between gap-4">
            <div className="text-start">
              <h2 className="text-lg font-semibold text-emerald-100">
                {strings.keyboardShortcuts}
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                {lang === "en"
                  ? "These shortcuts work on desktop keyboards."
                  : "تعمل هذه الاختصارات على لوحات المفاتيح."}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className={cn(
                "btn-ghost h-11 min-w-[44px] px-3 py-2 text-xs",
                "shrink-0"
              )}
            >
              {strings.shortcutClose}
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-500/15 bg-black/35">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 p-3 sm:p-4">
              {rows.map((row) => (
                <div
                  key={`${row.keys}-${row.action}`}
                  className="contents"
                >
                  <div className="text-start">{kbdLabel(row.keys)}</div>
                  <div className="text-start text-sm text-slate-200">
                    {row.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {lang === "en"
              ? "Tip: use Left/Right arrows on the Split/Combine tabs."
              : "تلميح: استخدم السهمين يمينا ويسارا على تبويبات التقسيم والاستعادة."}
          </p>
        </div>
      </div>
    </div>
  );
}
