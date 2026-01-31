## ADDED Requirements

### Requirement: README provides download and install instructions per OS
The repository README SHALL document how to download and install released binaries on macOS, Linux, and Windows.

#### Scenario: macOS instructions
- **WHEN** a user reads the README on macOS
- **THEN** they can follow a documented path to download a release binary and install it on their system

#### Scenario: Linux instructions
- **WHEN** a user reads the README on Linux
- **THEN** they can follow a documented path to download a release binary and install it on their system

#### Scenario: Windows instructions
- **WHEN** a user reads the README on Windows
- **THEN** they can follow a documented path to download a release binary and run it (or add it to PATH)

### Requirement: Help docs include download and install instructions per OS
The Astro/Starlight help docs site SHALL include a page (or section) describing download options and OS-specific installation steps.

#### Scenario: Docs installation page
- **WHEN** a user visits the help docs
- **THEN** they can find download and installation instructions for macOS, Linux, and Windows

### Requirement: Documentation includes verification steps
Documentation SHALL include a basic verification step after installation.

#### Scenario: Verify install
- **WHEN** a user installs `safeparts`
- **THEN** they can run a documented command (e.g., `safeparts --help` or `safeparts --version`) to confirm it works

### Requirement: Documentation distinguishes CLI vs TUI binaries
Documentation SHALL explain the difference between the CLI and TUI binaries and how to run each.

#### Scenario: Running the TUI
- **WHEN** a user wants the terminal UI
- **THEN** documentation shows how to launch `safeparts-tui`
