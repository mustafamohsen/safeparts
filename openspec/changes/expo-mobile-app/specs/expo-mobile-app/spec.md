## ADDED Requirements

### Requirement: Mobile app supports iOS and Android
The Safeparts mobile app SHALL support iOS and Android as first-class platforms.

#### Scenario: Install and launch on iOS
- **WHEN** a user installs the iOS app
- **THEN** they can launch it and access Split and Combine workflows

#### Scenario: Install and launch on Android
- **WHEN** a user installs the Android app
- **THEN** they can launch it and access Split and Combine workflows

### Requirement: Offline-first operation
The mobile app SHALL allow users to split and combine secrets without requiring network access after installation.

#### Scenario: Split and combine while offline
- **WHEN** the device has no network connectivity
- **THEN** splitting a secret into shares succeeds
- **AND** combining valid shares succeeds

### Requirement: No network transmission of secret material
The mobile app SHALL NOT transmit secrets, shares, passphrases, or recovered outputs over the network.

#### Scenario: No outbound requests during operations
- **WHEN** a user performs split and combine operations
- **THEN** the app makes no outbound network requests related to those operations

### Requirement: No secret persistence without explicit user action
The mobile app SHALL NOT persist secrets, shares, or passphrases to disk or durable app storage unless the user explicitly exports or saves them.

#### Scenario: Restart does not restore secret fields
- **WHEN** a user enters a secret and generates shares
- **AND** closes and reopens the app
- **THEN** secret, share, and passphrase fields are empty by default
