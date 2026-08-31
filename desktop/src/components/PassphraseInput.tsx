import { useState } from "react";

import { ClearButton } from "./ClearButton";
import { PasteButton } from "./PasteButton";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      {hidden ? (
        <path
          d="m4 4 16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

type PassphraseInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  autoComplete: "new-password" | "current-password";
  labelledBy: string;
  describedBy: string;
  showLabel: string;
  hideLabel: string;
  pasteLabel: string;
  clearLabel: string;
  invalid?: boolean;
};

export function PassphraseInput({
  id,
  value,
  onChange,
  onClear,
  autoComplete,
  labelledBy,
  describedBy,
  showLabel,
  hideLabel,
  pasteLabel,
  clearLabel,
  invalid = false,
}: PassphraseInputProps) {
  const [revealed, setRevealed] = useState(false);
  const revealLabel = revealed ? hideLabel : showLabel;

  function clear() {
    setRevealed(false);
    if (onClear) onClear();
    else onChange("");
  }

  return (
    <div className="relative mt-2">
      <input
        id={id}
        type={revealed ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input input-with-passphrase-actions"
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      />
      <div className="absolute inset-y-1 end-1 flex items-stretch">
        <button
          type="button"
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealLabel}
          title={revealLabel}
          aria-controls={id}
          aria-pressed={revealed}
          className="inline-flex h-auto w-8 items-center justify-center rounded-lg bg-transparent text-slate-400 transition-colors hover:bg-transparent hover:text-slate-200 focus-visible:outline-none focus-visible:text-slate-100"
        >
          <EyeIcon hidden={!revealed} />
          <span className="sr-only">{revealLabel}</span>
        </button>
        {value.length === 0 ? (
          <PasteButton
            label={pasteLabel}
            onPaste={onChange}
            className="h-auto w-8 hover:bg-transparent"
          />
        ) : (
          <ClearButton
            label={clearLabel}
            onClick={clear}
            className="h-auto w-8 hover:bg-transparent"
          />
        )}
      </div>
    </div>
  );
}
