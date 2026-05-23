# Safeparts Explainer Script v0.1

This is the working narration and scene map for the Remotion composition in `src/SafepartsExplainer.tsx`.

Target runtime: about 15 minutes at 30 fps.

## Direction

Make it feel like a security diagram came alive: black glass, emerald light, quiet gridlines, and the Safeparts shield as the visual anchor. Avoid a slide-deck rhythm. Each scene should answer the narration with motion: a secret becomes a constellation, shares move through gates, curves snap into place, packets get wrapped and encoded.

## Scene map

1. **The problem** — One recovery key becomes a single point of failure. Safeparts turns it into distributed shares.
2. **Mental model** — Explain `k-of-n`: create `n` shares, require `k` to recover. One share is not a slice of the password.
3. **Use cases** — Password manager recovery, 2FA backup codes, break-glass credentials, family planning, client handoff.
4. **Product shape** — Web/WASM, CLI, TUI, and Rust core all orbit the same algorithmic engine.
5. **Threat model** — Safeparts does not store shares or protect you from someone who has `k` of them.
6. **Split flow** — Secret bytes, optional encryption, BLAKE3 tag, Shamir split, SharePacket, text encoding.
7. **Underlying maths** — Shamir sharing over `GF(256)`: enough points reveal the curve; fewer points leave too many possible curves.
8. **Combine flow** — Decode packets, validate metadata, interpolate, check BLAKE3, then decrypt if needed.
9. **Encodings** — The same packet can wear different formats: base64url, base58check, mnemo-words, mnemo-bip39.
10. **Concrete plans** — Personal recovery, team break-glass, family planning, and the runbook that makes recovery possible.
11. **Close** — Safeparts turns a single secret into a plan. The math supplies the threshold; people supply the procedure.

## Narration draft

### 1. The problem

Imagine you have one recovery key. It might unlock your password manager. It might be the emergency credential for your company’s infrastructure. It might be the one backup code that saves you when your phone is gone.

So where do you put it?

If you keep it on your laptop, the laptop becomes the weak point. If you put it in one safe, the safe becomes the weak point. If you give it to one trusted person, that person becomes the weak point.

Safeparts is built for that situation. It takes one secret and splits it into multiple recovery shares. Later, you recover the original secret with a threshold number of those shares.

### 2. The mental model

The model is called `k-of-n`.

`n` is how many shares you create. `k` is how many are required to recover.

With `k=2, n=3`, any two shares recover the secret. One share reveals nothing useful. If you lose two shares and only one remains, recovery is impossible.

A share is not one third of the password. It is more like a coordinate in a hidden pattern. One coordinate alone tells you nothing. Enough coordinates reveal the original.

### 3. Who it is for

Safeparts is for people and teams who need recovery without one perfect backup.

For individuals: password manager recovery keys, 2FA backup codes, offline emergency access, family or executor planning.

For teams: API tokens, signing keys, secrets-manager master keys, and break-glass credentials.

The common thread is logistics. Who holds which share? Where is it stored? What happens if somebody is travelling, ill, or unavailable during an outage?

The cryptography matters, but the recovery plan matters just as much.

### 4. Interfaces

Safeparts ships with several front ends over the same Rust core.

The web app runs in the browser through WebAssembly. The CLI is built for scripts and runbooks. The TUI gives an interactive terminal workflow for offline machines.

Different surfaces, same core: split, combine, packets, encodings, and crypto.

### 5. What it does not do

Safeparts is not a password manager. It does not store your secrets. It does not decide where shares live. It does not protect you if someone legitimately obtains enough shares.

If your threshold is `3 of 5` and an attacker gets three valid shares, they can reconstruct the secret. That is the rule you chose.

Treat shares like the secret. Do not paste real shares into chat, tickets, logs, screenshots, or issue trackers.

### 6. Split flow

Safeparts starts with bytes. Text, keys, tokens, files: it sees bytes.

If passphrase protection is enabled, it encrypts first. Argon2id turns the passphrase into a key, then ChaCha20-Poly1305 encrypts the secret.

Next, Safeparts computes a BLAKE3 hash of the data and appends it as a 32-byte integrity tag.

Then it applies Shamir-style secret sharing over `GF(256)`, byte by byte.

Each result is wrapped into a SharePacket with metadata: `set_id`, `k`, `n`, `x`, payload, and crypto parameters if needed.

Finally, the packet is encoded for storage or transport.

### 7. The maths

Shamir secret sharing uses a simple geometric fact: a degree `k-1` polynomial is determined by `k` points.

For `k=3`, Safeparts can hide one byte as the constant term of a quadratic:

`f(x) = secret_byte + a1*x + a2*x²`

The random coefficients hide the byte. Shares are evaluations of the polynomial at `x=1`, `x=2`, `x=3`, and so on.

Recovery uses Lagrange interpolation. Give it enough points and the curve snaps into place. Read the value at `x=0`, and you get the original byte.

Safeparts does this in `GF(256)`, a finite field with 256 values. That keeps the scheme byte-native. The trade-off is the practical limit: `n` can be at most 255, because `x=0` is reserved for reconstruction.

### 8. Combine flow

Combining starts by decoding share text back into packets.

Safeparts checks that the shares agree: same set, same threshold, same share count, unique share indices, matching crypto parameters.

Then it interpolates the payload and checks the BLAKE3 tag. If the tag does not match, recovery fails.

If the payload was encrypted, Safeparts decrypts only after the share set is consistent.

### 9. Encodings

Encodings do not change the secret sharing. They only change how the packet is represented.

`base64url` is compact and machine-friendly. `base58check` avoids ambiguous characters and includes a checksum. `mnemo-words` is better for paper or metal backups. `mnemo-bip39` creates BIP-39-valid phrases, but those phrases are Safeparts shares, not wallet seeds.

The right encoding is the one your recovery plan can store and re-enter reliably.

### 10. Concrete plans

For personal recovery, `2 of 3` is a good starting point: one share in a reachable secure place, one offline, and one off-site.

For a small team, `3 of 5` gives separation of duties: operations, security, engineering lead, executive sponsor, and an offline vault.

For family planning, the goal may be controlled recovery under specific conditions, not secrecy from everyone forever.

In all cases, write the runbook. Who holds each share? How do you contact them? When do you practice? What happens after recovery?

### 11. Close

Safeparts turns one dangerous single point of failure into a distributed recovery plan.

For non-technical users: split a secret, store shares separately, require cooperation to recover.

For technical users: Shamir-style sharing over `GF(256)`, BLAKE3 integrity, optional encrypt-before-split with Argon2id and ChaCha20-Poly1305, versioned packets, and reversible encodings.

The math supplies the threshold. People supply the procedure.
