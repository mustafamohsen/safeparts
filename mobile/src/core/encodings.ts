import type { CoreEncoding } from "safeparts-core";

export const ENCODINGS: {
  value: CoreEncoding;
  labelKey:
    | "encoding.mnemoWords"
    | "encoding.mnemoBip39"
    | "encoding.base58check"
    | "encoding.base64url";
}[] = [
  { value: "mnemo-words", labelKey: "encoding.mnemoWords" },
  { value: "mnemo-bip39", labelKey: "encoding.mnemoBip39" },
  { value: "base58check", labelKey: "encoding.base58check" },
  { value: "base64url", labelKey: "encoding.base64url" },
];

export function detectEncodingFromText(text: string): CoreEncoding | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // mnemo-bip39 uses multiple phrases separated by `/`.
  if (trimmed.includes("/")) return "mnemo-bip39";

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const allBase64Urlish = tokens.every((t) => /^[A-Za-z0-9_-]+$/.test(t));
  const allBase58Checkish = tokens.every((t) => /^[1-9A-HJ-NP-Za-km-z]+$/.test(t));
  const allLowerWords = tokens.every((t) => /^[a-z]+$/.test(t));

  const lens = tokens
    .map((t) => t.length)
    .sort((a, b) => a - b);
  const medianLen = lens[Math.floor(lens.length / 2)] ?? 0;

  const hasBase64Hints = tokens.some((t) => /[-_0-9A-Z]/.test(t));

  if (
    allBase64Urlish &&
    (hasBase64Hints || medianLen >= 16 || (tokens.length === 1 && medianLen >= 24))
  ) {
    return "base64url";
  }

  if (allBase58Checkish && medianLen >= 16) {
    return "base58check";
  }

  if (allLowerWords && tokens.length >= 6 && medianLen <= 12) {
    return "mnemo-words";
  }

  return null;
}
