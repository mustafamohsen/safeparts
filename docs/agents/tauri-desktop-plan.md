# Superseded Tauri Desktop Plan

This earlier standalone desktop-workbench plan is superseded by `docs/agents/tauri-desktop-webui-parity-plan.md`.

Current direction: `desktop/` should be a locally runnable Tauri version of the existing `web/` UI, with the same interface and exposed feature set as the browser app. Do not reintroduce desktop-only UI features such as file split/combine, save/download flows, inspection metadata panels, `base58check`, or `mnemo-bip39` unless the web UI exposes them first.
