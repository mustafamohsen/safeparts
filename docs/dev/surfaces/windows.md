# Native Windows surface

The Windows surface currently proves C# interoperability with the real Rust library. It does not contain the end-user WinUI app or a downloadable package yet.

`crates/safeparts_uniffi/` exposes the same operation-shaped split, inspection, and recovery contract planned for the native app. `windows/Generated/` contains the tracked C# binding. The generator and UniFFI runtime use matching pinned versions, and generated bindings keep their contract and checksum checks enabled.

Regenerate or verify the binding from the repository root:

```bash
python3 windows/scripts/prepare.py
python3 windows/scripts/prepare.py --check
cargo test -p safeparts_uniffi
```

The preparation script builds a host dynamic library, installs the pinned C# generator under Cargo's target directory, and normalizes the generated file. It does not install a global tool.

Windows CI compiles the C# smoke executable and loads the real `safeparts_uniffi.dll`. The executable tests binary and passphrase-protected round trips through every concrete Share encoding, Auto recovery, metadata inspection, typed failures, repeated calls, and sanitized exception text. It prints only a generic result.

The existing native macOS app still uses `safeparts_swift` until the bridge migration ticket is implemented. Changes to this foundation trigger the existing macOS build, generated-binding drift check, tests, and package smoke so the expansion cannot silently regress Swift.
