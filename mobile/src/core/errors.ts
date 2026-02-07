import type { useI18n } from "../i18n/i18n";

type TFn = ReturnType<typeof useI18n>["t"];

export function localizeError(err: unknown, t: TFn): string {
  const msg = err instanceof Error ? err.message : String(err);

  const m = msg.match(/need\s+(\d+)\s+shares,\s*got\s+(\d+)/i);
  if (m) {
    return t("error.notEnoughShares", { k: m[1]!, m: m[2]! });
  }

  if (/passphrase required/i.test(msg)) return t("error.passphraseRequired");
  if (/integrity check failed/i.test(msg)) return t("error.integrityFailed");
  if (/shares are from different sets/i.test(msg)) return t("error.inconsistentShares");

  // Core decryption errors vary; handle the common shape.
  if (/decrypt/i.test(msg) || /integrity/i.test(msg)) return t("error.decryptFailed");

  return msg;
}
