# Safeparts Explainer Script v0.2

Working narration and scene map for `src/SafepartsExplainer.tsx`.

Target runtime: about 15 minutes at 30 fps.

## Direction

This should feel like a security diagram waking up, not a slide deck. Black glass, emerald light, quiet gridlines, and the Safeparts shield carry the look. The animation should do the explaining: one key turns into a constellation, shares unlock a threshold gate, curves snap into place, and packet formats wrap the same underlying data.

## Scene map

1. **The problem** — A single recovery key is useful, but it is also a single point of failure.
2. **Mental model** — `k-of-n`: create `n` shares, require `k` to recover. One share is not a slice of the password.
3. **Use cases** — Password-manager recovery, 2FA backup codes, break-glass credentials, family planning, and client handoff.
4. **Product shape** — Web/WASM, CLI, TUI, and the Rust core use the same split/combine engine.
5. **Threat model** — Safeparts does not store shares or fix a weak distribution plan.
6. **Split flow** — Bytes, optional encryption, BLAKE3 tag, Shamir split, SharePacket, text encoding.
7. **Underlying maths** — Shamir sharing over `GF(256)`: enough points reveal the curve; fewer points do not.
8. **Combine flow** — Decode packets, validate metadata, interpolate, check BLAKE3, then decrypt if needed.
9. **Encodings** — base64url, base58check, mnemo-words, and mnemo-bip39 are packaging choices for the same packet.
10. **Concrete plans** — Personal recovery, team break-glass, family planning, and the runbook that makes recovery possible.
11. **Close** — Safeparts turns one secret into a recovery procedure. The math supplies the threshold; people supply the discipline.

## Narration draft

### 1. The problem

Start with one recovery key.

Maybe it unlocks your password manager. Maybe it is the emergency credential for production infrastructure. Maybe it is the backup code you need when your phone is gone.

Now the awkward question: where do you put it?

On a laptop, the laptop becomes the weak point. In one safe, the safe becomes the weak point. With one trusted person, that person becomes the weak point.

Safeparts is for that exact problem. It takes one secret and turns it into several recovery shares. Later, you recover the original secret only when enough of those shares come together.

Not one share. Not necessarily every share. A threshold.

### 2. The mental model

The model is called `k-of-n`.

`n` is the number of shares you create. `k` is the number required to recover.

With `k=2, n=3`, any two shares can recover the secret. One share is useless on its own. If only one share survives, recovery is not merely difficult. It is impossible.

A share is not one third of the password. That is the wrong mental picture. Think of it as a point on a hidden curve. One point leaves too many possible curves. Enough points identify the one curve that matters.

### 3. Who it is for

Safeparts is useful when recovery should require cooperation instead of one perfect backup.

For individuals, that can mean password-manager recovery keys, 2FA backup codes, or emergency access that should not live in one place.

For families, it can help with executor planning: no single person holds the whole secret, but the right group can recover it when needed.

For teams, it fits API tokens, signing keys, secrets-manager master keys, and break-glass credentials.

The hard part is not choosing impressive numbers. The hard part is logistics. Who has which share? Where is it stored? What happens when someone is travelling, sick, or unreachable during an outage?

The cryptography gives you the threshold. The plan makes it usable.

### 4. Interfaces

Safeparts has several front ends over the same Rust core.

The web app runs locally in the browser through WebAssembly. The CLI is for scripts and runbooks. The TUI is an interactive terminal workflow, useful on offline machines or recovery laptops.

Different surfaces, same engine: split, combine, packets, encodings, and crypto.

### 5. What it does not do

Safeparts is not a password manager. It does not store shares. It does not choose holders. It does not protect you from someone who legitimately gets enough shares.

If the threshold is `3 of 5` and an attacker gets three valid shares, they can reconstruct the secret. That is the rule of the system.

So the security boundary is the distribution plan.

Do not keep two shares in the same cloud folder and call it separation. Do not paste real shares into chat, tickets, logs, screenshots, or issue trackers. Do not make a recovery process so clever that nobody can run it on a bad day.

Treat shares like the secret.

### 6. Split flow

Safeparts starts with bytes. Text, keys, tokens, files: to the core, they are all bytes.

If passphrase protection is enabled, Safeparts encrypts first. Argon2id turns the passphrase into a key. ChaCha20-Poly1305 encrypts the secret.

Then Safeparts computes a BLAKE3 hash of the data and appends it as a 32-byte integrity tag.

Now the tagged data is split with Shamir-style secret sharing over `GF(256)`, one byte position at a time.

Each result is wrapped as a SharePacket. The packet carries the set ID, threshold, share count, share index, payload, and crypto parameters if encryption was used.

Finally, the packet is encoded into a format that people or machines can store.

### 7. The maths

Shamir sharing rests on a simple fact: a degree `k-1` polynomial is determined by `k` points.

For `k=3`, one byte can be hidden as the constant term of a quadratic:

`f(x) = byte + a1*x + a2*x²`

The random coefficients hide the byte. The shares are evaluations of the polynomial at `x=1`, `x=2`, `x=3`, and so on.

Recovery uses Lagrange interpolation. Once enough points arrive, the curve is determined. Read the value at `x=0`, and you get the original byte.

Safeparts does this in `GF(256)`, a finite field with 256 values. That keeps the implementation byte-native. The trade-off is simple: share indices can run from 1 to 255, because `x=0` is reserved for reconstruction.

### 8. Combine flow

Combining starts by decoding the text back into share packets.

Safeparts checks that the packets belong together: same set, same threshold, same share count, unique share indices, matching crypto parameters.

Then it interpolates the payload and checks the BLAKE3 tag. A typo, corrupted share, or mixed set fails here.

If the data was encrypted, Safeparts decrypts after the share set passes those checks.

### 9. Encodings

Encodings do not change the secret sharing. They change how a share packet is written down.

`base64url` is compact and friendly to password managers and text files.

`base58check` avoids some ambiguous characters and includes a checksum.

`mnemo-words` is easier to copy to paper or metal, with a CRC16 check to catch many transcription mistakes.

`mnemo-bip39` produces BIP-39-valid phrases, but those phrases are Safeparts shares. They are not wallet seeds.

The best encoding is the one your recovery plan can reliably store and re-enter.

### 10. Concrete plans

For personal recovery, `2 of 3` is a solid starting point: one reachable secure copy, one offline copy, and one off-site fallback.

For a small team, `3 of 5` can split authority across operations, security, an engineering lead, an executive sponsor, and an offline vault.

For family planning, the goal may be controlled recovery under specific conditions. Not one person holding everything forever.

In every case, write the runbook. Who holds each share? How do you contact them? When do you practice? What happens after a real recovery?

After break-glass recovery, assume the gathered shares may have been exposed. Rotate the original secret and split again.

### 11. Close

Safeparts turns one fragile recovery secret into a distributed recovery plan.

At the simple level: split a secret, store shares separately, require cooperation to recover.

At the technical level: Shamir-style sharing over `GF(256)`, BLAKE3 integrity, optional encrypt-before-split with Argon2id and ChaCha20-Poly1305, versioned packets, and reversible encodings.

The final question is not only “where should I hide this?”

It is: who should be able to recover this secret, and under what conditions?
