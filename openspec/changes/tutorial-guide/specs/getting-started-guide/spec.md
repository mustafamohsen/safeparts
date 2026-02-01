## ADDED Requirements

### Requirement: Guide replaces use-cases.mdx

The getting-started.mdx guide SHALL replace the existing use-cases.mdx documentation as the primary user-facing tutorial for Safeparts.

#### Scenario: Guide is accessible from sidebar
- **WHEN** a user navigates to the help documentation
- **THEN** the sidebar SHALL link to getting-started.mdx instead of use-cases.mdx

#### Scenario: Guide is accessible from homepage
- **WHEN** a user visits the help documentation homepage
- **THEN** the homepage SHALL link to the getting-started guide

### Requirement: Bilingual content structure

The guide SHALL provide content in both English and Arabic using Starlight's `<Tabs>` component with labels "English" and "العربية".

#### Scenario: English content is visible by default
- **WHEN** a user opens the getting-started guide
- **THEN** the English content SHALL be visible by default

#### Scenario: Arabic content is visible when selected
- **WHEN** a user clicks the "العربية" tab
- **THEN** the Arabic content SHALL replace the English content while maintaining the same structure

#### Scenario: RTL layout for Arabic
- **WHEN** Arabic content is displayed
- **THEN** the layout SHALL respect right-to-left direction

### Requirement: Conceptual explanation section

The guide SHALL include a "Why Secret Sharing?" section that explains the problem with traditional backups using visual ASCII diagrams.

#### Scenario: Traditional backup diagram
- **WHEN** a user reads the "Why Secret Sharing?" section
- **THEN** they SHALL see a diagram comparing traditional backup (single copy) with k-of-n sharing

#### Scenario: Problem statement is clear
- **WHEN** a user reads the introduction
- **THEN** they SHALL understand that single copies create single points of failure and compromise

### Requirement: k-of-n mental model section

The guide SHALL include an explanation of the k-of-n concept using intuitive analogies and tables.

#### Scenario: Vault analogy
- **WHEN** a user reads the k-of-n section
- **THEN** they SHALL understand the concept through a bank vault with multiple keys analogy

#### Scenario: Configuration table
- **WHEN** a user reads the k-of-n section
- **THEN** they SHALL see a table showing k/n configurations with trade-offs

#### Scenario: Rule of thumb is provided
- **WHEN** a user reads the k-of-n section
- **THEN** they SHALL see the formula n = k + (number of backups you can afford to lose)

### Requirement: Tool selection guidance

The guide SHALL help users choose between Web UI, CLI, and TUI based on their use case and technical competency.

#### Scenario: Web UI is recommended for beginners
- **WHEN** a user is choosing a tool for one-time tasks
- **THEN** the guide SHALL recommend Web UI with benefits: no install, visual feedback, auto-detect

#### Scenario: CLI is recommended for automation
- **WHEN** a user needs scripting, CI/CD integration, or repeated operations
- **THEN** the guide SHALL recommend CLI with benefits: scriptable, pipe-friendly, fast

#### Scenario: TUI is recommended for power users
- **WHEN** a user prefers terminal but wants interactivity
- **THEN** the guide SHALL recommend TUI with benefits: keyboard-driven, interactive, air-gapped capable

### Requirement: Quick start section

The guide SHALL include a hands-on quick start section that takes approximately 5 minutes.

#### Scenario: Web UI quick start steps
- **WHEN** a user follows the Web UI quick start
- **THEN** they SHALL be able to split a secret with k=2, n=3 in 5 minutes or less

#### Scenario: CLI quick start example
- **WHEN** a user follows the CLI quick start
- **THEN** they SHALL see a command example: `echo -n "secret" | safeparts split -k 2 -n 3`

### Requirement: Multiple real-world examples

The guide SHALL provide at least 12 detailed examples spanning personal, family, team, and enterprise use cases.

#### Scenario: Personal examples are included
- **WHEN** a user reads the examples section
- **THEN** they SHALL see examples for:
  - Password manager recovery key
  - Cryptocurrency seed phrase backup
  - Digital legacy/estate planning

#### Scenario: Family examples are included
- **WHEN** a user reads the examples section
- **THEN** they SHALL see examples for:
  - Shared streaming account emergency access

#### Scenario: Technical individual examples are included
- **WHEN** a user reads the examples section
- **THEN** they SHALL see examples for:
  - Personal access tokens for CI/CD
  - Developer GitHub/GitLab tokens

