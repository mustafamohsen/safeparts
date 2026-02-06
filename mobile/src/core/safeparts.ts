import type { CoreEncoding } from "safeparts-core";
import {
  combineShares as nativeCombineShares,
  getVersion as nativeGetVersion,
  splitSecret as nativeSplitSecret,
  supportedEncodings as nativeSupportedEncodings,
} from "safeparts-core";

export function supportedEncodings(): CoreEncoding[] {
  return nativeSupportedEncodings();
}

export function getVersion(): string {
  return nativeGetVersion();
}

export async function splitSecret(
  secretB64: string,
  k: number,
  n: number,
  encoding: CoreEncoding,
  passphrase?: string,
): Promise<string[]> {
  return nativeSplitSecret(secretB64, k, n, encoding, passphrase);
}

export async function combineShares(
  shares: string[],
  encoding: CoreEncoding,
  passphrase?: string,
): Promise<string> {
  return nativeCombineShares(shares, encoding, passphrase);
}
