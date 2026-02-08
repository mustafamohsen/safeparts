import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Strings } from "../i18n";
import { ensureWasm } from "../wasm";

import { ClearButton } from "./ClearButton";
import { CopyButton } from "./CopyButton";
import {
  EncodingSelector,
  type Encoding,
  type EncodingOption,
} from "./ui/encoding-selector";
import { EncryptedText } from "./ui/encrypted-text";

type CombineFormProps = {
  strings: Strings;
};

type ShareBox = {
  id: string;
  value: string;
};

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
  );
}

function toErrorMessage(err: unknown, strings: Strings): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/wasm_pkg|safeparts_wasm|Cannot find module/i.test(message))
    return strings.errorWasmMissing;
  return message;
}

function parseSharesFromBox(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function detectEncodingFromText(text: string): Encoding | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const allBase64Urlish = tokens.every((t) => /^[A-Za-z0-9_-]+$/.test(t));
  const allLowerWords = tokens.every((t) => /^[a-z]+$/.test(t));

  const lens = tokens
    .map((t) => t.length)
    .sort((a, b) => a - b);
  const medianLen = lens[Math.floor(lens.length / 2)] ?? 0;

  const hasBase64Hints = tokens.some((t) => /[-_0-9A-Z]/.test(t));

  // Base64url shares are typically a single long token, or multiple long tokens
  // if the user pasted multiple shares separated by whitespace.
  if (
    allBase64Urlish &&
    (hasBase64Hints || medianLen >= 16 || (tokens.length === 1 && medianLen >= 24))
  ) {
    return "base64url";
  }

  // Mnemo-words shares are many short lowercase words.
  if (allLowerWords && tokens.length >= 6 && medianLen <= 12) {
    return "mnemo-words";
  }

  return null;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createShareBox(): ShareBox {
  return { id: createId(), value: "" };
}

export function CombineForm({ strings }: CombineFormProps) {
  const [encoding, setEncoding] = useState<Encoding>("mnemo-words");
  const [passphrase, setPassphrase] = useState("");
  const [shareBoxes, setShareBoxes] = useState<ShareBox[]>(() => [
    createShareBox(),
    createShareBox(),
  ]);
  const [invalidShareBoxIds, setInvalidShareBoxIds] = useState<string[]>([]);
  const [shareBoxFlashIds, setShareBoxFlashIds] = useState<string[]>([]);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [encodingFlash, setEncodingFlash] = useState(false);
  const pasteRequestedRef = useRef(false);
  const pendingShareBoxFlashIdsRef = useRef<string[] | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const shareBoxFlashTimeoutRef = useRef<number | null>(null);

  const shareBoxCount = shareBoxes.length;

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

  const triggerEncodingFlash = useCallback(() => {
    setEncodingFlash(true);
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      setEncodingFlash(false);
    }, 1100);
  }, []);

  const triggerShareBoxFlash = useCallback((ids: string[]) => {
    setShareBoxFlashIds(ids);
    if (shareBoxFlashTimeoutRef.current !== null) {
      window.clearTimeout(shareBoxFlashTimeoutRef.current);
    }
    shareBoxFlashTimeoutRef.current = window.setTimeout(() => {
      setShareBoxFlashIds([]);
    }, 1100);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      if (shareBoxFlashTimeoutRef.current !== null) {
        window.clearTimeout(shareBoxFlashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const ids = pendingShareBoxFlashIdsRef.current;
    if (!ids || ids.length === 0) return;
    if (shareBoxCount < 2) return;
    pendingShareBoxFlashIdsRef.current = null;
    triggerShareBoxFlash(ids);
  }, [shareBoxCount, triggerShareBoxFlash]);

  useEffect(() => {
    if (!pasteRequestedRef.current) return;
    pasteRequestedRef.current = false;

    const firstNonEmpty = shareBoxes.find((b) => b.value.trim().length > 0);
    if (!firstNonEmpty) return;

    const detected = detectEncodingFromText(firstNonEmpty.value);
    const encodingForDecode = detected ?? encoding;

    if (detected && detected !== encoding) {
      setEncoding(detected);
      triggerEncodingFlash();
    }

    const firstShare = parseSharesFromBox(firstNonEmpty.value)[0];
    if (!firstShare) return;

    (async () => {
      try {
        const wasm = await ensureWasm();

        const k =
          typeof wasm.share_threshold === "function"
            ? Number(wasm.share_threshold(firstShare, encodingForDecode))
            : typeof wasm.inspect_share === "function"
              ? Number(wasm.inspect_share(firstShare, encodingForDecode)?.k)
              : NaN;

        if (!Number.isFinite(k) || k < 2) return;

        setShareBoxes((prev) => {
          if (prev.length >= k) return prev;

          const toAdd = k - prev.length;
          const added = Array.from({ length: toAdd }, () => createShareBox());
          pendingShareBoxFlashIdsRef.current = added.map((b) => b.id);
          return [...prev, ...added];
        });
      } catch {
        // Ignore: auto-expanding share slots is a best-effort UX enhancement.
      }
    })();
  }, [shareBoxes, encoding, triggerEncodingFlash]);

  const shares = useMemo(
    () => shareBoxes.flatMap((b) => parseSharesFromBox(b.value)),
    [shareBoxes],
  );

  function setShareBoxValue(id: string, value: string) {
    setShareBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, value } : b)),
    );

    if (invalidShareBoxIds.includes(id) && value.trim().length > 0) {
      setInvalidShareBoxIds((prev) => prev.filter((v) => v !== id));
    }
  }

  function addShareBox() {
    setShareBoxes((prev) => [...prev, createShareBox()]);
  }

  function removeShareBox(id: string) {
    setShareBoxes((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((b) => b.id !== id);
    });
    setInvalidShareBoxIds((prev) => prev.filter((v) => v !== id));
  }

  async function onCombine() {
    setBusy(true);
    setError(null);
    setSecret("");

    try {
      const wasm = await ensureWasm();
      const out = wasm.combine_shares(
        shares as any,
        encoding,
        passphrase ? passphrase : undefined,
      );
      const bytes = new Uint8Array(out);
      setSecret(new TextDecoder().decode(bytes));
      setInvalidShareBoxIds([]);
    } catch (e) {
      const message = toErrorMessage(e, strings);
      setError(message);

      const m = /need at least k shares: need (\d+), got (\d+)/i.exec(message);
      if (m) {
        const k = Number(m[1]);
        const got = Number(m[2]);
        const missing = Math.max(0, k - got);

        if (missing > 0) {
          const emptyBoxIds = shareBoxes
            .filter((b) => parseSharesFromBox(b.value).length === 0)
            .map((b) => b.id);
          setInvalidShareBoxIds(emptyBoxIds.slice(0, missing));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const canCombine = shares.length > 0;

  return (
    <section className="glass p-4 sm:p-6">
      <div className="dir-row items-start justify-between gap-4">
        <div className="text-start">
          <h2 className="text-lg font-semibold">{strings.combineTitle}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {strings.combineSubtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="block text-start">
          <span className="field-label" id="encoding-label">{strings.encodingLabel}</span>
          <EncodingSelector
            value={encoding}
            onChange={setEncoding}
            options={encodingOptions}
            flash={encodingFlash}
          />
        </div>

        <label className="block text-start">
          <span className="field-label" id="passphrase-label">{strings.passphraseLabel}</span>
          <div className="relative mt-2">
            <input
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="input input-with-clear"
              autoComplete="new-password"
              aria-labelledby="passphrase-label"
            />
            <ClearButton
              label={strings.clearPassphrase}
              disabled={passphrase.length === 0}
              onClick={() => setPassphrase("")}
              className="absolute top-1/2 -translate-y-1/2 end-2"
            />
          </div>
        </label>

        <div>
          <div className="dir-row items-start justify-between gap-3">
            <div className="text-start">
              <div className="field-label" id="shares-label">{strings.sharesInputLabel}</div>
              <div className="field-hint mt-1" id="shares-hint">{strings.sharesInputHint}</div>
            </div>
          </div>

          <div className="mt-3 divide-y divide-emerald-500/10">
            {shareBoxes.map((box, i) => {
              const isInvalid = invalidShareBoxIds.includes(box.id);
              const isFlashing = shareBoxFlashIds.includes(box.id);

              return (
                <div key={box.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="dir-row items-center justify-between gap-3">
                    <div className="text-start text-xs font-semibold text-slate-200">
                      {strings.shareNumber} {i + 1}
                    </div>

                    <button
                      type="button"
                      className="btn-ghost h-11 w-11 px-0 min-h-[44px]"
                      onClick={() => removeShareBox(box.id)}
                      disabled={shareBoxes.length <= 2}
                      aria-label={strings.removeShare}
                      title={strings.removeShare}
                    >
                      <TrashIcon />
                      <span className="sr-only">{strings.removeShare}</span>
                    </button>
                  </div>

                  <div className="relative mt-2" dir="ltr">
                    <textarea
                      dir="ltr"
                      value={box.value}
                      onChange={(e) => setShareBoxValue(box.id, e.target.value)}
                      onPaste={() => {
                        pasteRequestedRef.current = true;
                      }}
                      rows={3}
                      placeholder={strings.sharePlaceholder}
                      className={`input input-with-clear resize-y font-mono text-xs leading-relaxous transition-colors duration-700 ${
                        isInvalid
                          ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15"
                          : ""
                      } ${isFlashing ? "border-emerald-300/70 bg-emerald-500/15" : ""}`}
                      aria-labelledby="shares-label"
                      aria-describedby={
                        isInvalid ? `share-${box.id}-error` : "shares-hint"
                      }
                      aria-invalid={isInvalid}
                    />
                    <ClearButton
                      label={`${strings.clearShare} ${i + 1}`}
                      disabled={box.value.length === 0}
                      onClick={() => setShareBoxValue(box.id, "")}
                      className="absolute top-2 end-2"
                    />
                  </div>
                  {isInvalid && (
                    <p className="mt-1 text-xs text-rose-400" id={`share-${box.id}-error`} role="alert">
                      {strings.shareRequired}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="dir-row mt-3 justify-start">
            <button
              type="button"
              className="btn-secondary w-full px-3 py-2 text-xs sm:w-auto"
              onClick={addShareBox}
            >
              {strings.addShare}
            </button>
          </div>
        </div>

        <div className="dir-row flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            data-shortcut="submit"
            data-keytip="Ctrl/Cmd+Enter"
            disabled={!canCombine || busy}
            onClick={onCombine}
            className="btn-primary w-full sm:w-auto"
          >
            {busy ? strings.working : strings.combineCta}
          </button>
        </div>

        {error ? (
          <div className="alert-error" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
      </div>

      {secret ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-black/35 p-3">
          <div className="dir-row items-start justify-between gap-3">
            <div className="text-start">
              <h3 className="text-sm font-semibold text-slate-200">
                {strings.recoveredTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {strings.recoveredHint}
              </p>
            </div>

            <CopyButton
              value={secret}
              copyLabel={strings.copy}
              copiedLabel={strings.copied}
              className="shrink-0"
            />
          </div>

          <div
            dir="auto"
            className="input mt-3 min-h-[120px] resize-y font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
          >
            <EncryptedText
              text={secret}
              revealDelayMs={Math.max(
                4,
                Math.min(24, Math.floor(1100 / Math.max(1, secret.length))),
              )}
              flipDelayMs={35}
              encryptedClassName="text-emerald-300/45"
              revealedClassName="text-slate-200"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
