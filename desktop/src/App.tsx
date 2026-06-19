import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  combineShares,
  inspectShares,
  splitSecret,
  supportedEncodings,
  type CombineResponse,
  type EncodingInfo,
  type ShareInspection,
  type SplitResponse,
} from "./commands";

type Mode = "split" | "combine";
type SplitInputMode = "text" | "file";

const textEncoder = new TextEncoder();

function passphraseOrUndefined(value: string): string | undefined {
  return value.length > 0 ? value : undefined;
}

function toBytes(response: CombineResponse): Uint8Array {
  return new Uint8Array(response.secret);
}

function shareInputText(shares: string[], encoding: string): string {
  return encoding.startsWith("mnemo-") ? shares.join("\n\n") : shares.join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function App() {
  const [mode, setMode] = useState<Mode>("split");
  const [encodings, setEncodings] = useState<EncodingInfo[]>([]);
  const [status, setStatus] = useState("Ready. All work stays on this device.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supportedEncodings()
      .then(setEncodings)
      .catch((err: unknown) => {
        setError(errorMessage(err));
      });
  }, []);

  const splitEncodings = useMemo(
    () => encodings.filter((encoding) => encoding.supportsSplit),
    [encodings],
  );
  const combineEncodings = useMemo(
    () => encodings.filter((encoding) => encoding.supportsCombine),
    [encodings],
  );

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">Local-first desktop workbench</p>
          <h1 id="app-title">Safeparts</h1>
          <p className="hero-copy">
            Split one secret into threshold recovery shares, or combine recovery
            shares back into bytes. No backend, telemetry, or sidecar process is
            used at runtime.
          </p>
        </div>
        <div className="privacy-card" role="note">
          <strong>Local only</strong>
          <span>Secrets, recovery shares, and passphrases stay in memory.</span>
        </div>
      </section>

      <section className="workbench">
        <nav className="mode-rail" aria-label="Safeparts operation">
          <button
            className={mode === "split" ? "rail-button active" : "rail-button"}
            type="button"
            onClick={() => setMode("split")}
          >
            <span>Split</span>
            <small>Create recovery shares</small>
          </button>
          <button
            className={mode === "combine" ? "rail-button active" : "rail-button"}
            type="button"
            onClick={() => setMode("combine")}
          >
            <span>Combine</span>
            <small>Recover a secret</small>
          </button>
          <div className="rail-note">
            Pick a threshold people can execute under stress. Keep recovery
            shares stored separately.
          </div>
        </nav>

        <div className="task-panel">
          {mode === "split" ? (
            <SplitPanel
              encodings={splitEncodings}
              onError={setError}
              onStatus={setStatus}
            />
          ) : (
            <CombinePanel
              encodings={combineEncodings}
              onError={setError}
              onStatus={setStatus}
            />
          )}
        </div>
      </section>

      <section className="status-bar" aria-live="polite" aria-atomic="true">
        <span className={error ? "status-error" : undefined}>{error ? `Error: ${error}` : status}</span>
        {error ? (
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        ) : null}
      </section>
    </main>
  );
}

interface PanelProps {
  encodings: EncodingInfo[];
  onError: (message: string | null) => void;
  onStatus: (message: string) => void;
}

