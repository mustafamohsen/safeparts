## ADDED Requirements

### Requirement: Docs voice is practical and non-promotional
The help docs SHALL use a direct, instruction-first tone and SHALL avoid marketing language.

#### Scenario: Editorial review
- **WHEN** a maintainer reviews any updated docs page
- **THEN** the page reads as operational guidance (what to do, why it matters)
- **AND** it avoids hype, filler, or generic motivational framing

### Requirement: Core docs topics are covered with a clear information architecture
The help docs SHALL cover the main user journeys and reference topics required to use Safeparts safely.

#### Scenario: Required pages exist
- **WHEN** the docs are built
- **THEN** the docs include pages that cover installation/build, getting started, use cases, security guidance, encodings, CLI usage, TUI usage, web UI usage, and an explanation of how Safeparts works

### Requirement: English and Arabic docs stay in sync
The docs site SHALL maintain bilingual parity between English and Arabic content.

#### Scenario: Route parity
- **WHEN** the docs route set is enumerated in CI
- **THEN** every English route under `/help/` has a corresponding Arabic route under `/help/ar/`
- **AND** there are no Arabic routes without an English counterpart

### Requirement: Starlight components are used purposefully
Docs pages SHALL prefer Starlight components when they improve navigation, procedures, or choice clarity.

#### Scenario: Procedures use Steps
- **WHEN** a page contains a multi-step procedure intended to be followed linearly
- **THEN** the procedure is presented using `<Steps>`
- **AND** long procedural sequences are not presented as generic Markdown lists

### Requirement: Inline tokens match intent (not everything is code)
Docs SHALL reserve inline code styling for actual code/terminal content and SHALL use semantic tokens for variables, keys, and UI/status strings.

#### Scenario: Semantic tokens
- **WHEN** the docs refer to variables like k and n
- **THEN** they use `<var>`
- **AND** **WHEN** the docs refer to keyboard shortcuts
- **THEN** they use `<kbd>`
- **AND** **WHEN** the docs refer to UI/status strings
- **THEN** they use `<samp>`
