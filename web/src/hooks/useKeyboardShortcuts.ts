import { useEffect } from "react";

import type { Strings } from "../i18n";

type Tab = "split" | "combine";

type ShortcutHandlers = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  focusTab: (tab: Tab) => void;
  helpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  strings: Strings;
  announce: (message: string, type?: "polite" | "assertive") => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

async function copyToClipboard(text: string) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function collectSplitSharesText(): string | null {
  const panel = document.getElementById("split-panel");
  if (!panel) return null;
  const shareBlocks = Array.from(
    panel.querySelectorAll<HTMLDivElement>('div[dir="ltr"].input')
  )
    .map((el) => el.innerText.trim())
    .filter(Boolean);
  if (shareBlocks.length === 0) return null;
  return shareBlocks.join("\n\n");
}

function collectCombineResultText(): string | null {
  const panel = document.getElementById("combine-panel");
  if (!panel) return null;
  const recovered = panel.querySelector<HTMLDivElement>('div[dir="auto"].input');
  const text = recovered?.innerText.trim();
  return text ? text : null;
}

function clickSubmit(tab: Tab) {
  const panelId = tab === "split" ? "split-panel" : "combine-panel";
  const panel = document.getElementById(panelId);
  const btn = panel?.querySelector<HTMLButtonElement>(
    'button[data-shortcut="submit"]'
  );
  btn?.click();
}

export function useKeyboardShortcuts({
  tab,
  setTab,
  focusTab,
  helpOpen,
  openHelp,
  closeHelp,
  strings,
  announce,
}: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.isComposing) return;
      if (e.defaultPrevented) return;

      // Avoid competing with browser/OS shortcuts.
      if (e.altKey) return;

      const editable = isEditableTarget(e.target);

      // Dismiss help
      if (helpOpen && e.key === "Escape") {
        e.preventDefault();
        closeHelp();
        return;
      }

      if (helpOpen) return;

      // Toggle shortcuts help
      if (!editable && !e.ctrlKey && !e.metaKey && e.key === "?") {
        e.preventDefault();
        if (helpOpen) closeHelp();
        else openHelp();
        return;
      }

      // Global tab switching (avoid when typing)
      if (!editable && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key === "1") {
          e.preventDefault();
          setTab("split");
          focusTab("split");
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          setTab("combine");
          focusTab("combine");
          return;
        }
      }

      // Submit form
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        clickSubmit(tab);
        return;
      }

      // Copy result
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c")) {
        const text = tab === "split" ? collectSplitSharesText() : collectCombineResultText();
        if (!text) return;
        e.preventDefault();
        copyToClipboard(text)
          .then(() => announce(strings.copied, "polite"))
          .catch(() => {
            // ignore
          });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [announce, closeHelp, focusTab, helpOpen, openHelp, setTab, strings.copied, tab]);
}
