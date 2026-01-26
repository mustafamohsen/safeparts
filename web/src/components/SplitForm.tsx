// @ts-nocheck
import { useMemo, useState } from 'react'

import { ensureWasm } from '../wasm'

type Encoding = 'base58check' | 'base64url' | 'mnemo-words' | 'mnemo-bip39'

export function SplitForm() {
  const [secret, setSecret] = useState('')
  const [k, setK] = useState(2)
  const [n, setN] = useState(3)
  const [encoding, setEncoding] = useState<Encoding>('mnemo-words')
  const [passphrase, setPassphrase] = useState('')
  const [shares, setShares] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSplit = useMemo(() => secret.length > 0 && k >= 1 && n >= k && n <= 255, [secret, k, n])

  async function onSplit() {
    setBusy(true)
    setError(null)
    setShares([])

    try {
      const wasm = await ensureWasm()
      const bytes = new TextEncoder().encode(secret)
      const out = wasm.split_secret(bytes, k, n, encoding, passphrase ? passphrase : undefined)
      const outShares = Array.from(out).map((v) => String(v))
      setShares(outShares)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <h2>Split</h2>

      <label>
        Secret
        <textarea value={secret} onChange={(e) => setSecret(e.target.value)} rows={4} />
      </label>

      <div className="row">
        <label>
          k
          <input type="number" min={1} max={255} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
        <label>
          n
          <input type="number" min={1} max={255} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label>
          Encoding
          <select value={encoding} onChange={(e) => setEncoding(e.target.value as Encoding)}>
            <option value="base58check">base58check</option>
            <option value="base64url">base64url</option>
            <option value="mnemo-words">mnemo-words</option>
            <option value="mnemo-bip39">mnemo-bip39</option>
          </select>
        </label>
      </div>

      <label>
        Passphrase (optional)
        <input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
      </label>

      <button type="button" disabled={!canSplit || busy} onClick={onSplit}>
        {busy ? 'Working…' : 'Split'}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {shares.length > 0 ? (
        <div className="results">
          <h3>Shares</h3>
          {shares.map((s, i) => (
            <textarea
              key={`${i}-${s.slice(0, 16)}`}
              readOnly
              value={s}
              rows={encoding === 'mnemo-bip39' ? 6 : 2}
            />
          ))}
        </div>
      ) : null}

      <p className="hint">
        Note: run <code>npm run build:wasm</code> before using the UI.
      </p>
    </section>
  )
}