function SplitPanel({ encodings, onError, onStatus }: PanelProps) {
  const [inputMode, setInputMode] = useState<SplitInputMode>("text");
  const [secretText, setSecretText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [threshold, setThreshold] = useState(2);
  const [shareCount, setShareCount] = useState(3);
  const [encoding, setEncoding] = useState("base64url");
  const [passphrase, setPassphrase] = useState("");
  const [result, setResult] = useState<SplitResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (encodings.length > 0 && !encodings.some((item) => item.id === encoding)) {
      setEncoding(encodings[0].id);
    }
  }, [encoding, encodings]);

  async function handleFile(file: File | null) {
    if (!file) {
      setFileBytes(null);
      setFileName(null);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    setFileBytes(bytes);
    setFileName(file.name);
    setResult(null);
    onStatus(`Loaded ${file.name} into memory for splitting.`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    setBusy(true);
    try {
      const secret = inputMode === "text" ? textEncoder.encode(secretText) : fileBytes;
      if (!secret || secret.byteLength === 0) {
        throw new Error("provide text or choose a file before splitting");
      }
      const response = await splitSecret({
        secret,
        threshold,
        shareCount,
        encoding,
        passphrase: passphraseOrUndefined(passphrase),
      });
      setResult(response);
      onStatus(`Created ${response.shareCount} ${response.encoding} recovery shares.`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function clearSensitiveState() {
    setSecretText("");
    setFileBytes(null);
    setFileName(null);
    setPassphrase("");
    setResult(null);
    onStatus("Cleared split inputs and generated recovery shares from memory.");
  }

  return (
    <form className="panel-grid" onSubmit={handleSubmit}>
      <header className="panel-heading">
        <p className="eyebrow">Split</p>
        <h2>Create threshold recovery shares</h2>
        <p>
          Choose text or a file, then set the threshold and share count. Any
          threshold number of recovery shares can reconstruct the secret.
        </p>
      </header>

      <fieldset className="segmented" aria-label="Secret input type">
        <label>
          <input
            checked={inputMode === "text"}
            name="split-input-mode"
            type="radio"
            onChange={() => setInputMode("text")}
          />
          Text
        </label>
        <label>
          <input
            checked={inputMode === "file"}
            name="split-input-mode"
            type="radio"
            onChange={() => setInputMode("file")}
          />
          File
        </label>
      </fieldset>

      {inputMode === "text" ? (
        <label className="field field-large">
          <span>Secret text</span>
          <textarea
            value={secretText}
            placeholder="Paste or type a synthetic secret for your practice run."
            onChange={(event) => {
              setSecretText(event.target.value);
              setResult(null);
            }}
          />
        </label>
      ) : (
        <label className="drop-zone">
          <span>Secret file</span>
          <strong>{fileName ?? "Choose a local file"}</strong>
          <small>File bytes are read into memory and never uploaded.</small>
          <input type="file" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
        </label>
      )}

      <div className="config-grid">
        <label className="field">
          <span>Threshold</span>
          <input
            min={1}
            max={shareCount}
            type="number"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Share count</span>
          <input
            min={threshold}
            max={255}
            type="number"
            value={shareCount}
            onChange={(event) => setShareCount(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Share encoding</span>
          <select value={encoding} onChange={(event) => setEncoding(event.target.value)}>
            {encodings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <EncodingHint encodings={encodings} selected={encoding} />

      <label className="field">
        <span>Passphrase protection (optional)</span>
        <input
          autoComplete="off"
          type="password"
          value={passphrase}
          placeholder="Leave blank for no passphrase protection"
          onChange={(event) => setPassphrase(event.target.value)}
        />
      </label>

      <div className="actions">
        <button className="primary" disabled={busy} type="submit">
          {busy ? "Splitting…" : "Split secret"}
        </button>
        <button type="button" onClick={clearSensitiveState}>
          Clear
        </button>
      </div>

      {result ? <ShareResults result={result} onError={onError} onStatus={onStatus} /> : null}
    </form>
  );
}

function CombinePanel({ encodings, onError, onStatus }: PanelProps) {
  const [input, setInput] = useState("");
  const [encoding, setEncoding] = useState("auto");
  const [passphrase, setPassphrase] = useState("");
  const [inspection, setInspection] = useState<ShareInspection | null>(null);
  const [result, setResult] = useState<CombineResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setInput((current) => (current.trim().length > 0 ? `${current.trim()}\n${text}` : text));
    setInspection(null);
    setResult(null);
    onStatus(`Loaded recovery shares from ${file.name}.`);
  }

  async function handleInspect() {
    onError(null);
    try {
      const metadata = await inspectShares({ input, encoding });
      setInspection(metadata);
      onStatus(
        `Detected ${metadata.providedShares} ${metadata.encoding} recovery share${
          metadata.providedShares === 1 ? "" : "s"
        }.`,
      );
    } catch (err) {
      setInspection(null);
      onError(errorMessage(err));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    setBusy(true);
    try {
      const response = await combineShares({
        input,
        encoding,
        passphrase: passphraseOrUndefined(passphrase),
      });
      setResult(response);
      onStatus(`Reconstructed ${response.byteCount} bytes from ${response.shareCount} recovery shares.`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function clearSensitiveState() {
    setInput("");
    setPassphrase("");
    setInspection(null);
    setResult(null);
    onStatus("Cleared combine inputs and reconstructed secret from memory.");
  }

  return (
    <form className="panel-grid" onSubmit={handleSubmit}>
      <header className="panel-heading">
        <p className="eyebrow">Combine</p>
        <h2>Reconstruct a secret</h2>
        <p>
          Paste recovery shares or load them from a text file. Auto encoding uses
          Safeparts core detection before reconstruction.
        </p>
      </header>

      <label className="field field-large">
        <span>Recovery shares</span>
        <textarea
          value={input}
          placeholder="Paste recovery shares here. Separate mnemonic recovery shares with a blank line if a share wraps across lines."
          onBlur={() => {
            if (input.trim().length > 0) void handleInspect();
          }}
          onChange={(event) => {
            setInput(event.target.value);
            setInspection(null);
            setResult(null);
          }}
        />
      </label>

      <div className="config-grid combine-config">
        <label className="field">
          <span>Share encoding</span>
          <select
            value={encoding}
            onChange={(event) => {
              setEncoding(event.target.value);
              setInspection(null);
              setResult(null);
            }}
          >
            {encodings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="drop-zone compact">
          <span>Load shares file</span>
          <strong>Choose text file</strong>
          <input accept="text/*,.txt" type="file" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
        </label>
      </div>

      <EncodingHint encodings={encodings} selected={encoding} />

      <label className="field">
        <span>Passphrase, if required</span>
        <input
          autoComplete="off"
          type="password"
          value={passphrase}
          placeholder="Required only for passphrase-protected recovery shares"
          onChange={(event) => setPassphrase(event.target.value)}
        />
      </label>

      <ShareInspectionCard inspection={inspection} />

      <div className="actions">
        <button className="primary" disabled={busy} type="submit">
          {busy ? "Combining…" : "Combine recovery shares"}
        </button>
        <button type="button" onClick={() => void handleInspect()}>
          Inspect shares
        </button>
        <button type="button" onClick={clearSensitiveState}>
          Clear
        </button>
      </div>

      {result ? <CombineResult result={result} onError={onError} onStatus={onStatus} /> : null}
    </form>
  );
}

function EncodingHint({ encodings, selected }: { encodings: EncodingInfo[]; selected: string }) {
  const encoding = encodings.find((item) => item.id === selected);
  if (!encoding) return null;
  return <p className="hint">{encoding.description}</p>;
}

function ShareResults({
  result,
  onError,
  onStatus,
}: {
  result: SplitResponse;
  onError: (message: string | null) => void;
  onStatus: (message: string) => void;
}) {
  const allShares = shareInputText(result.shares, result.encoding);

  async function copyShare(share: string, index: number) {
    try {
      await copyText(share);
      onStatus(`Copied recovery share ${index + 1}.`);
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  return (
    <section className="results" aria-labelledby="split-results-title">
      <div className="results-header">
        <div>
          <p className="eyebrow">Generated</p>
          <h3 id="split-results-title">{result.shares.length} recovery shares</h3>
          <p>
            Threshold {result.threshold} of {result.shareCount}. Encoding {result.encoding}.
            {result.passphraseProtected ? " Passphrase protection enabled." : ""}
          </p>
        </div>
        <div className="mini-actions">
          <button type="button" onClick={() => void copyText(allShares).then(() => onStatus("Copied all recovery shares."), (err: unknown) => onError(errorMessage(err)))}>
            Copy all
          </button>
          <button
            type="button"
            onClick={() => downloadBlob(new Blob([allShares], { type: "text/plain" }), "safeparts-recovery-shares.txt")}
          >
            Save all
          </button>
        </div>
      </div>
      <div className="share-list">
        {result.shares.map((share, index) => (
          <article className="share-card" key={share.slice(0, 24) + index}>
            <div className="share-card-header">
              <strong>Recovery share {index + 1}</strong>
              <div>
                <button
                  type="button"
                  aria-label={`Copy recovery share ${index + 1}`}
                  onClick={() => void copyShare(share, index)}
                >
                  Copy
                </button>
                <button
                  type="button"
                  aria-label={`Save recovery share ${index + 1}`}
                  onClick={() => downloadBlob(new Blob([share], { type: "text/plain" }), `safeparts-share-${index + 1}.txt`)}
                >
                  Save
                </button>
              </div>
            </div>
            <textarea readOnly aria-label={`Recovery share ${index + 1}`} value={share} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ShareInspectionCard({ inspection }: { inspection: ShareInspection | null }) {
  if (!inspection) {
    return (
      <section className="inspection muted" aria-live="polite">
        <strong>Share inspection</strong>
        <span>Paste or load recovery shares, then inspect before combining.</span>
      </section>
    );
  }

  return (
    <section className="inspection" aria-live="polite">
      <strong>Share inspection</strong>
      <dl>
        <div>
          <dt>Encoding</dt>
          <dd>{inspection.encoding}</dd>
        </div>
        <div>
          <dt>Threshold</dt>
          <dd>{inspection.threshold}</dd>
        </div>
        <div>
          <dt>Share count</dt>
          <dd>{inspection.shareCount}</dd>
        </div>
        <div>
          <dt>Provided</dt>
          <dd>{inspection.providedShares}</dd>
        </div>
        <div>
          <dt>Passphrase</dt>
          <dd>{inspection.passphraseProtected ? "Required" : "Not required"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{inspection.readyToCombine ? "Ready" : "Need more recovery shares"}</dd>
        </div>
      </dl>
      <p>
        Set {inspection.setId.slice(0, 12)}… · indexes {inspection.shareIndexes.join(", ")}
        {!inspection.consistent ? " · metadata mismatch detected" : ""}
      </p>
    </section>
  );
}

function CombineResult({
  result,
  onError,
  onStatus,
}: {
  result: CombineResponse;
  onError: (message: string | null) => void;
  onStatus: (message: string) => void;
}) {
  async function copyRecoveredText() {
    if (!result.text) return;
    try {
      await copyText(result.text);
      onStatus("Copied reconstructed text.");
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  return (
    <section className="results" aria-labelledby="combine-results-title">
      <div className="results-header">
        <div>
          <p className="eyebrow">Reconstructed</p>
          <h3 id="combine-results-title">Secret bytes are ready</h3>
          <p>
            {result.byteCount} bytes from {result.shareCount} recovery shares using {result.encoding}.
          </p>
        </div>
        <div className="mini-actions">
          {result.isUtf8 ? (
            <button type="button" onClick={() => void copyRecoveredText()}>
              Copy text
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              const bytes = toBytes(result);
              downloadBlob(new Blob([bytes.buffer as ArrayBuffer]), "safeparts-reconstructed-secret.bin");
            }}
          >
            Save bytes
          </button>
        </div>
      </div>
      {result.isUtf8 && result.text !== null ? (
        <label className="field field-large">
          <span>Reconstructed text</span>
          <textarea readOnly value={result.text} />
        </label>
      ) : (
        <div className="binary-note">The reconstructed secret is not valid UTF-8. Save the bytes to recover the original file.</div>
      )}
    </section>
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "the operation failed";
}
