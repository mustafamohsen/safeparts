# AGENTS.md — safeparts_core

## Purpose

Owns the core library for secret splitting, combining, packets, encodings, integrity checks, and optional passphrase protection.

## Ownership

- `src/sss.rs`, `src/gf256.rs`: threshold sharing math.
- `src/packet.rs`: versioned share packet parsing and serialization.
- `src/encoding.rs`, `src/ascii.rs`, `src/mnemo_*`: share encoding API and implementations.
- `src/crypto.rs`: passphrase protection using KDF and AEAD.
- `src/error.rs`: typed core errors.
- `src/lib.rs`: public API.

## Local Contracts

- Keep cryptographic and encoding rules here; front-ends adapt IO and presentation only.
- Do not log or fixture real secrets, share packets, passphrases, or reconstructed secrets.
- Preserve strict validation and typed errors for malformed input.
- Workspace lint policy forbids `unsafe`; do not weaken it.

## Work Guidance

- Follow `docs/agents/conventions.md` and `docs/dev/surfaces/core.md`.
- Add deterministic round-trip tests and negative tests for behavior changes.
- Keep public API changes explicit and update downstream surfaces when needed.

## Verification

- `cargo test -p safeparts_core`
- `cargo test --all-features`
- `cargo fmt --all -- --check`
- `cargo clippy --all-targets --all-features -- -D warnings`

## Child DOX Index

- No child AGENTS.md files yet.
