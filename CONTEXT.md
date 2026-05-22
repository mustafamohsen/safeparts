# Safeparts Context

This context names the Safeparts domain: splitting arbitrary secrets into threshold recovery shares, representing shares as share packets, and encoding those packets for people and front ends.

## Language

**Secret**:
Arbitrary bytes a user wants to protect with threshold recovery. A secret may be encrypted before it is split.
_Avoid_: payload, plaintext when discussing the user-facing concept.

**Recovery share**:
One of the `n` pieces produced from a secret; any `k` recovery shares from the same set can reconstruct the secret. Recovery shares are sensitive and should be stored separately.
_Avoid_: fragment, shard, part.

**Threshold**:
The `k` value: the number of recovery shares required to reconstruct a secret.
_Avoid_: quorum when referring specifically to the numeric split parameter.

**Share count**:
The `n` value: the number of recovery shares produced for a split.
_Avoid_: total, parts when referring specifically to the numeric split parameter.

**Share packet**:
The binary representation of one recovery share plus metadata such as set ID, threshold, share count, share index, payload, and optional crypto parameters. A share packet is the thing text encodings represent reversibly.
_Avoid_: encoded share when referring to the binary representation.

**Share encoding**:
A reversible text representation of a share packet, such as `base64url`, `base58check`, `mnemo-words`, or `mnemo-bip39`. Share encoding includes the rules for turning pasted share text back into share packets; `base64url` and `base58check` are the canonical names, while `base64` and `base58` are CLI aliases.
_Avoid_: format when the distinction from the binary share packet matters.

**Auto encoding**:
A front-end input mode whose rules are owned by the core share encoding module: inspect pasted share text, choose a concrete share encoding, and return the detected encoding with the decoded share packets.
_Avoid_: guessing when referring to the supported detection behavior.

**Passphrase protection**:
Optional encryption applied before splitting a secret, using Argon2id-derived keys and ChaCha20-Poly1305. Passphrase protection changes the share packets by adding crypto parameters.
_Avoid_: password mode.

## Example dialogue

Dev: "The CLI received three pasted recovery shares with no share encoding flag."

Domain expert: "Use Auto encoding. The core share encoding module should detect the concrete share encoding and decode the share packets."

Dev: "After decoding, combine checks that the recovery shares have the same set ID and threshold."

Domain expert: "Right. If at least the threshold number of recovery shares are present, Safeparts reconstructs the secret. If passphrase protection was used, it decrypts after the integrity check."
