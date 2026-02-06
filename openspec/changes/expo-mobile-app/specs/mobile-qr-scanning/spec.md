## ADDED Requirements

### Requirement: Shares can be exported as QR codes
The mobile app SHALL render a QR code representation for each generated share.

#### Scenario: Split outputs QR
- **WHEN** the user splits a secret and shares are displayed
- **THEN** the user can view a QR code for each share

### Requirement: Camera QR scanning imports shares
The mobile app SHALL allow importing shares via camera QR scanning into the Combine workflow.

#### Scenario: Scan QR to add share
- **WHEN** the user scans a valid share QR code
- **THEN** the share is added to the Combine input list

### Requirement: Multi-scan recovery flow is efficient
The QR scanner flow SHALL support scanning multiple shares in sequence without forcing the user to reopen the camera each time.

#### Scenario: Scan three shares in a row
- **WHEN** the user scans multiple share QR codes sequentially
- **THEN** each share is appended and the scanner remains available until the user exits

### Requirement: Duplicate scans do not create duplicate inputs
The app SHALL avoid adding the same share multiple times when scanned repeatedly.

#### Scenario: Duplicate scan
- **WHEN** the user scans the same share twice
- **THEN** the share list contains only one copy of that share

### Requirement: Oversized shares have a fallback path
If a share cannot be represented as a practical QR payload, the app SHALL provide a clear fallback (copy/share-sheet/file import) rather than silently failing.

#### Scenario: QR too large
- **WHEN** a share exceeds the app's QR payload limit
- **THEN** the app indicates QR export is unavailable for that share
- **AND** provides an alternative transfer mechanism
