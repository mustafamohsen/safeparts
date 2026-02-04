import { useMemo, useState } from "react";

import type { Strings } from "../i18n";
import { ensureWasm } from "../wasm";

import { CopyButton } from "./CopyButton";
import {
  EncodingSelector,
  type Encoding,
  type EncodingOption,
} from "./ui/encoding-selector";
import { EncryptedText } from "./ui/encrypted-text";

type SplitFormProps = {
  strings: Strings;
};

function toErrorMessage(err: unknown, strings: Strings): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/wasm_pkg|safeparts_wasm|Cannot find module/i.test(message))
    return strings.errorWasmMissing;
  return message;
}

export function SplitForm({ strings }: SplitFormProps) {
  const [secret, setSecret] = useState("");
  const [k, setK] = useState(2);
  const [n, setN] = useState(3);

  function clampK(nextK: number, nextN: number): number {
    if (!Number.isFinite(nextK)) return 2;
    if (!Number.isFinite(nextN)) return 2;

    const safeN = Math.min(255, Math.max(2, Math.floor(nextN)));
    const safeK = Math.floor(nextK);
    return Math.min(safeN, Math.max(2, safeK));
  }

  function clampN(nextN: number): number {
    if (!Number.isFinite(nextN)) return 2;
    return Math.min(255, Math.max(2, Math.floor(nextN)));
  }
  const [encoding, setEncoding] = useState<Encoding>("mnemo-words");
  const [passphrase, setPassphrase] = useState("");
  const [shares, setShares] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const encodingOptions: EncodingOption[] = useMemo(
    () => [
      {
        value: "mnemo-words",
        label: strings.encodingMnemoWords,
        description: strings.encodingMnemoWordsDesc,
      },
      {
        value: "base64url",
        label: strings.encodingBase64url,
        description: strings.encodingBase64urlDesc,
      },
    ],
    [strings]
  );

  const canSplit = useMemo(
    () => secret.length > 0 && k >= 2 && n >= 2 && n <= 255,
    [secret, k, n],
  );

  async function onSplit() {
    setBusy(true);
    setError(null);
    setShares([]);

    try {
      const wasm = await ensureWasm();
      const bytes = new TextEncoder().encode(secret);
      const out = wasm.split_secret(
        bytes,
        k,
        n,
        encoding,
        passphrase ? passphrase : undefined,
      );
      const outShares = Array.from(out).map((v) => String(v));
      setShares(outShares);
    } catch (e) {
      setError(toErrorMessage(e, strings));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass p-4 sm:p-6">
      <div className="dir-row items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{strings.splitTitle}</h2>
          <p className="mt-1 text-sm text-slate-300">{strings.splitSubtitle}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <label className="block">
          <span className="field-label" id="secret-label">{strings.secretLabel}</span>
          <span className="field-hint mt-1 block" id="secret-hint">{strings.secretHint}</span>
          <textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            rows={4}
            className="input mt-3 min-h-[120px] resize-y font-mono text-xs leading-relaxed"
            aria-labelledby="secret-label"
            aria-describedby="secret-hint"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="field-label block sm:min-h-10" id="k-label">
              {strings.kLabel}
            </span>
            <input
              type="number"
              min={2}
              max={Math.min(255, n)}
              value={k}
              onChange={(e) => setK(clampK(Number(e.target.value), n))}
              className="input mt-2"
              aria-labelledby="k-label"
            />
          </label>

          <label className="block">
            <span className="field-label block sm:min-h-10" id="n-label">
              {strings.nLabel}
            </span>
            <input
              type="number"
              min={2}
              max={255}
              value={n}
              onChange={(e) => {
                const nextN = clampN(Number(e.target.value));
                setN(nextN);
                setK((prevK) => clampK(prevK, nextN));
              }}
              className="input mt-2"
              aria-labelledby="n-label"
            />
          </label>

          <div className="block sm:col-span-3">
            <span className="field-label block" id="encoding-label">
              {strings.encodingLabel}
            </span>
            <EncodingSelector
              value={encoding}
              onChange={setEncoding}
              options={encodingOptions}
            />
          </div>
        </div>

        <label className="block">
          <span className="field-label" id="passphrase-label">{strings.passphraseLabel}</span>
          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="input mt-2"
            autoComplete="new-password"
            aria-labelledby="passphrase-label"
          />
        </label>

        <div className="dir-row flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            data-shortcut="submit"
            data-keytip="Ctrl/Cmd+Enter"
            disabled={!canSplit || busy}
            onClick={onSplit}
            className="btn-primary w-full sm:w-auto"
          >
            {busy ? strings.working : strings.splitCta}
          </button>
        </div>

        {error ? (
          <div className="alert-error" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
      </div>

      {shares.length > 0 ? (
        <div className="mt-6">
          <div className="dir-row items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {strings.sharesTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {strings.sharesHint}
              </p>
            </div>
          </div>

          <div className="mt-3 divide-y divide-emerald-500/10">
            {shares.map((s, i) => (
              <div
                key={`${i}-${s.slice(0, 16)}`}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="dir-row items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-200">
                    {strings.shareNumber} {i + 1}
                  </div>
                  <CopyButton
                    value={s}
                    copyLabel={strings.copy}
                    copiedLabel={strings.copied}
                  />
                </div>

                <div
                  dir="ltr"
                  className="input mt-2 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
                >
                  <EncryptedText
                    text={s}
                    revealDelayMs={Math.max(
                      4,
                      Math.min(24, Math.floor(1100 / Math.max(1, s.length))),
                    )}
                    flipDelayMs={35}
                    encryptedClassName="text-emerald-300/45"
                    revealedClassName="text-slate-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
