## ADDED Requirements

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
