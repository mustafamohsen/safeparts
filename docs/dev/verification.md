# Verification

Use the smallest check that proves your change, then run the broader gate before a PR when practical.

## One-command checks

```bash
mise run doctor      # local environment diagnostics
mise run dx:verify   # docs, AGENTS, lockfile, and generated-artifact checks
mise run verify      # full local gate
```

## Rust

```bash
mise run fmt-check
mise run lint
mise run test
```

Direct commands:

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```

Targeted examples:

```bash
cargo test -p safeparts_core encoding::
cargo test -p safeparts --test e2e explicit_dash_paths_use_stdin_and_stdout
cargo test -p safeparts_tui app::tests
cargo test -p safeparts_wasm
cargo test -p safeparts_desktop --lib
cargo test -p safeparts_uniffi
```

## Web app

From `web/`:

```bash
bun install --frozen-lockfile
bun run build:wasm
bun run typecheck
bun run build
bun run test:e2e:smoke
```

Use local browser automation through the project browser skill or `browse` CLI for manual web smoke checks. Playwright remains the CI test runner and should not be the default manual browser tool unless a task asks for it.

## Help docs

From `web/help/`:

```bash
bun install --frozen-lockfile
bun run build
```

For route parity and accessibility coverage, run the web test suites from `web/`.

## Desktop app

From `desktop/`:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run build
bun run tauri:build -- --no-bundle
```

Use `mise run desktop:check` for the common local gate.

## Native macOS app

On macOS:

```bash
mise run macos:prepare
swift build --package-path macos
swift test --package-path macos
```

`mise run macos:check` runs these steps and then inspects the executable. It checks the macOS 14.0 deployment target and confirms that the Rust bridge is statically linked. The preparation script rejects deployment targets older than 14.0 and verifies that the compiled generated Swift binding matches the canonical copy.

Build and validate the universal release DMG with:

```bash
RELEASE_VERSION=v0.3.0 mise run macos:package
```

This checks both executable slices, bundle metadata and resources, static linkage, and the mounted DMG. The output is unsigned and unnotarized.

## Native Windows interoperability

On any Rust host, regenerate or verify the tracked C# binding:

```bash
python3 windows/scripts/prepare.py
python3 windows/scripts/prepare.py --check
cargo test -p safeparts_uniffi
```

The preparation script installs the exact C# generator revision under Cargo's target directory. C# compilation and DLL execution require Windows. The native Windows CI job builds the Rust DLL, checks generated-binding drift, compiles the .NET smoke executable, and runs binary, Share encoding, Auto encoding, inspection, Passphrase protection, typed-error, and repeated-call checks against the real DLL.

Run the UI-free application-model tests on any .NET 10 host:

```bash
dotnet test windows/Safeparts.AppModel.Tests/Safeparts.AppModel.Tests.csproj --configuration Release
python3 windows/scripts/verify-accessibility.py
```

Windows CI also builds the WinUI project for `win-x64`, launches the self-contained application with the real Rust DLL, and runs the generated-binding interoperability smoke. A FlaUI test drives synthetic Split and Recover workflows through keyboard input against the extracted x64 package and checks UI Automation names, control types, enabled states, and the recovered value. Each package-smoke artifact includes a generated SHA-256 sidecar. Complete the manual Narrator, Accessibility Insights, contrast, scaling, RTL, and IME checklist before a release.

## Release packaging

From the repo root:

```bash
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.3.0
RELEASE_VERSION=v0.3.0 mise run macos:package
```

Release CI owns Tauri installers for Linux and Windows, the unsigned universal native DMG for macOS, and unsigned self-contained native Windows preview archives for x64 and ARM64. The assembly job generates one checksum manifest after downloading every platform artifact. On `workflow_dispatch`, it uploads the complete result as a short-lived dry-run artifact instead of creating a GitHub Release.

## DX checks

`mise run dx:verify` checks:

- AGENTS child indexes point to real paths.
- `docs/dev/feature-matrix.md` has required surface columns.
- Required surface guides and developer manuals are present.
- Bun package lock policy is not mixed with npm lockfiles.
- Generated artifact policy catches common drift.
- Desktop/web copied UI files have visible parity status.

## When to skip a check

If you skip a relevant check, record why in the PR or final handoff. Good reasons include missing host dependencies, a check that is unrelated to the changed surface, or a command that is too expensive for the current task. Do not hide failures.
