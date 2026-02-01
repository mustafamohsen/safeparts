## ADDED Requirements

### Requirement: Local release build for host platform
The project SHALL provide a documented local command to build release binaries for the current host OS.

#### Scenario: Build on macOS
- **WHEN** a developer runs the documented release build command on macOS
- **THEN** a `safeparts` binary is produced in release mode
- **AND** a `safeparts-tui` binary is produced in release mode

#### Scenario: Build on Linux
- **WHEN** a developer runs the documented release build command on Linux
- **THEN** a `safeparts` binary is produced in release mode
- **AND** a `safeparts-tui` binary is produced in release mode

#### Scenario: Build on Windows
- **WHEN** a developer runs the documented release build command on Windows
- **THEN** `safeparts.exe` and `safeparts-tui.exe` are produced in release mode

### Requirement: Local release build uses Rust stable
Local release builds SHALL use the Rust stable toolchain.

#### Scenario: Stable toolchain
- **WHEN** the release build command is executed
- **THEN** it uses Rust stable (not nightly)

### Requirement: Local release build runs Rust tests
Local release build tasks SHALL run Rust tests (or provide an explicit combined task) so maintainers can validate release readiness.

#### Scenario: Pre-release verification
- **WHEN** a maintainer runs the documented release verification task
- **THEN** `cargo test --all-features` succeeds before binaries are considered release-ready

### Requirement: Release build tasks do not require the web toolchain
Local release build tasks SHALL not require Bun, Node, or any web UI build steps.

#### Scenario: Rust-only release build
- **WHEN** running the release build command
- **THEN** it does not invoke the web build or wasm build steps
