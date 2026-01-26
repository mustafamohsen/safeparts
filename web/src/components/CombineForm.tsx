import { useMemo, useState } from 'react'

import type { Strings } from '../i18n'
import { ensureWasm } from '../wasm'

import { CopyButton } from './CopyButton'
import { EncryptedText } from './ui/encrypted-text'

type Encoding = 'base64url' | 'mnemo-words'

type CombineFormProps = {
  strings: Strings
}

type ShareBox = {
  id: string
  value: string
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M9 3h6m-7 4h8m-9 0h10l-1 14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v7m4-7v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function toErrorMessage(err: unknown, strings: Strings): string {
  const message = err instanceof Error ? err.message : String(err)
  if (/wasm_pkg|safeparts_wasm|Cannot find module/i.test(message)) return strings.errorWasmMissing
  return message
}

function parseSharesFromBox(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createShareBox(): ShareBox {
  return { id: createId(), value: '' }
}

export function CombineForm({ strings }: CombineFormProps) {
  const [encoding, setEncoding] = useState<Encoding>('mnemo-words')
  const [passphrase, setPassphrase] = useState('')
  const [shareBoxes, setShareBoxes] = useState<ShareBox[]>(() => [createShareBox(), createShareBox()])
  const [invalidShareBoxIds, setInvalidShareBoxIds] = useState<string[]>([])
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const shares = useMemo(() => shareBoxes.flatMap((b) => parseSharesFromBox(b.value)), [shareBoxes])

  function setShareBoxValue(id: string, value: string) {
    setShareBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, value } : b)))

    if (invalidShareBoxIds.includes(id) && value.trim().length > 0) {
      setInvalidShareBoxIds((prev) => prev.filter((v) => v !== id))
    }
  }

  function addShareBox() {
    setShareBoxes((prev) => [...prev, createShareBox()])
  }

  function removeShareBox(id: string) {
    setShareBoxes((prev) => {
      if (prev.length <= 2) return prev
      return prev.filter((b) => b.id !== id)
    })
    setInvalidShareBoxIds((prev) => prev.filter((v) => v !== id))
  }

  async function onCombine() {
    const emptyIds = shareBoxes.filter((b) => b.value.trim().length === 0).map((b) => b.id)
    if (emptyIds.length > 0) setInvalidShareBoxIds(emptyIds)

    setBusy(true)
    setError(null)
    setSecret('')

    try {
      const wasm = await ensureWasm()
      const out = wasm.combine_shares(shares as any, encoding, passphrase ? passphrase : undefined)
      const bytes = new Uint8Array(out)
      setSecret(new TextDecoder().decode(bytes))
      setInvalidShareBoxIds([])
    } catch (e) {
      setError(toErrorMessage(e, strings))
    } finally {
      setBusy(false)
    }
  }

  const canCombine = shares.length > 0

  return (
    <section className="glass p-4 sm:p-6">
      <div className="dir-row items-start justify-between gap-4">
        <div className="text-start">
          <h2 className="text-lg font-semibold">{strings.combineTitle}</h2>
          <p className="mt-1 text-sm text-slate-300">{strings.combineSubtitle}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-start">
            <span className="field-label">{strings.encodingLabel}</span>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value as Encoding)}
              className="input mt-2"
            >
              <option value="base64url">Base64 URL (base64url)</option>
              <option value="mnemo-words">Words (mnemo-words)</option>
            </select>
          </label>

          <label className="block text-start">
            <span className="field-label">{strings.passphraseLabel}</span>
            <input
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="input mt-2"
              autoComplete="new-password"
            />
          </label>
        </div>

        <div>
          <div className="dir-row items-start justify-between gap-3">
            <div className="text-start">
              <div className="field-label">{strings.sharesInputLabel}</div>
              <div className="field-hint mt-1">{strings.sharesInputHint}</div>
            </div>
          </div>

          <div className="mt-3 divide-y divide-emerald-500/10">
            {shareBoxes.map((box, i) => {
              const isInvalid = invalidShareBoxIds.includes(box.id)

              return (
                <div key={box.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="dir-row items-center justify-between gap-3">
                    <div className="text-start text-xs font-semibold text-slate-200">
                      {strings.shareNumber} {i + 1}
                    </div>

                    <button
                      type="button"
                      className="btn-ghost h-9 w-9 px-0"
                      onClick={() => removeShareBox(box.id)}
                      disabled={shareBoxes.length <= 2}
                      aria-label={strings.removeShare}
                      title={strings.removeShare}
                    >
                      <TrashIcon />
                      <span className="sr-only">{strings.removeShare}</span>
                    </button>
                  </div>

                  <textarea
                    dir="ltr"
                    value={box.value}
                    onChange={(e) => setShareBoxValue(box.id, e.target.value)}
                    rows={3}
                    placeholder={strings.sharePlaceholder}
                     className={`input mt-2 resize-y font-mono text-xs leading-relaxed ${
                       isInvalid ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/15' : ''
                     }`}
                   />
                </div>
              )
            })}
          </div>

          <div className="dir-row mt-3 justify-start">
            <button type="button" className="btn-secondary w-full px-3 py-2 text-xs sm:w-auto" onClick={addShareBox}>
              {strings.addShare}
            </button>
          </div>
        </div>

        <div className="dir-row flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={!canCombine || busy}
            onClick={onCombine}
            className="btn-primary w-full sm:w-auto"
          >
            {busy ? strings.working : strings.combineCta}
          </button>
        </div>

        {error ? <div className="alert-error">{error}</div> : null}
      </div>

      {secret ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-black/35 p-3">
          <div className="dir-row items-start justify-between gap-3">
            <div className="text-start">
              <h3 className="text-sm font-semibold text-slate-200">{strings.recoveredTitle}</h3>
              <p className="mt-1 text-xs text-slate-400">{strings.recoveredHint}</p>
            </div>

            <CopyButton value={secret} copyLabel={strings.copy} copiedLabel={strings.copied} className="shrink-0" />
          </div>

          <div dir="auto" className="input mt-3 min-h-[120px] resize-y font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
            <EncryptedText
              text={secret}
              revealDelayMs={Math.max(4, Math.min(24, Math.floor(1100 / Math.max(1, secret.length))))}
              flipDelayMs={35}
              encryptedClassName="text-emerald-300/45"
              revealedClassName="text-slate-200"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
