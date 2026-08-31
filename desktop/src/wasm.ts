import {
  combineShares,
  inspectShares,
  splitSecret,
  type CombineResponse,
} from "./commands";

type Encoding = "base64url" | "mnemo-words" | "auto";

type ShareInspectionAdapter = {
  k: number;
  encoding?: string;
};

type RecoveredSecret = Pick<CombineResponse, "isUtf8" | "text">;

let cached: DesktopSafepartsAdapter | null = null;

export function recoveredSecretText(recovered: RecoveredSecret): string | null {
  if (!recovered.isUtf8 || recovered.text === null) return null;
  return recovered.text;
}

function toBytes(value: Uint8Array | ArrayBuffer | ArrayLike<number>): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(Array.from(value));
}

function joinShares(shares: ArrayLike<string>): string {
  return Array.from(shares)
    .map((share) => String(share).trim())
    .filter(Boolean)
    .join("\n\n");
}

class DesktopSafepartsAdapter {
  async split_secret(
    bytes: Uint8Array | ArrayBuffer | ArrayLike<number>,
    k: number,
    n: number,
    encoding: Encoding,
    passphrase?: string,
  ): Promise<string[]> {
    const response = await splitSecret({
      secret: toBytes(bytes),
      threshold: k,
      shareCount: n,
      encoding,
      passphrase,
    });
    return response.shares;
  }

  async combine_share_input(
    input: string,
    encoding: Encoding,
    passphrase?: string,
  ): Promise<CombineResponse> {
    return combineShares({
      input,
      encoding,
      passphrase,
    });
  }

  async combine_shares(
    shares: ArrayLike<string>,
    encoding: Encoding,
    passphrase?: string,
  ): Promise<CombineResponse> {
    return this.combine_share_input(joinShares(shares), encoding, passphrase);
  }

  async inspect_share_input(
    input: string,
    encoding: Encoding,
  ): Promise<ShareInspectionAdapter> {
    const inspection = await inspectShares({ input, encoding });
    return {
      k: inspection.threshold,
      encoding: inspection.encoding,
    };
  }

  async inspect_share(share: string, encoding: Encoding): Promise<ShareInspectionAdapter> {
    return this.inspect_share_input(share, encoding);
  }

  async share_threshold(share: string, encoding: Encoding): Promise<number> {
    const inspection = await this.inspect_share(share, encoding);
    return inspection.k;
  }
}

export async function ensureWasm(): Promise<DesktopSafepartsAdapter> {
  cached ??= new DesktopSafepartsAdapter();
  return cached;
}
