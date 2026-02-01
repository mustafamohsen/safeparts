## ADDED Requirements

### Requirement: Replace use-cases page with Getting Started guide
The docs site SHALL replace the existing `use-cases` page with a tutorial-style Getting Started guide as the primary use-case oriented entry point.

#### Scenario: Navigation points to new guide
- **WHEN** a user browses the docs navigation
- **THEN** the Start Here section SHALL link to `getting-started` instead of `use-cases`

### Requirement: Bilingual parity (English and Arabic)
The Getting Started guide SHALL be available in English and Arabic, and the two versions SHALL cover the same concepts, sections, and examples.

#### Scenario: Arabic guide mirrors English guide
- **WHEN** a user switches from English to Arabic
- **THEN** they can find the equivalent section content and examples in Arabic

### Requirement: Value-first introduction
The guide SHALL open with a value-first explanation of why k-of-n secret sharing is useful (reducing single points of failure and compromise).

#### Scenario: Reader understands the motivation
- **WHEN** a user reads the introduction
- **THEN** they understand what failure/compromise risks Safeparts reduces

### Requirement: Tool selection guidance
The guide SHALL provide clear decision guidance for when to use the Web UI, CLI, or TUI based on the user's technical comfort and the use case.

#### Scenario: Beginner is routed to Web UI
- **WHEN** a user is doing a one-off task and prefers not to install tools
- **THEN** the guide points them to the Web UI guide

#### Scenario: Technical user is routed to CLI
- **WHEN** a user needs repeatability or automation
- **THEN** the guide points them to the CLI guide

### Requirement: Not Web-UI-exclusive
The guide SHALL NOT assume the Web UI is the only interface; examples SHALL reference Web UI and native tooling (CLI/TUI) as appropriate.

#### Scenario: Example recommends the best interface
- **WHEN** a user reads any example
- **THEN** the example indicates which interface is recommended and why

### Requirement: Real-world examples (breadth)
The guide SHALL include many practical examples spanning individuals and organizations.

#### Scenario: Examples cover individuals and teams
- **WHEN** a user reads the examples section
- **THEN** they find examples for personal/family recovery and for team/enterprise operations

### Requirement: Real-world examples (minimum count)
The guide SHALL include at least 12 examples.

#### Scenario: Example count meets minimum
- **WHEN** a user scans the examples section
- **THEN** there are 12 or more distinct example scenarios

### Requirement: Safe documentation handling
The guide SHALL warn users not to paste real shares/secrets into chat, tickets, or logs, and SHALL avoid including real-looking share material.

#### Scenario: Guide includes safety warning
- **WHEN** a user reads the guide
- **THEN** they see explicit guidance to use synthetic examples for debugging and documentation

### Requirement: Link-out to detailed interface docs
The guide SHALL link to dedicated pages for Web UI, CLI, and TUI for step-by-step instructions.

#### Scenario: User can go deeper per interface
- **WHEN** a user wants to execute a workflow
- **THEN** the guide provides links to Web UI / CLI / TUI pages
