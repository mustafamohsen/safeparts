## ADDED Requirements

### Requirement: English Typeface
The system SHALL render English (Latin) UI text using JetBrains Mono as the primary font family across the main web app and help docs.

#### Scenario: English UI renders with JetBrains Mono
- **WHEN** a user visits the web app or help docs in an English locale
- **THEN** the computed `font-family` for body text includes JetBrains Mono as the first choice

### Requirement: Arabic Typeface
The system SHALL render Arabic UI text using IBM Plex Sans Arabic as the primary font family.

#### Scenario: Arabic UI renders with IBM Plex Sans Arabic
- **WHEN** a user visits the web app or help docs in an Arabic locale
- **THEN** the computed `font-family` for body text includes IBM Plex Sans Arabic as the first choice
