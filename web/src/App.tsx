import { useCallback, useEffect, useRef, useState } from "react";

import logoUrl from "./assets/logo.svg";

import { CombineForm } from "./components/CombineForm";
import { KeytipsOverlay } from "./components/KeytipsOverlay";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { LiveRegion } from "./components/LiveRegion";
import { SplitForm } from "./components/SplitForm";
import { EncryptedText } from "./components/ui/encrypted-text";
import { LiveRegionProvider } from "./context/LiveRegionContext";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useLiveRegion } from "./hooks/useLiveRegion";
import { STRINGS, type Lang } from "./i18n";

type Tab = "split" | "combine";

const LANG_KEY = "sp_lang";

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function applyDocumentPrefs(lang: Lang) {
  const html = document.documentElement;
  html.classList.add("dark");
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
}

function getInitialLang(): Lang {
  const stored = safeRead(LANG_KEY);
  return stored === "ar" ? "ar" : "en";
}

function Background() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#f4f7fa]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.96),transparent_38%),radial-gradient(circle_at_82%_8%,rgba(201,150,62,0.11),transparent_30%),radial-gradient(circle_at_45%_72%,rgba(42,103,155,0.10),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,rgba(13,43,79,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,43,79,0.05)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -left-28 top-44 h-72 w-[42rem] rotate-[-18deg] rounded-full bg-white/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-80 w-[44rem] rotate-[14deg] rounded-full bg-[#dcebf7]/50 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#eef3f8]" />
    </>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.565 2 12.196c0 4.508 2.865 8.333 6.839 9.681.5.095.682-.22.682-.49 0-.24-.009-.876-.014-1.72-2.782.62-3.369-1.368-3.369-1.368-.454-1.176-1.11-1.49-1.11-1.49-.908-.64.069-.627.069-.627 1.004.073 1.532 1.052 1.532 1.052.892 1.558 2.341 1.108 2.913.847.091-.664.35-1.108.636-1.363-2.22-.263-4.555-1.137-4.555-5.06 0-1.118.39-2.031 1.029-2.747-.103-.262-.446-1.318.098-2.749 0 0 .84-.276 2.75 1.05A9.29 9.29 0 0 1 12 7.07c.851.004 1.708.117 2.507.344 1.909-1.326 2.748-1.05 2.748-1.05.546 1.431.203 2.487.1 2.749.64.716 1.028 1.629 1.028 2.747 0 3.932-2.339 4.794-4.566 5.053.359.314.678.93.678 1.874 0 1.353-.012 2.444-.012 2.777 0 .272.18.59.688.489C19.138 20.525 22 16.7 22 12.196 22 6.565 17.523 2 12 2Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20.317 4.369A19.791 19.791 0 0 0 15.467 3c-.21.375-.445.88-.609 1.275a18.27 18.27 0 0 0-5.716 0A12.945 12.945 0 0 0 8.533 3a19.736 19.736 0 0 0-4.85 1.369C.61 9.007-.22 13.53.195 17.989a19.896 19.896 0 0 0 5.948 2.989c.48-.675.908-1.388 1.275-2.134a12.74 12.74 0 0 1-2.008-.969c.164-.117.324-.241.477-.371 3.873 1.822 8.084 1.822 11.912 0 .156.13.316.254.477.371a12.78 12.78 0 0 1-2.011.971c.366.744.794 1.457 1.275 2.132a19.832 19.832 0 0 0 5.949-2.989c.487-5.165-.83-9.646-3.172-13.62ZM8.02 15.271c-1.155 0-2.102-1.054-2.102-2.349 0-1.294.927-2.348 2.102-2.348 1.185 0 2.113 1.064 2.102 2.348 0 1.295-.927 2.349-2.102 2.349Zm7.959 0c-1.155 0-2.102-1.054-2.102-2.349 0-1.294.927-2.348 2.102-2.348 1.185 0 2.113 1.064 2.102 2.348 0 1.295-.917 2.349-2.102 2.349Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-[#2a679b]"
      aria-hidden="true"
    >
      <path
        d="M12 2 4.5 5.5v6.1c0 5.2 3.3 9.9 7.5 10.9 4.2-1 7.5-5.7 7.5-10.9V5.5L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.4 11 14l3.5-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("split");
  const [lang, setLang] = useState<Lang>(() => getInitialLang());
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [keytipsActive, setKeytipsActive] = useState(false);
  const { announcements, announce } = useLiveRegion();

  const splitTabRef = useRef<HTMLButtonElement>(null);
  const combineTabRef = useRef<HTMLButtonElement>(null);

  const helpUrl =
    import.meta.env.VITE_HELP_URL ?? (lang === "ar" ? "/help/ar/" : "/help/");

  const strings = STRINGS[lang];

  const focusTab = useCallback((next: Tab) => {
    const el = next === "split" ? splitTabRef.current : combineTabRef.current;
    el?.focus();
  }, []);

  useKeyboardShortcuts({
    tab,
    setTab,
    focusTab,
    helpOpen: shortcutsOpen,
    openHelp: () => setShortcutsOpen(true),
    closeHelp: () => setShortcutsOpen(false),
    keytipsActive,
    showKeytips: () => setKeytipsActive(true),
    hideKeytips: () => setKeytipsActive(false),
    strings,
    announce,
  });

  useEffect(() => {
    applyDocumentPrefs(lang);
    safeWrite(LANG_KEY, lang);
  }, [lang]);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <Background />

      <LiveRegionProvider announce={announce}>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:py-10">
          <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Safeparts"
                  className="h-10 w-10 shrink-0"
                  width={40}
                  height={40}
                  decoding="async"
                />
                <div className="text-start">
                  <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#101827]">
                    {strings.appName}
                  </h1>
                  {lang === "en" ? (
                    <EncryptedText
                      className="mt-0.5 block text-xs"
                      text={strings.tagline}
                      revealDelayMs={20}
                      flipDelayMs={20}
                      encryptedClassName="text-[#2a679b]/35"
                      revealedClassName="text-slate-600"
                    />
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-600">
                      {strings.tagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="dir-row flex-wrap items-center gap-2">
                <a
                  href={helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-button min-w-[44px] px-3 text-xs font-semibold uppercase tracking-wide"
                  aria-label={strings.help}
                  title={strings.help}
                >
                  {strings.help}
                </a>
                <a
                  href="https://github.com/mustafamohsen/safeparts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-button w-11"
                  aria-label={strings.github}
                  title={strings.github}
                >
                  <GitHubIcon />
                </a>
                <a
                  href="https://discord.gg/ZaSfpcy8At"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-button w-11"
                  aria-label={strings.discord}
                  title={strings.discord}
                >
                  <DiscordIcon />
                </a>
                <button
                  type="button"
                  onMouseDown={() => setKeytipsActive(true)}
                  onMouseUp={() => setKeytipsActive(false)}
                  onMouseLeave={() => setKeytipsActive(false)}
                  onTouchStart={() => setKeytipsActive(true)}
                  onTouchEnd={() => setKeytipsActive(false)}
                  className="chrome-button hidden w-11 sm:grid"
                  aria-label={strings.keyboardShortcuts}
                  title={strings.keyboardShortcuts}
                >
                  ?
                </button>
                <div className="dir-row items-center gap-1 rounded-2xl border border-[#0d2b4f]/10 bg-[#eff5fa]/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <button
                    type="button"
                    className={`grid h-11 w-11 place-items-center rounded-lg text-sm transition ${
                      lang === "en" ? "bg-[#0d2b4f] text-white shadow-sm" : "text-slate-700 hover:bg-white/70"
                    }`}
                    onClick={() => setLang("en")}
                    aria-label={strings.english}
                    aria-pressed={lang === "en"}
                    title={strings.english}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`grid h-11 w-11 place-items-center rounded-lg text-sm transition ${
                      lang === "ar" ? "bg-[#0d2b4f] text-white shadow-sm" : "text-slate-700 hover:bg-white/70"
                    }`}
                    onClick={() => setLang("ar")}
                    aria-label={strings.arabic}
                    aria-pressed={lang === "ar"}
                    title={strings.arabic}
                  >
                    AR
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="pill w-fit"
                role="tablist"
                aria-label={lang === "en" ? "Operation mode" : "وضع التشغيل"}
                onKeyDown={(e) => {
                  const isRtl = lang === "ar";
                  const current: Tab = tab;
                  const next = (dir: "prev" | "next"): Tab => {
                    if (current === "split") return dir === "next" ? "combine" : "split";
                    return dir === "next" ? "combine" : "split";
                  };

                  if (e.key === "Home") {
                    e.preventDefault();
                    setTab("split");
                    focusTab("split");
                    return;
                  }

                  if (e.key === "End") {
                    e.preventDefault();
                    setTab("combine");
                    focusTab("combine");
                    return;
                  }

                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    const target = next(isRtl ? "prev" : "next");
                    setTab(target);
                    focusTab(target);
                    return;
                  }

                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    const target = next(isRtl ? "next" : "prev");
                    setTab(target);
                    focusTab(target);
                  }
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "split"}
                  aria-controls="split-panel"
                  id="split-tab"
                  tabIndex={tab === "split" ? 0 : -1}
                  data-keytip="1"
                  className={`pill-btn ${tab === "split" ? "pill-btn-active" : "pill-btn-inactive"}`}
                  onClick={() => setTab("split")}
                  ref={splitTabRef}
                >
                  {strings.splitTab}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "combine"}
                  aria-controls="combine-panel"
                  id="combine-tab"
                  tabIndex={tab === "combine" ? 0 : -1}
                  data-keytip="2"
                  className={`pill-btn ${tab === "combine" ? "pill-btn-active" : "pill-btn-inactive"}`}
                  onClick={() => setTab("combine")}
                  ref={combineTabRef}
                >
                  {strings.combineTab}
                </button>
              </div>

              <div className="dir-row items-center gap-2 rounded-2xl border border-[#0d2b4f]/10 bg-white/65 px-3 py-2 text-xs text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <ShieldIcon />
                <span>{strings.privacyNote}</span>
              </div>
            </div>
          </header>

          <main className="flex flex-col gap-6">
            {tab === "split" ? (
              <div role="tabpanel" id="split-panel" aria-labelledby="split-tab">
                <SplitForm strings={strings} />
              </div>
            ) : (
              <div role="tabpanel" id="combine-panel" aria-labelledby="combine-tab">
                <CombineForm lang={lang} strings={strings} />
              </div>
            )}
          </main>

          <footer className="dir-row flex-wrap items-center justify-between gap-2 text-start text-xs text-slate-500">
            <div>
              © Mustafa Mohsen ·{' '}
              <a
                className="underline decoration-slate-400/50 underline-offset-4 hover:decoration-slate-600/70"
                href="https://github.com/mustafamohsen/safeparts/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
              >
                MIT
              </a>
            </div>
          </footer>

          <LiveRegion announcements={announcements} />

          <KeytipsOverlay active={keytipsActive} lang={lang} strings={strings} />

          <KeyboardShortcutsHelp
            open={shortcutsOpen}
            lang={lang}
            strings={strings}
            onClose={() => setShortcutsOpen(false)}
          />
        </div>
      </LiveRegionProvider>
    </div>
  );
}
