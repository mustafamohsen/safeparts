# Troubleshooting

## `mise run doctor` reports missing tools

Run:

```bash
mise install
mise run setup
```

If you do not use mise, install the versions listed in [`mise.toml`](../../mise.toml).

## WASM build cannot find `wasm-pack`

From `web/`:

```bash
bun run build:wasm
```

The build script installs the pinned `wasm-pack` and `wasm-bindgen` versions when needed. If that fails, check that Rust is installed and `~/.cargo/bin` is on `PATH`.

## Web app loads but split/combine does not work

Regenerate the WASM package:

```bash
cd web
bun run build:wasm
bun run dev
```

`web/src/wasm_pkg/` is generated and ignored by git, so a fresh clone needs this step before the browser UI can call the Rust bindings.

## Desktop build fails on Linux

Tauri needs WebKit and appindicator development packages. See the Linux dependency list in `.github/workflows/rust-ci.yml` and `.github/workflows/release.yml`.

## `dx:verify` reports a stale AGENTS child path

Open the nearest parent `AGENTS.md` and fix its Child DOX Index. Either create the missing child path, correct the path, or remove a stale entry.

## `dx:verify` reports package-manager ambiguity

Use Bun for web, docs, and desktop. Remove accidental npm, pnpm, or yarn lockfiles unless the project intentionally changes package managers.

## Desktop/web parity check reports drift

Read the diff in the check output. If the web UI changed, update the copied desktop UI files or document why desktop intentionally differs. Adapter files such as `desktop/src/wasm.ts` are allowed to differ.

## A check is too expensive locally

Run the targeted check for the surface you changed and record the skipped check with a reason in your PR or handoff. Do not mark a failing check as skipped.
