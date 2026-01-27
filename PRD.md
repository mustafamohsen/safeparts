# Product Requirements Document (PRD)

## Title

**Safeparts** — Arbitrary String ⇄ Threshold Secret Shares ⇄ Human-Friendly Mnemonics

---

## 1. Purpose & Scope

This project delivers a cross-platform tool and library for **splitting arbitrary secrets** into threshold-protected shares using **SSSS Secret Sharing** (SSS over GF(256)), and representing those shares in **human-friendly encodings** (ASCII/Base58/Base64 or BIP-39 word mnemonics). The system must support both **Rust CLI/library implementation** and optional **React-based frontend** for usability.

**Use cases:**

* Secure backup of cryptographic keys, API tokens, wallet seeds, or arbitrary data.
* Distribution of secrets across trusted parties.
* Recovery with threshold authentication.
* Usable by both developers (CLI) and non-technical users (web UI).

---

## 2. Functional Requirements

### 2.1 Secret Splitting

* Input: arbitrary byte string (from stdin, file, or text entry).
* Apply SSSS Secret Sharing (GF(256), per-byte polynomial).
* Parameters: threshold `k`, total shares `n` (1 ≤ k ≤ n ≤ 255).
* Output: `n` share packets containing:

  * Metadata (set ID, k, n, x, secret length, flags).
  * Payload (the per-share Y values).
  * Integrity: BLAKE3(secret) appended before splitting.
* Optional: Pre-encrypt secret with passphrase (`Argon2id` → `ChaCha20-Poly1305`).

### 2.2 Encoding Options

* **ASCII/BaseXX**:

  * Base58Check
  * Base64URL (no padding)
* **Mnemonic modes**:

  * `mnemo-bip39`: Chunk packets into valid BIP-39 entropy blocks (16/20/24/28/32 bytes), output multiple real BIP-39 sentences per share.
  * `mnemo-words`: Single sentence per share, using BIP-39 wordlist as generic 2048-ary alphabet, with CRC16.
* Each encoding is reversible.

### 2.3 Reconstruction

* Input: ≥k shares in any supported encoding.
* Validate metadata consistency.
* Apply Lagrange interpolation to reconstruct the blob.
* Verify BLAKE3 tag (threshold-protected integrity).
* If passphrase was used: decrypt using Argon2id + ChaCha20-Poly1305.
* Output: exact original string/bytes.

### 2.4 Error Handling

* Insufficient shares (\<k) → fail with explicit error.
* Wrong/forged share → fail at BLAKE3 check.
* Mnemonic typo → detected via BIP-39 checksum (mnemo-bip39) or CRC16 (mnemo-words).
* Wrong passphrase → fail at AEAD authentication.

### 2.5 CLI UX

```bash
safeparts split -k 3 -n 5 -e mnemo-bip39
safeparts combine -o recovered.bin
```

* `split`: produce shares in selected encoding.
* `combine`: reconstruct from shares.
* Input via files or stdin.
* Output to stdout or files.
* Passphrase prompts when enabled.

### 2.6 React UI

* Web-based tool for non-technical users.
* **Split workflow:**

  * Input string (text area / file upload).
  * Choose k/n, encoding, passphrase.
  * Generate shares (display as Base58 or mnemonic wordlists).
  * Copy/export shares (QR codes optional).
* **Combine workflow:**

  * Paste/import shares (auto-detect encoding).
  * Validate threshold.
  * Prompt for passphrase if required.
  * Show recovered secret (download as file or display).

---

## 3. Non-Functional Requirements

* **Security:**

  * Threshold secrecy: \<k shares reveal nothing.
  * Integrity guaranteed by threshold-protected BLAKE3.
  * Optional AEAD passphrase adds a second factor.
  * Zeroize secrets in memory (`zeroize` crate in Rust).
* **Performance:**

  * Linear in secret length.
  * Support secrets from a few bytes to several MB.
* **Portability:**

  * Rust library is cross-platform.
  * React frontend uses WASM bindings to Rust core (via `wasm-pack`).
* **Usability:**

  * Mnemonics are copyable, printable, or QR-rendered.
  * CLI supports piping and scripting.
* **Compatibility:**

  * BIP-39 mnemonics must use official wordlists.
  * Optional import/export of classic `ssss` share strings.

---

## 4. Technical Design (Rust)

* **Core crate (`safeparts_core`):**

  * `gf256.rs`: field arithmetic.
  * `sss.rs`: split/combine algorithms.
  * `packet.rs`: versioned share packet format.
  * `ascii.rs`: Base58/Base64 encoders.
  * `mnemo.rs`: mnemonic encoding/decoding.
  * `crypto.rs`: BLAKE3, Argon2id, ChaCha20-Poly1305, zeroization.
* **CLI crate (`safeparts`):**

  * Uses `clap` for commands.
  * Split/combine subcommands.
  * File/stdin/stdout I/O.
* **Tests:**

  * Round-trip invariants.
  * Mnemonic typo detection.
  * AEAD passphrase correctness.

---

## 5. Technical Design (React)

* **Frontend stack:** React + TypeScript + Tailwind (or shadcn/ui for consistency).
* **WASM integration:**

  * Expose `split_secret` and `combine_shares` via `wasm-bindgen`.
  * Build Rust core to WASM with `wasm-pack build --target web`.
  * JS/TS wrapper for ergonomic calls.
* **Components:**

  * `SplitForm`: form inputs (string, k, n, encoding, passphrase).
  * `ShareList`: display resulting shares (copy, download, QR).
  * `CombineForm`: input multiple shares (text areas, file upload).
  * `ResultView`: show reconstructed secret.
* **UX:**

  * Client-only, no backend needed.
  * Input validation + error feedback.
  * Light/dark theme.

---

## 6. Milestones

1. **MVP CLI (Rust):** split/combine, ASCII shares, BLAKE3 integrity.
2. Add mnemonic encodings (bip39-valid + wordlist-only).
3. Add AEAD passphrase.
4. WASM export of Rust core.
5. Basic React UI with split/combine flows.
6. Advanced UX (QR codes, error correction suggestions).

---

## 7. Risks & Mitigations

* **Mnemonic compatibility confusion:** clarify that mnemo-bip39 is not a wallet seed; it’s encoding shares.
* **Passphrase key derivation cost:** use Argon2id with safe defaults.
* **Long secrets → many BIP-39 sentences:** mitigate with wordlist-only mode or QR export.
* **User transcription errors:** checksum/CRC, fuzzy matching in React UI.

---

## 8. Success Metrics

* CLI round-trip tests pass across all encodings.
* React UI can split/combine secrets fully in-browser.
* Encoding formats are reversible and robust.
* At least 90% of test users succeed in manual share transcription/reconstruction with no errors.

