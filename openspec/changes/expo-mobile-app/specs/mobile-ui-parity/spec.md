## ADDED Requirements

### Requirement: Split supports all share encodings
The mobile UI SHALL support generating shares using all encodings supported by Safeparts: base64 (base64url, no padding), base58check, mnemo-words, and mnemo-bip39.

#### Scenario: Split with each encoding
- **WHEN** the user selects each supported encoding and splits a secret
- **THEN** the UI produces n shares in the selected encoding

### Requirement: Combine supports all share encodings
The mobile UI SHALL support combining shares using base64 (base64url, no padding), base58check, mnemo-words, and mnemo-bip39.

#### Scenario: Combine with each encoding
- **WHEN** the user provides k valid shares in any supported encoding
- **THEN** the UI reconstructs the original secret

### Requirement: Combine supports encoding auto-detection
The mobile UI SHALL support encoding auto-detection when shares are pasted or scanned and the encoding is not explicitly selected.

#### Scenario: Auto-detect base58check
- **WHEN** the user inputs base58check shares without selecting an encoding
- **THEN** the app detects base58check and reconstructs successfully

#### Scenario: Auto-detect mnemo-bip39
- **WHEN** the user inputs mnemo-bip39 shares without selecting an encoding
- **THEN** the app detects mnemo-bip39 and reconstructs successfully

### Requirement: Passphrase protection is supported end-to-end
The mobile UI SHALL support encrypt-before-split via passphrase and SHALL require the correct passphrase to recover.

#### Scenario: Wrong passphrase fails recovery
- **WHEN** shares were generated with a passphrase
- **AND** the user attempts to combine with an incorrect passphrase
- **THEN** recovery fails with a clear, actionable error

#### Scenario: Correct passphrase succeeds recovery
- **WHEN** shares were generated with a passphrase
- **AND** the user combines with the correct passphrase
- **THEN** recovery succeeds and the recovered secret matches the original

### Requirement: Clipboard and platform sharing are supported
The mobile UI SHALL provide one-action copy and a platform share mechanism for shares and recovered secrets.

#### Scenario: Copy share
- **WHEN** the user activates Copy on a share
- **THEN** the system clipboard contains that share text

#### Scenario: Share recovered secret
- **WHEN** the user activates Share on the recovered secret
- **THEN** the platform share sheet opens with the recovered secret as the payload

### Requirement: Bilingual UI and bidi-safe token rendering
The mobile UI SHALL localize all user-facing strings (English + Arabic), support RTL/LTR UI direction, and render shares as left-to-right tokens even in Arabic UI.

#### Scenario: Arabic UI shows shares safely
- **WHEN** Arabic UI is active and a share is displayed
- **THEN** the share text is rendered left-to-right without reordering
