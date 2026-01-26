import { useEffect, useState } from 'react'

import { CombineForm } from './components/CombineForm'
import { SplitForm } from './components/SplitForm'
import { STRINGS, type Lang } from './i18n'

type Tab = 'split' | 'combine'
type Theme = 'dark' | 'light'

const THEME_KEY = 'sp_theme'
const LANG_KEY = 'sp_lang'

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function applyDocumentPrefs(theme: Theme, lang: Lang) {
  const html = document.documentElement
  html.classList.toggle('dark', theme === 'dark')
  html.lang = lang
  html.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

function getInitialTheme(): Theme {
  const stored = safeRead(THEME_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

function getInitialLang(): Lang {
  const stored = safeRead(LANG_KEY)
  return stored === 'ar' ? 'ar' : 'en'
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0-1.414-1.414M7.05 7.05 5.636 5.636"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M21 13.2A8 8 0 1 1 10.8 3a6.5 6.5 0 0 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Background() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-slate-50 dark:bg-slate-950" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_55%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(15,23,42,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.35)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-[0.10] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.20)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.20)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-slate-950" />
    </>
  )
}

export function App() {
  const [tab, setTab] = useState<Tab>('split')
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())
  const [lang, setLang] = useState<Lang>(() => getInitialLang())

  const strings = STRINGS[lang]
  const isDark = theme === 'dark'

  useEffect(() => {
    applyDocumentPrefs(theme, lang)
    safeWrite(THEME_KEY, theme)
    safeWrite(LANG_KEY, lang)
  }, [theme, lang])

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <Background />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20 dark:shadow-cyan-500/15" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{strings.appName}</h1>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{strings.tagline}</p>
              </div>
            </div>

            <div className="dir-row flex-wrap items-center gap-2">
              <div className="dir-row items-center gap-1 rounded-xl border border-slate-200/70 bg-white/50 p-1 dark:border-white/10 dark:bg-slate-900/30">
                <button
                  type="button"
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${lang === 'en' ? 'bg-white/70 dark:bg-white/10' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
                  onClick={() => setLang('en')}
                  aria-label={strings.english}
                  title={strings.english}
                >
                  🇺🇸
                </button>
                <button
                  type="button"
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${lang === 'ar' ? 'bg-white/70 dark:bg-white/10' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
                  onClick={() => setLang('ar')}
                  aria-label={strings.arabic}
                  title={strings.arabic}
                >
                  🇸🇦
                </button>
              </div>

              <button
                type="button"
                className="btn-ghost h-10 w-10 px-0"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={strings.theme}
                title={strings.theme}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>

          <nav className="pill w-fit">
            <button
              type="button"
              className={`pill-btn ${tab === 'split' ? 'pill-btn-active' : 'pill-btn-inactive'}`}
              onClick={() => setTab('split')}
            >
              {strings.splitTab}
            </button>
            <button
              type="button"
              className={`pill-btn ${tab === 'combine' ? 'pill-btn-active' : 'pill-btn-inactive'}`}
              onClick={() => setTab('combine')}
            >
              {strings.combineTab}
            </button>
          </nav>
        </header>

        <main className="flex flex-col gap-6">
          {tab === 'split' ? <SplitForm strings={strings} /> : <CombineForm strings={strings} />}
        </main>

        <footer className="text-xs text-slate-500 dark:text-slate-500 text-start">
          <span>{strings.wasmHint} </span>
          <code dir="ltr" className="rounded bg-black/5 px-1 py-0.5 text-[11px] dark:bg-white/10">
            {strings.wasmCommand}
          </code>
        </footer>
      </div>
    </div>
  )
}
