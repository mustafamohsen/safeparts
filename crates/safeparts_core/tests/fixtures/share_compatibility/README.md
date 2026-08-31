# Released Share packet compatibility fixtures

This corpus protects Safeparts Recovery shares from accidental decoding regressions. Every value is synthetic. None came from a real Secret or passphrase.

The fixture text is immutable evidence, not test setup. Tests decode it through the public Share encoding API, inspect the resulting Share packet metadata, and recover exact byte literals through `combine_shares`. They never call the split or encode paths to create expected values.

## Provenance

| Fixture set | Source | Contents |
| --- | --- | --- |
| `v1-unprotected/` | Historical V1 encoder at commit `bf999cf76949945117aaf346e73f17e4ddbd4333`; V1 decoding shipped in Safeparts `v0.1.0` | One synthetic 2-of-3 Recovery share set in every released concrete Share encoding |
| `v2-unprotected/` | Safeparts `v0.3.0` at commit `93162de020cf5a726cde31b00f117b491b525993` | One synthetic 2-of-3 Recovery share set in every released concrete Share encoding |
| `v2-passphrase-protected/` | Safeparts `v0.3.0` at commit `93162de020cf5a726cde31b00f117b491b525993` | One synthetic Passphrase-protected 2-of-3 Recovery share set in every released concrete Share encoding |

The V1 files were emitted by the last historical encoder commit that supported all four Share encodings before V2 became the write version. The V2 files were emitted from the tagged release source. Random set IDs and crypto parameters were captured once and are now expected metadata in `share_compatibility.rs`.

`SHA256SUMS` records the initial text exactly. Run this from the fixture directory to check it:

```bash
shasum -a 256 -c SHA256SUMS
```

## Adding a released version

Do not regenerate, reformat, or replace an existing fixture or its expected values. If a released decoder must change, make an explicit migration decision before touching this corpus.

For a new released Share packet version:

1. Start from the tagged release source in an isolated worktree.
2. Choose new, clearly synthetic Secret bytes and, when supported, a synthetic passphrase.
3. Capture unprotected and Passphrase-protected 2-of-3 sets as applicable. Encode the same set with every released concrete Share encoding.
4. Add a new directory instead of editing an old one. Record the release tag, commit, packet version, and generation procedure here.
5. Add independent literal expectations for the set ID, Threshold, Share count, share indexes, crypto parameters, packet length, passphrase, and reconstructed bytes.
6. Run the focused compatibility test, the core security-property test, and the full Rust gate. Review the fixture diff and update `SHA256SUMS` only for new files.

A reviewer should confirm that the source tag is released, all fixture input is synthetic, every concrete Share encoding is present, and the test reaches public decode and combine APIs without using the encoder under test.
