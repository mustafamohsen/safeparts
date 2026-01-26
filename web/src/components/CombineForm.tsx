// @ts-nocheck
import { useMemo, useState } from 'react'

import { ensureWasm } from '../wasm'

type Encoding = 'base58check' | 'base64url' | 'mnemo-words' | 'mnemo-bip39'

export function CombineForm() {
  const [encoding, setEncoding] = useState<Encoding>('mnemo-words')
  const [passphrase, setPassphrase] = useState('')
  const [sharesText, setSharesText] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const shares = useMemo(
    () =>
      sharesText
        .split(/\n\s*\n/g)
        .map((s) => s.trim())
        .filter(Boolean),
    [sharesText],
  )

  async function onCombine() {
    setBusy(true)
    setError(null)
    setSecret('')

    try {
      const wasm = await ensureWasm()
      const arr = shares.map((s) => s)
      const out = wasm.combine_shares(arr as unknown as any, encoding, passphrase ? passphrase : undefined)
      const bytes = new Uint8Array(out)
      setSecret(new TextDecoder().decode(bytes))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const canCombine = shares.length > 0

  return (
    <section className="panel">
      <h2>Combine</h2>

      <div className="row">
        <label>
          Encoding
          <select value={encoding} onChange={(e) => setEncoding(e.target.value as Encoding)}>
            <option value="base58check">base58check</option>
            <option value="base64url">base64url</option>
            <option value="mnemo-words">mnemo-words</option>
            <option value="mnemo-bip39">mnemo-bip39</option>
          </select>
        </label>
        <label>
          Passphrase (optional)
          <input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
        </label>
      </div>

      <label>
        Shares (separate by blank line)
        <textarea value={sharesText} onChange={(e) => setSharesText(e.target.value)} rows={10} />
      </label>

      <button type="button" disabled={!canCombine || busy} onClick={onCombine}>
        {busy ? 'Working…' : 'Combine'}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {secret ? (
        <div className="results">
          <h3>Recovered</h3>
          <textarea readOnly value={secret} rows={4} />
        </div>
      ) : null}

      <p className="hint">
        Note: run <code>npm run build:wasm</code> before using the UI.
      </p>
    </section>
  )
}
