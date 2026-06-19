import { invoke } from "@tauri-apps/api/core";

export interface EncodingInfo {
  id: string;
  label: string;
  description: string;
  supportsSplit: boolean;
  supportsCombine: boolean;
}

export interface SplitResponse {
  shares: string[];
  threshold: number;
  shareCount: number;
  encoding: string;
  passphraseProtected: boolean;
}

export interface CombineResponse {
  secret: number[];
  byteCount: number;
  isUtf8: boolean;
  text: string | null;
  encoding: string;
  shareCount: number;
}

export interface ShareInspection {
  threshold: number;
  shareCount: number;
  providedShares: number;
  encoding: string;
  passphraseProtected: boolean;
  readyToCombine: boolean;
  consistent: boolean;
  setId: string;
  shareIndexes: number[];
}

export function supportedEncodings(): Promise<EncodingInfo[]> {
  return invoke<EncodingInfo[]>("supported_encodings_command");
}

export function splitSecret(args: {
  secret: Uint8Array;
  threshold: number;
  shareCount: number;
  encoding: string;
  passphrase?: string;
}): Promise<SplitResponse> {
  return invoke<SplitResponse>("split_secret_command", {
    secret: Array.from(args.secret),
    threshold: args.threshold,
    shareCount: args.shareCount,
    encoding: args.encoding,
    passphrase: args.passphrase,
  });
}

export function combineShares(args: {
  input: string;
  encoding: string;
  passphrase?: string;
}): Promise<CombineResponse> {
  return invoke<CombineResponse>("combine_shares_command", args);
}

export function inspectShares(args: {
  input: string;
  encoding: string;
}): Promise<ShareInspection> {
  return invoke<ShareInspection>("inspect_shares_command", args);
}
