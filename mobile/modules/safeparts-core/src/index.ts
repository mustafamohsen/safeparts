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

let nativeModule: NativeSafepartsCore | null = null;

function getNativeModule(): NativeSafepartsCore {
  if (nativeModule) {
    return nativeModule;
  }

  try {
    nativeModule = requireNativeModule<NativeSafepartsCore>("SafepartsCore");
    return nativeModule;
  } catch {
    throw new Error(
      "SafepartsCore native module is unavailable. Use a development build (expo run:ios / expo run:android), not Expo Go.",
    );
  }
}

export function supportedEncodings(): CoreEncoding[] {
  return getNativeModule().supportedEncodings() as CoreEncoding[];
}

export function getVersion(): string {
  return getNativeModule().getVersion();
}

export async function splitSecret(
  secretB64: string,
  k: number,
  n: number,
  encoding: CoreEncoding,
  passphrase?: string,
): Promise<string[]> {
  return getNativeModule().splitSecret(secretB64, k, n, encoding, passphrase ? passphrase : null);
}

export async function combineShares(
  shares: string[],
  encoding: CoreEncoding,
  passphrase?: string,
): Promise<string> {
  return getNativeModule().combineShares(shares, encoding, passphrase ? passphrase : null);
}
