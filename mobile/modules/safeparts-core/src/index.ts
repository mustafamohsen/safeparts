import { requireNativeModule } from "expo-modules-core";

export type CoreEncoding =
  | "base64url"
  | "base58check"
  | "mnemo-words"
  | "mnemo-bip39";

type NativeSafepartsCore = {
  supportedEncodings(): string[];
  getVersion(): string;
  splitSecret(
    secretB64: string,
    k: number,
    n: number,
    encoding: string,
    passphrase?: string | null,
  ): Promise<string[]>;
  combineShares(
    shares: string[],
    encoding: string,
    passphrase?: string | null,
  ): Promise<string>;
};

const Native = requireNativeModule<NativeSafepartsCore>("SafepartsCore");

export function supportedEncodings(): CoreEncoding[] {
  return Native.supportedEncodings() as CoreEncoding[];
}

export function getVersion(): string {
  return Native.getVersion();
}

export async function splitSecret(
  secretB64: string,
  k: number,
  n: number,
  encoding: CoreEncoding,
  passphrase?: string,
): Promise<string[]> {
  return Native.splitSecret(secretB64, k, n, encoding, passphrase ? passphrase : null);
}

export async function combineShares(
  shares: string[],
  encoding: CoreEncoding,
  passphrase?: string,
): Promise<string> {
  return Native.combineShares(shares, encoding, passphrase ? passphrase : null);
}
