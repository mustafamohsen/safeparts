# Safeparts Explainer Script v0.3

Working narration and scene map for `src/SafepartsExplainer.tsx`.

Target runtime: about 15 minutes at 30 fps.

## Direction

The piece should feel like a security diagram waking up. Black glass, emerald light, quiet gridlines, and the Safeparts shield carry the look. Let motion do the teaching: one key becomes a constellation, shares unlock a threshold gate, curves snap into place, and packet formats wrap the same underlying data.

## Scene map

1. **The problem** — A recovery key saves you in an emergency, and it creates a delicate storage decision.
2. **Mental model** — `k-of-n`: create `n` shares, require `k` to recover. A single share is a coordinate in a larger pattern.
3. **Use cases** — Password-manager recovery, 2FA backup codes, break-glass credentials, family planning, and client handoff.
4. **Product shape** — Web/WASM, CLI, TUI, and the Rust core use the same split/combine engine.
5. **Threat model** — The storage plan carries the security boundary.
6. **Split flow** — Bytes, optional encryption, BLAKE3 tag, Shamir split, SharePacket, text encoding.
7. **Underlying maths** — Shamir sharing over `GF(256)`: enough points identify the curve.
8. **Combine flow** — Decode packets, validate metadata, interpolate, check BLAKE3, then decrypt if needed.
9. **Encodings** — base64url, base58check, mnemo-words, and mnemo-bip39 are storage formats for the same packet.
10. **Concrete plans** — Personal recovery, team break-glass, family planning, and the runbook that makes recovery possible.
11. **Close** — Safeparts turns one secret into a recovery procedure. The math supplies the threshold; people supply the discipline.

## Narration draft

### 1. The problem

Start with one recovery key.

Maybe it unlocks your password manager. Maybe it is the emergency credential for production infrastructure. Maybe it is the backup code you need after a phone disappears.

That key is a lifesaver. It is also awkward to store.

Keep it on your laptop, and the laptop becomes the place everything depends on. Put it in one safe, and the safe carries the whole burden. Give it to one trusted person, and recovery now depends on that person being available and uncompromised.

Safeparts gives you another shape for the problem. It turns one secret into several recovery shares. Later, the original secret comes back when enough of those shares are brought together.

You choose the threshold. Safeparts enforces it.

### 2. The mental model

The model is called `k-of-n`.

`n` is the number of shares you create. `k` is the number required to recover.

With `k=2, n=3`, any two shares can recover the secret. One share by itself has no practical value. If only one share survives, the recovery path is gone.

Picture each share as a point on a hidden curve. One point leaves many possible curves. Enough points identify the curve, and the curve leads back to the secret.

That is the basic promise: recovery follows the group you chose and the threshold you set.

### 3. Who it is for

Safeparts helps when recovery should require cooperation.

For an individual, that might be a password-manager recovery key, a set of 2FA backup codes, or emergency access that should survive a lost device.

For a family, it can support executor planning: the right people can cooperate when the time comes, while daily access stays limited.

For a team, it fits API tokens, signing keys, secrets-manager master keys, and break-glass credentials.

The important decisions are practical. Who has which share? Where is it stored? How do you reach a holder during travel, illness, or an outage? Can someone follow the runbook at 2 a.m.?

The cryptography gives you a threshold. The plan makes that threshold usable.

### 4. Interfaces

Safeparts has several front ends over the same Rust core.

The web app runs locally in the browser through WebAssembly. The CLI is for scripts and runbooks. The TUI is an interactive terminal workflow for offline machines and recovery laptops.

Different surfaces, same engine: split, combine, packets, encodings, and crypto.

### 5. Threat model

Safeparts moves risk out of a single object and into a distribution plan. That plan deserves care.

If the threshold is `3 of 5` and an attacker gets three valid shares, they can reconstruct the secret. If too many shares are lost, recovery is gone. Both outcomes follow directly from the threshold you chose.

So share placement is part of the security design.

Two shares in one cloud folder behave like one failure zone. A screenshot in a ticket system can outlive the incident that created it. A clever procedure that nobody can execute under stress becomes another fragile dependency.

Treat shares like sensitive material. Keep them separated. Write down the recovery path. Practice with a synthetic secret before relying on the real one.

### 6. Split flow

Safeparts starts with bytes. Text, keys, tokens, files: the core handles them all as byte arrays.

With passphrase protection enabled, encryption happens first. Argon2id turns the passphrase into a key. ChaCha20-Poly1305 encrypts the secret.

Then Safeparts computes a BLAKE3 hash of the data and appends it as a 32-byte integrity tag.

The tagged data is split with Shamir-style secret sharing over `GF(256)`, one byte position at a time.

Each result is wrapped as a SharePacket. The packet carries the set ID, threshold, share count, share index, payload, and crypto parameters when encryption is used.

Finally, the packet is encoded into a format that fits the storage plan.

### 7. The maths

Shamir sharing rests on a simple fact: a degree `k-1` polynomial is determined by `k` points.

For `k=3`, one byte can be placed as the constant term of a quadratic:

`f(x) = byte + a1*x + a2*x²`

The random coefficients disguise the byte. The shares are evaluations of that polynomial at `x=1`, `x=2`, `x=3`, and so on.

Recovery uses Lagrange interpolation. Once enough points arrive, there is a single curve that fits them. Reading the value at `x=0` gives back the original byte.

Safeparts performs this arithmetic in `GF(256)`, a finite field with 256 values. That keeps the implementation byte-native. Share indices run from 1 to 255, while `x=0` is reserved for the reconstructed secret.

### 8. Combine flow

Combining starts by decoding the text back into share packets.

Safeparts checks that the packets belong together: same set, same threshold, same share count, unique share indices, matching crypto parameters.

Then it interpolates the payload and checks the BLAKE3 tag. Typos, corrupted shares, and mixed sets fail at this stage.

For encrypted splits, decryption happens after the share set passes those checks.

### 9. Encodings

Encodings are about storage and transcription.

`base64url` is compact and works well in password managers and text files.

`base58check` avoids some ambiguous characters and includes a checksum.

`mnemo-words` is easier to copy to paper or metal, with a CRC16 check to catch many transcription mistakes.

`mnemo-bip39` produces BIP-39-valid phrases for environments that already handle those word lists. In Safeparts, those phrases are share encodings.

The best encoding is the one your recovery plan can reliably store and re-enter.

### 10. Concrete plans

For personal recovery, `2 of 3` is a solid starting point: one reachable secure copy, one offline copy, and one off-site fallback.

For a small team, `3 of 5` can split authority across operations, security, an engineering lead, an executive sponsor, and an offline vault.

For family planning, the goal may be controlled recovery under specific conditions, with the work shared across the people involved.

In every case, write the runbook. Who holds each share? How do you contact them? When do you practice? What happens after a real recovery?

After break-glass recovery, assume the gathered shares may have been exposed. Rotate the original secret and split again.

### 11. Close

Safeparts turns one fragile recovery secret into a distributed recovery plan.

The simple version: split a secret, store shares separately, require cooperation to recover.

The technical version: Shamir-style sharing over `GF(256)`, BLAKE3 integrity, optional encrypt-before-split with Argon2id and ChaCha20-Poly1305, versioned packets, and reversible encodings.

The question becomes clearer:

Who should be able to recover this secret, and under what conditions?
