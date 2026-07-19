# Native Windows surface

The `windows/` solution owns the native WinUI 3 app for supported Windows 11 releases. It mirrors the native macOS Split and Recover workbench with Windows controls, file pickers, clipboard APIs, keyboard accelerators, UI Automation semantics, themes, and scaling behavior.

`Safeparts.AppModel` keeps workbench state independent of WinUI. It owns generation guards, stable Recovery-share identities, metadata-driven readiness, binary/text presentation, safe messages, and Windows filename policy. `Safeparts.Native` adapts the generated C# UniFFI API and runs every Rust call on a worker task. Cryptography, Share packets, Share encodings, Auto encoding, integrity, and Passphrase protection remain in `safeparts_core`.

Regenerate or verify bindings from the repository root:

```bash
mise run windows:prepare
mise run windows:binding-check
python3 windows/scripts/verify-accessibility.py
```

With .NET 10 installed, the UI-free tests run on any host:

```bash
dotnet test windows/Safeparts.AppModel.Tests/Safeparts.AppModel.Tests.csproj --configuration Release
```

Windows CI builds the WinUI project for an explicit x64 RID, launches the self-contained app with the real Rust DLL, and runs the full interoperability smoke. The smoke covers text and binary Secrets, every concrete Share encoding, Auto recovery, metadata inspection, typed failures, Passphrase protection, repeated calls, and generated contract checks. A keyboard-driven FlaUI test completes Split and Recover against the extracted x64 package and verifies UI Automation semantics.

Before release, complete `windows/docs/accessibility-release-checklist.md` with Narrator and Accessibility Insights. CI source checks do not replace manual Narrator, contrast, scaling, RTL, or IME review.

Release CI publishes separate unsigned self-contained preview archives for Windows 11 x64 and ARM64 beside the established Tauri Windows installers. The package validator checks the staged and extracted archives for architecture, native bridge placement, .NET and Windows App SDK runtime files, resources, version, debug files, and the expected unsigned state. Tauri remains the canonical Windows download until maintainers record preview acceptance and approve the cutover.
