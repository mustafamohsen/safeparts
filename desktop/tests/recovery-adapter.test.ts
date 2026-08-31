import { expect, mock, test } from "bun:test";

const invoke = mock(async (command: string, args?: { input?: string }) => {
  if (command !== "combine_shares_command") {
    throw new Error(`unexpected command: ${command}`);
  }

  if (args?.input === "valid-unicode") {
    return {
      secret: [0x53],
      byteCount: 38,
      isUtf8: true,
      text: "Safeparts العربية 🌍\u0000after-nul",
      encoding: "base64url",
      shareCount: 2,
    };
  }

  return {
    secret: [0xff, 0xfe, 0x41],
    byteCount: 3,
    isUtf8: false,
    text: null,
    encoding: "base64url",
    shareCount: 2,
  };
});

mock.module("@tauri-apps/api/core", () => ({ invoke }));

const { ensureWasm, recoveredSecretText } = await import("../src/wasm");

test("Tauri recovery adapter preserves valid Unicode and embedded NUL text", async () => {
  const adapter = await ensureWasm();
  const recovered = await adapter.combine_share_input(
    "valid-unicode",
    "base64url",
  );

  expect(recoveredSecretText(recovered)).toBe(
    "Safeparts العربية 🌍\u0000after-nul",
  );
});

test("Tauri recovery adapter refuses binary metadata instead of decoding bytes", async () => {
  const adapter = await ensureWasm();
  const recovered = await adapter.combine_share_input(
    "invalid-utf8",
    "base64url",
  );

  expect(recoveredSecretText(recovered)).toBeNull();
  expect(recovered.isUtf8).toBeFalse();
  expect(recovered.text).toBeNull();
});
