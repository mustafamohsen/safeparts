## ADDED Requirements

### Requirement: WCAG 2.2 AA conformance for the docs site
The Safeparts help site (Astro/Starlight) SHALL meet WCAG 2.2 Level AA requirements for keyboard and screen reader accessibility.

#### Scenario: Automated accessibility scan
- **WHEN** the docs site is scanned with an axe-core based checker on representative pages (home, a content page, Arabic locale page)
- **THEN** the scan reports 0 `serious` and 0 `critical` issues

### Requirement: Docs are dark-only
The docs site SHALL render using a dark theme only.

#### Scenario: Theme behavior
- **WHEN** the docs site is loaded
- **THEN** there is no UI to switch to a light theme
- **AND** the rendered theme does not switch to light based on OS preference

### Requirement: Keyboard navigation works for docs chrome
Header controls, sidebar navigation, and search SHALL be accessible via keyboard-only navigation.

#### Scenario: Skip link and navigation
- **WHEN** a keyboard user navigates the docs page
- **THEN** a skip-to-content mechanism is available
- **AND** focus order is logical through header, nav, and main content

### Requirement: External links that open new tabs are announced
Links that open in a new tab/window SHALL be announced to assistive technologies.

#### Scenario: External link behavior
- **WHEN** a link opens in a new tab/window
- **THEN** its accessible name or description indicates that behavior

### Requirement: Callout boxes are readable across viewports
Docs callout/asides (note, tip, caution, danger) SHALL remain readable on both desktop and mobile.

#### Scenario: Callout contrast
- **WHEN** viewing callout boxes on small screens
- **THEN** the callout background and text remain clearly readable (no washed-out background)
