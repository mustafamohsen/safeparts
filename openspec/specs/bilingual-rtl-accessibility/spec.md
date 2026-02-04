## ADDED Requirements

### Requirement: Correct language and direction metadata
The web app and docs SHALL set correct language and direction metadata for English and Arabic.

#### Scenario: Web app language toggle
- **WHEN** the user selects English
- **THEN** the document language is `en` and direction is `ltr`
- **AND** **WHEN** the user selects Arabic
- **THEN** the document language is `ar` and direction is `rtl`

#### Scenario: Docs locale routing
- **WHEN** the user visits the Arabic docs locale
- **THEN** the document language is `ar` and direction is `rtl`

### Requirement: Mixed-direction content is rendered safely
The UI SHALL prevent bidirectional text rendering issues for mixed Arabic/Latin content (e.g. shares, hashes, base64url, mnemonics).

#### Scenario: Shares displayed in Arabic UI
- **WHEN** Arabic UI is active and a share is displayed
- **THEN** the share content is rendered left-to-right without reordering
- **AND** surrounding RTL text does not change the share’s character order

#### Scenario: Recovered secret direction
- **WHEN** the recovered secret contains Arabic and/or Latin content
- **THEN** its direction is determined appropriately (e.g. `dir="auto"`) so it reads correctly

### Requirement: Localization covers all user-facing strings
All user-facing UI strings SHALL be localized for English and Arabic.

#### Scenario: No untranslated UI chrome
- **WHEN** Arabic UI is active
- **THEN** primary navigation, form labels, hints, errors, and action labels are Arabic (except deliberate brand names)

### Requirement: Docs locale routing stays within locale
The docs site SHALL keep navigation and cross-links within the active locale.

#### Scenario: Arabic docs link safety
- **WHEN** a user navigates within the Arabic docs locale
- **THEN** internal links resolve under `/help/ar/`
- **AND** the Arabic index page does not link to English routes under `/help/`

### Requirement: Mixed-direction tokens are safe in Arabic docs
Arabic docs SHALL render shares, hashes, encodings, paths, and other code-like tokens left-to-right to avoid bidi reordering.

#### Scenario: LTR tokens inside RTL prose
- **WHEN** an Arabic docs page contains a share, hash, encoding name, or filesystem/URL path
- **THEN** that token is rendered with left-to-right direction (e.g., `dir="ltr"` or an equivalent safe wrapper)
- **AND** surrounding RTL prose does not change the token’s character order
