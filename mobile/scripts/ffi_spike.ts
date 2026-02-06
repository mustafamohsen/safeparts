import { CString, dlopen, FFIType, suffix } from "bun:ffi";

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };
type Resp<T> = Ok<T> | Err;

function parseResp<T>(raw: string): Resp<T> {
  return JSON.parse(raw) as Resp<T>;
}

const libPath = `./src-native/target/release/libsafeparts_mobile_bridge.${suffix}`;

const lib = dlopen(libPath, {
  safeparts_string_free: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  safeparts_supported_encodings_json: {
    args: [],
    returns: FFIType.ptr,
  },
  safeparts_split_secret_json: {
    args: [FFIType.cstring, FFIType.u8, FFIType.u8, FFIType.cstring, FFIType.cstring],
    returns: FFIType.ptr,
  },
  safeparts_combine_shares_json: {
    args: [FFIType.cstring, FFIType.cstring, FFIType.cstring],
    returns: FFIType.ptr,
  },
});

function cstr(s: string): ArrayBuffer {
  // bun:ffi requires buffers for cstring arguments.
  return new TextEncoder().encode(`${s}\0`).buffer;
}

function callJson(ptr: number): string {
  const s = new CString(ptr).toString();
  lib.symbols.safeparts_string_free(ptr);
  return s;
}

const encRaw = callJson(lib.symbols.safeparts_supported_encodings_json());
const encResp = parseResp<string[]>(encRaw);
if (!encResp.ok) throw new Error(encResp.error);

const enc = encResp.value[0] ?? "base64url";
const secretText = "hello safeparts";
const secretB64 = Buffer.from(secretText, "utf8").toString("base64");

const splitRaw = callJson(
  lib.symbols.safeparts_split_secret_json(cstr(secretB64), 2, 3, cstr(enc), cstr("")),
);
const splitResp = parseResp<string[]>(splitRaw);
if (!splitResp.ok) throw new Error(splitResp.error);

const shares = splitResp.value;
const combineRaw = callJson(
  lib.symbols.safeparts_combine_shares_json(cstr(JSON.stringify(shares)), cstr(enc), cstr("")),
);
const combineResp = parseResp<{ secret_b64: string }>(combineRaw);
if (!combineResp.ok) throw new Error(combineResp.error);

const recovered = Buffer.from(combineResp.value.secret_b64, "base64").toString("utf8");
if (recovered !== secretText) {
  throw new Error(`mismatch: got=${recovered}`);
}

console.log("ffi spike ok", { encoding: enc, shares: shares.length });
