# Release packaging

Owners: `scripts/release/`, `.github/workflows/release.yml`
Nearest contracts: [`scripts/AGENTS.md`](../../../scripts/AGENTS.md), root [`AGENTS.md`](../../../AGENTS.md)

## What belongs here

Release tooling builds and packages:

- `safeparts` CLI archives
- `safeparts-tui` archives
- desktop bundles from the release workflow
- checksum files

The web UI is built and deployed as static web output, not as a release archive.

## Change rules

- Keep packaging deterministic and explicit about inputs and outputs.
- Do not embed secrets in scripts, archives, or logs.
- Keep artifact naming stable unless a release task changes it deliberately.
- Update local commands and CI workflow notes together.

## Useful checks

```bash
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.1.0
```

For desktop bundles, release CI is the source of truth. Local host builds can still catch configuration errors.

## When release changes

Update:

- `scripts/release/README.md`
- [`docs/dev/verification.md`](../verification.md)
- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- `.github/workflows/release.yml` when CI behavior changes
