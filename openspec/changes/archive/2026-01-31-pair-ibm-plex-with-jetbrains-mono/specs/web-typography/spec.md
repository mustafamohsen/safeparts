## ADDED Requirements

### Requirement: English UI uses IBM Plex Sans as the default font
The system SHALL render English/Latin UI text using IBM Plex Sans as the primary font family.

#### Scenario: English document language
- **WHEN** the document language is English/Latin (e.g. `lang="en"`)
- **THEN** the default font family for body/prose/UI chrome is IBM Plex Sans

### Requirement: Arabic UI continues to use IBM Plex Sans Arabic
The system SHALL render Arabic UI text using IBM Plex Sans Arabic as the primary font family.

#### Scenario: Arabic document language
- **WHEN** the document language is Arabic (e.g. `lang="ar"`)
- **THEN** the default font family switches to IBM Plex Sans Arabic

### Requirement: Code-like content uses JetBrains Mono
The system SHALL render code-like content (including encoded shares and revealed secrets) using JetBrains Mono as the monospace font.

#### Scenario: Rendering mono surfaces
- **WHEN** a UI element is designated as monospace/code-like (e.g. via a mono style/class)
- **THEN** its font family is JetBrains Mono (with reasonable monospace fallbacks)

### Requirement: Web app and help docs use the same typography system
The system SHALL apply the same English/Arabic/monospace font assignments across the main web app and the Astro/Starlight help docs.

#### Scenario: Consistent typography across builds
- **WHEN** a user visits the main web app
- **THEN** the English/Arabic/monospace fonts match the defined typography system
- **AND** **WHEN** a user visits the help docs site
- **THEN** the English/Arabic/monospace fonts match the same typography system
