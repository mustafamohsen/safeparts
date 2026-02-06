import type { CoreEncoding } from "safeparts-core";

export const ENCODINGS: { value: CoreEncoding; label: string }[] = [
  { value: "mnemo-words", label: "Mnemonic (words)" },
  { value: "mnemo-bip39", label: "BIP39 (phrases)" },
  { value: "base58check", label: "Base58Check" },
  { value: "base64url", label: "Base64URL" },
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
