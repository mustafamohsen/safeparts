# AGENTS.md — Native Windows

## Purpose

Owns the generated C# UniFFI binding and the executable interoperability check for the planned native Windows app.

## Ownership

- `Generated/`: canonical generated C# binding for the platform-neutral Rust bridge.
- `Safeparts.InteropSmoke/`: minimal C# executable that exercises the real Windows Rust DLL.
- `scripts/`: reproducible binding preparation and drift checks.
- `global.json`: minimum .NET SDK used by the C# interoperability check.

## Local Contracts

- Keep cryptography, Share packet handling, Share encoding, inspection, and Passphrase protection in Rust.
- Do not log a Secret, Recovery share, reconstructed bytes, or passphrase.
- Do not hand-edit generated C# output.
- Pin the C# generator and its compatible UniFFI runtime to exact revisions.
- The smoke executable must load the real architecture-matched Rust DLL and keep contract and checksum verification enabled.
- Do not describe this interoperability foundation as a supported Windows UI or release package.

## Work Guidance

- Run the preparation script after changing the platform-neutral bridge or generator configuration.
- Keep synthetic smoke values inside the process and print only generic pass/fail output.
- Windows CI is the source of truth for C# compilation and DLL execution.

## Verification

- `python3 windows/scripts/prepare.py --check`
- `cargo test -p safeparts_uniffi`
- On Windows: `dotnet run --project windows/Safeparts.InteropSmoke/Safeparts.InteropSmoke.csproj --configuration Release`

## Child DOX Index

- No child AGENTS.md files.
