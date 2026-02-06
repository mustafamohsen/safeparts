import { Base64 } from "js-base64";

export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Base64.fromUint8Array(bytes);
}

export function base64ToUtf8(b64: string): string {
  const bytes = Base64.toUint8Array(b64);
  return new TextDecoder().decode(bytes);
}