#### Scenario: Team examples are included
- **WHEN** a user reads the examples section
- **THEN** they SHALL see examples for:
  - DevOps break-glass access
  - Small business shared service accounts
  - Agency client website access hand-off

#### Scenario: Enterprise examples are included
- **WHEN** a user reads the examples section
- **THEN** they SHALL see examples for:
  - Startup co-founder access
  - Enterprise credential rotation policy
  - Compliance separation of duties

#### Scenario: High-risk examples are included
- **WHEN** a user reads the examples section
- **THEN** they SHALL see examples for:
  - Journalist/activist source protection

#### Scenario: Each example includes configuration
- **WHEN** a user reads an example
- **THEN** they SHALL see specific k/n values and distribution strategy

#### Scenario: Each example includes tool recommendation
- **WHEN** a user reads an example
- **THEN** they SHALL see which tool (Web UI, CLI, TUI) is recommended

#### Scenario: Each example includes rationale
- **WHEN** a user reads an example
- **THEN** they SHALL understand why this configuration works for this scenario

### Requirement: Best practices section

The guide SHALL include a best practices section with DO and DON'T recommendations.

#### Scenario: Positive recommendations are clear
- **WHEN** a user reads the best practices
- **THEN** they SHALL see clear DO recommendations including:
  - Test recovery before needing it
  - Label shares by set and index
  - Document distribution plan
  - Use mnemonic words for humans
  - Consider passphrase encryption for high-value secrets

#### Scenario: Negative recommendations are clear
- **WHEN** a user reads the best practices
- **THEN** they SHALL see clear DON'T recommendations including:
  - Store all shares in one place
  - Use the same location for k shares
  - Send shares via email/chat
  - Use low k for high-value secrets
  - Use phone notes for shares

### Requirement: Common mistakes section

The guide SHALL include a common mistakes section with a table format showing mistake, problem, and fix.

#### Scenario: Memory-related mistake is covered
- **WHEN** a user reads the common mistakes
- **THEN** they SHALL see the "I'll remember where I put them" mistake with fix

#### Scenario: k=1 mistake is covered
- **WHEN** a user reads the common mistakes
- **THEN** they SHALL see the "k=1 is convenient" mistake with fix

#### Scenario: n=k mistake is covered
- **WHEN** a user reads the common mistakes
- **THEN** they SHALL see the "n=k means I need all shares" mistake with fix

### Requirement: Next steps section

The guide SHALL include a next steps section linking to other documentation.

#### Scenario: Link to Web UI guide
- **WHEN** a user reads the next steps
- **THEN** they SHALL see a link to the Web UI documentation

#### Scenario: Link to CLI guide
- **WHEN** a user reads the next steps
- **THEN** they SHALL see a link to the CLI documentation

#### Scenario: Link to encodings reference
- **WHEN** a user reads the next steps
- **THEN** they SHALL see a link to the encodings reference

### Requirement: ASCII diagrams for visuals

The guide SHALL use ASCII diagrams for visual explanations.

#### Scenario: Backup comparison diagram
- **WHEN** a user reads the guide
- **THEN** they SHALL see ASCII diagrams comparing traditional backup vs k-of-n

#### Scenario: k-of-n vault diagram
- **WHEN** a user reads the k-of-n section
- **THEN** they SHALL see an ASCII diagram of the vault with multiple keys

#### Scenario: Tool comparison tables
- **WHEN** a user reads the tool selection section
- **THEN** they SHALL see ASCII tables comparing Web UI, CLI, and TUI

### Requirement: Index page integration

The getting-started guide SHALL be linked from the main index page.

#### Scenario: Index links to guide
- **WHEN** a user visits the help homepage
- **THEN** they SHALL see a card linking to the getting-started guide

### Requirement: Sidebar integration

The sidebar SHALL be updated to point to getting-started instead of use-cases.

#### Scenario: Sidebar has correct link
- **WHEN** a user views the sidebar navigation
- **THEN** the "Start Here" section SHALL contain a link to getting-started.mdx

### Requirement: Arabic translation quality

The Arabic content SHALL be a complete translation of the English content with appropriate technical terminology.

#### Scenario: Technical terms are translated correctly
- **WHEN** a user switches to Arabic
- **THEN** they SHALL see consistent Arabic translations for terms like:
  - Secret sharing → مشاركة السر
  - k-of-n → k من n
  - Recovery → الاسترداد
  - Split → تقسيم
  - Combine → دمج
