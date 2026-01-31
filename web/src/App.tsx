import { useEffect, useState } from "react";

import logoUrl from "./assets/logo.svg";

import { CombineForm } from "./components/CombineForm";
import { SplitForm } from "./components/SplitForm";
import { EncryptedText } from "./components/ui/encrypted-text";
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
      <div className="pointer-events-none absolute inset-0 bg-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(16,185,129,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.18)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(to_bottom,rgba(16,185,129,0.28)_0px,rgba(0,0,0,0)_2px,rgba(0,0,0,0)_6px)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
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

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-emerald-300"
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

  const helpUrl =
    import.meta.env.VITE_HELP_URL ?? (lang === "ar" ? "/help/ar/" : "/help/");

  const strings = STRINGS[lang];

  useEffect(() => {
    applyDocumentPrefs(lang);
    safeWrite(LANG_KEY, lang);
  }, [lang]);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <Background />

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
                <h1 className="text-xl font-semibold tracking-tight text-emerald-100">
                  {strings.appName}
                </h1>
                {lang === "en" ? (
                  <EncryptedText
                    className="mt-0.5 block text-xs"
                    text={strings.tagline}
                    revealDelayMs={20}
                    flipDelayMs={20}
                    encryptedClassName="text-emerald-300/40"
                    revealedClassName="text-slate-300"
                  />
                ) : (
                  <p className="mt-0.5 text-xs text-slate-300">
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
                className="grid h-10 px-3 place-items-center rounded-xl border border-emerald-500/15 bg-black/35 text-xs font-semibold tracking-wide uppercase text-slate-200 transition hover:bg-white/5"
                aria-label={strings.help}
                title={strings.help}
              >
                {strings.help}
              </a>
              <a
                href="https://github.com/mustafamohsen/safeparts"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/15 bg-black/35 text-slate-200 transition hover:bg-white/5"
                aria-label={strings.github}
                title={strings.github}
              >
                <GitHubIcon />
              </a>
              <div className="dir-row items-center gap-1 rounded-xl border border-emerald-500/15 bg-black/35 p-1">
                <button
                  type="button"
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                    lang === "en" ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  onClick={() => setLang("en")}
                  aria-label={strings.english}
                  title={strings.english}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                    lang === "ar" ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  onClick={() => setLang("ar")}
                  aria-label={strings.arabic}
                  title={strings.arabic}
                >
                  AR
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <nav className="pill w-fit">
              <button
                type="button"
                className={`pill-btn ${tab === "split" ? "pill-btn-active" : "pill-btn-inactive"}`}
                onClick={() => setTab("split")}
              >
                {strings.splitTab}
              </button>
              <button
                type="button"
                className={`pill-btn ${tab === "combine" ? "pill-btn-active" : "pill-btn-inactive"}`}
                onClick={() => setTab("combine")}
              >
                {strings.combineTab}
              </button>
            </nav>

            <div className="dir-row items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs text-slate-200">
              <ShieldIcon />
              <span>{strings.privacyNote}</span>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-6">
          {tab === "split" ? (
            <SplitForm strings={strings} />
          ) : (
            <CombineForm strings={strings} />
          )}
        </main>

        <footer className="dir-row flex-wrap items-center justify-between gap-2 text-start text-xs text-slate-400">
          <div>MIT Licensed</div>
        </footer>
      </div>
    </div>
  );
}
