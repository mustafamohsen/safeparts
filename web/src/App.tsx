import { useEffect, useState } from 'react'

import { CombineForm } from './components/CombineForm'
import { SplitForm } from './components/SplitForm'
import { EncryptedText } from './components/ui/encrypted-text'
import { STRINGS, type Lang } from './i18n'

type Tab = 'split' | 'combine'

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

function applyDocumentPrefs(lang: Lang) {
  const html = document.documentElement
  html.classList.add('dark')
  html.lang = lang
  html.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

function getInitialLang(): Lang {
  const stored = safeRead(LANG_KEY)
  return stored === 'ar' ? 'ar' : 'en'
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
  )
}

export function App() {
  const [tab, setTab] = useState<Tab>('split')
  const [lang, setLang] = useState<Lang>(() => getInitialLang())

  const strings = STRINGS[lang]

  useEffect(() => {
    applyDocumentPrefs(lang)
    safeWrite(LANG_KEY, lang)
  }, [lang])

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <Background />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:py-10">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-400 to-emerald-300 shadow-lg shadow-emerald-500/20" />
              <div className="text-start">
                <h1 className="text-xl font-semibold tracking-tight text-emerald-100">{strings.appName}</h1>
                {lang === 'en' ? (
                  <EncryptedText
                    className="mt-0.5 block text-xs"
                    text={strings.tagline}
                    revealDelayMs={40}
                    flipDelayMs={28}
                    encryptedClassName="text-emerald-300/40"
                    revealedClassName="text-slate-300"
                  />
                ) : (
                  <p className="mt-0.5 text-xs text-slate-300">{strings.tagline}</p>
                )}
              </div>
            </div>

            <div className="dir-row flex-wrap items-center gap-2">
              <div className="dir-row items-center gap-1 rounded-xl border border-emerald-500/15 bg-black/35 p-1">
                <button
                  type="button"
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                    lang === 'en' ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => setLang('en')}
                  aria-label={strings.english}
                  title={strings.english}
                >
                  🇺🇸
                </button>
                <button
                  type="button"
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                    lang === 'ar' ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => setLang('ar')}
                  aria-label={strings.arabic}
                  title={strings.arabic}
                >
                  🇸🇦
                </button>
              </div>
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

        <footer className="text-start text-xs text-slate-400">
          <span>{strings.wasmHint} </span>
          <code dir="ltr" className="rounded bg-emerald-500/10 px-1 py-0.5 text-[11px] text-emerald-100">
            {strings.wasmCommand}
          </code>
        </footer>
      </div>
    </div>
  )
}
