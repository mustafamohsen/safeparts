## ADDED Requirements

### Requirement: Split and combine call safeparts_core locally
The mobile app SHALL perform split and combine operations by calling `safeparts_core` locally on the device.

#### Scenario: Split uses local core
- **WHEN** the user splits a secret
- **THEN** the operation completes without calling any remote service

#### Scenario: Combine uses local core
- **WHEN** the user combines shares
- **THEN** the operation completes without calling any remote service

### Requirement: Bridge API supports required operations
The mobile bridge layer SHALL expose a minimal API to the UI that supports split, combine, supported encodings, and app/core version reporting.

#### Scenario: UI queries supported encodings
- **WHEN** the UI requests supported encodings
- **THEN** the bridge returns the full set of encodings supported by the app

### Requirement: Sensitive inputs are not logged
The bridge layer SHALL NOT log secrets, shares, passphrases, or recovered outputs.

#### Scenario: Operation failure
- **WHEN** an operation fails
- **THEN** error reporting does not include secret/share/passphrase contents

### Requirement: Errors are mapped to actionable messages
The bridge layer SHALL map core errors into UI-safe, actionable error messages.

#### Scenario: Not enough shares
- **WHEN** the user attempts to combine with fewer than k shares
- **THEN** the UI receives an error message that indicates how many shares are required and how many were provided

#### Scenario: Passphrase required
- **WHEN** shares were created with a passphrase and the user attempts to combine without one
- **THEN** the UI receives an error that clearly indicates a passphrase is required
