# AGENTS.md — Native Windows

## Purpose

Owns the native WinUI 3 Windows 11 app, its UI-free model, generated C# UniFFI binding, tests, and Windows validation scripts.

## Ownership

- `Safeparts.App/`: WinUI views, Windows file and clipboard integration, resources, and application metadata.
- `Safeparts.AppModel/`: platform-independent workbench state, stable Recovery-share fields, filename policy, and service contracts.
- `Safeparts.Native/`: managed adapter over the generated UniFFI binding.
- `Safeparts.AppModel.Tests/`: UI-free behavioral tests.
- `Safeparts.UiAutomation.Tests/`: keyboard-driven UI Automation workflow and semantics tests against the packaged app.
- `Safeparts.InteropSmoke/`: real native-library contract and repeated-call smoke executable.
- `Generated/`: canonical generated C# binding for the platform-neutral Rust bridge.
- `scripts/`: reproducible binding, accessibility, launch, and later package checks.
- `docs/`: manual Windows release checklists.

## Local Contracts

- Keep cryptography, Share packet handling, Share encoding, inspection, and Passphrase protection in Rust.
- Never log or persist a Secret, Recovery share, reconstructed bytes, or passphrase.
- Do not hand-edit generated C# output.
- Run native calls away from the UI thread and use generation identities so late work cannot restore cleared state.
- Give every Recovery-share editor a stable `Guid`; stale identifiers must be inert.
- Use exact byte IO for imported and reconstructed files and explicit clipboard actions.
- Prefer standard WinUI controls, theme resources, keyboard access, and UI Automation semantics.
- Pin the C# generator, compatible UniFFI runtime, .NET SDK, Windows SDK tools, and Windows App SDK.
- The app targets supported Windows 11 releases and x64/ARM64. Do not package AnyCPU with one native DLL.
- Self-contained archives must include the generated `Safeparts.pri` and its `resources.pri` alias for unpackaged Windows App SDK 1.8 resource loading.

## Work Guidance

- Run the preparation script after changing bridge metadata or generator configuration.
- Keep synthetic tests inside the process and print only generic pass/fail output.
- Keep the model free of WinUI and WinRT references so it can be tested on any .NET host.
- Windows CI is the source of truth for XAML compilation, app launch, and Windows DLL execution.

## Verification

- `python3 windows/scripts/prepare.py --check`
- `python3 windows/scripts/verify-accessibility.py`
- `cargo test -p safeparts_uniffi`
- `dotnet test windows/Safeparts.AppModel.Tests/Safeparts.AppModel.Tests.csproj --configuration Release`
- On Windows: build `windows/Safeparts.App/Safeparts.App.csproj` for an explicit platform/RID and run the launch plus interoperability smoke scripts.
- On Windows: run `python windows/scripts/package-release.py 0.3.0 <x64|arm64>`; package validation rejects missing application PRI files, architecture mismatches, and incomplete self-contained runtimes.
- On Windows x64: set `SAFEPARTS_APP_EXE` to the extracted packaged executable and run `dotnet test windows/Safeparts.UiAutomation.Tests/Safeparts.UiAutomation.Tests.csproj --configuration Release`.

## Child DOX Index

- No child AGENTS.md files.
