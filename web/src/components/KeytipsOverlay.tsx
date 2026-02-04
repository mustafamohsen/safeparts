import { useEffect, useMemo, useState } from 'react'

import type { Lang, Strings } from '../i18n'

type Keytip = {
  id: string
  text: string
  rect: DOMRect
}

function isVisibleRect(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0
}

function collectKeytips(): Keytip[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-keytip]'))

  return nodes
    .map((el, index) => {
      const text = el.dataset.keytip?.trim() ?? ''
      if (!text) return null

      const rect = el.getBoundingClientRect()
      if (!isVisibleRect(rect)) return null

      // Prefer stable ids if present.
      const id = el.id ? `id:${el.id}` : `idx:${index}`
      return { id, text, rect }
    })
    .filter((v): v is Keytip => Boolean(v))
}

type KeytipsOverlayProps = {
  active: boolean
  lang: Lang
  strings: Strings
}

function Keycap({ label }: { label: string }) {
  const isSingle = /^[0-9]$/.test(label)
  const className = isSingle
    ? 'rounded-md border border-emerald-50/80 bg-emerald-200 px-2.5 py-1.5 font-mono text-[12px] font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]'
    : 'rounded-md border border-emerald-50/70 bg-emerald-100 px-2.5 py-1.5 font-mono text-[12px] font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.3)]'
  return (
    <span dir="ltr" className={className}>
      {label}
    </span>
  )
}

export function KeytipsOverlay({ active, lang, strings }: KeytipsOverlayProps) {
  const [tips, setTips] = useState<Keytip[]>([])

  useEffect(() => {
    if (!active) return

    let raf = 0
    const update = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setTips(collectKeytips()))
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    const observer = new MutationObserver(update)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      observer.disconnect()
    }
  }, [active])

  const className = useMemo(() => {
    // Keep mounted for layout stability; only animate opacity.
    return [
      'pointer-events-none fixed inset-0 z-[70]',
      'transition-opacity duration-150 ease-out',
      active ? 'opacity-100' : 'opacity-0',
    ].join(' ')
  }, [active])

  return (
    <div className={className} aria-hidden="true">
      <div className="absolute inset-0 bg-black/40" />

      {tips.map((tip) => {
        // Prefer the top-right corner (reads like a "key hint" badge).
        const left = tip.rect.right - 10
        const top = tip.rect.top + 10

        const text = tip.text
        const isSingleKey = /^[0-9]$/.test(text)

        const tipClassName = isSingleKey
          ? 'fixed -translate-x-full -translate-y-full rounded-md border border-emerald-50/80 bg-emerald-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]'
          : 'fixed -translate-x-full -translate-y-full rounded-lg border border-emerald-50/70 bg-emerald-100 px-3 py-1.5 text-[12px] font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.3)]'

        return (
          <div key={tip.id}>
            <div
              className="fixed rounded-2xl border border-emerald-300/35 bg-emerald-400/5 shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_0_8px_rgba(16,185,129,0.12)]"
              style={{ left: tip.rect.left - 3, top: tip.rect.top - 3, width: tip.rect.width + 6, height: tip.rect.height + 6 }}
            />
            <div className={tipClassName} style={{ left, top }}>
              <span dir="ltr" className="font-mono tracking-tight">
                {text}
              </span>
            </div>
          </div>
        )
      })}

      <div
        className={[
          'fixed bottom-4 left-4 right-4',
          'mx-auto max-w-[46rem]',
          'rounded-xl border border-emerald-300/22 bg-black/75 px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.55)]',
        ].join(' ')}
      >
        <div
          className={[
            'flex flex-wrap items-center gap-x-4 gap-y-2',
            lang === 'ar' ? 'justify-end' : 'justify-start',
            'text-[13px] leading-tight text-slate-50',
          ].join(' ')}
        >
          <div className="inline-flex items-center gap-2">
            <Keycap label="1" />
            <span>{strings.shortcutGoToSplit}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Keycap label="2" />
            <span>{strings.shortcutGoToCombine}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Keycap label="Ctrl/Cmd+Enter" />
            <span>{strings.shortcutSubmitForm}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Keycap label="Ctrl/Cmd+Shift+C" />
            <span>{strings.shortcutCopyResult}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Keycap label="Ctrl/Cmd+/" />
            <span>{strings.shortcutShowHelp}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
