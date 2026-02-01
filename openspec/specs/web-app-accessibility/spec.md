## ADDED Requirements

### Requirement: WCAG 2.2 AA conformance for the web app
The Safeparts web app (Split + Combine) SHALL meet WCAG 2.2 Level AA requirements for keyboard, screen reader, and touch accessibility.

#### Scenario: Automated accessibility scan
- **WHEN** the web app is scanned with an axe-core based checker on the main screens (Split and Combine)
- **THEN** the scan reports 0 `serious` and 0 `critical` issues

### Requirement: All interactive controls are keyboard operable
All interactive controls (links, buttons, selects, inputs, textareas) SHALL be reachable and usable using keyboard-only navigation.

#### Scenario: Tab through primary flows
- **WHEN** a user navigates with `Tab` and `Shift+Tab`
- **THEN** focus reaches the header controls, tab switcher, and form controls in a logical order
- **AND** interactive elements can be activated with `Enter`/`Space` as appropriate
- **AND** there is no keyboard trap

### Requirement: Focus is always visible on interactive elements
The UI SHALL provide a visible focus indicator for all interactive elements.

#### Scenario: Focus visibility
- **WHEN** a user focuses any interactive element using the keyboard
- **THEN** focus is clearly visible (not removed via `outline: none` without a replacement)

### Requirement: Tabs expose state to accessibility APIs
The Split/Combine toggle SHALL expose its structure and selection state using appropriate ARIA semantics.

#### Scenario: Screen reader announces selected tab
- **WHEN** a screen reader user navigates the Split/Combine toggle
- **THEN** it is announced as a tablist with tabs
- **AND** the selected tab is announced as selected
- **AND** the associated panel is programmatically connected to the active tab

### Requirement: Language switcher exposes state
The English/Arabic language switcher SHALL expose which language is active.

#### Scenario: Screen reader announces active language
- **WHEN** a screen reader user navigates the language switcher
- **THEN** the control announces which language is currently selected

### Requirement: Form fields have programmatic labels and descriptions
All form fields SHALL have a programmatic label, and any hint/error text SHALL be programmatically associated.

#### Scenario: Secret input with hint
- **WHEN** a screen reader user focuses the Secret textarea
- **THEN** the label is announced
- **AND** the hint text is announced as a description

#### Scenario: Validation and errors
- **WHEN** an input is invalid
- **THEN** it is marked invalid for assistive tech (e.g., via `aria-invalid`)
- **AND** the error text is associated with the field (e.g., via `aria-describedby`)

### Requirement: Status and feedback messages are announced
UI status changes (errors, successful copy, recovered output available) SHALL be announced to assistive technologies.

#### Scenario: Error after split/combine
- **WHEN** an error appears after an operation
- **THEN** it is announced without requiring the user to navigate to it

#### Scenario: Copy action feedback
- **WHEN** the user activates a Copy control
- **THEN** the success feedback is announced (polite) without moving focus

### Requirement: Touch targets meet minimum size
Interactive controls frequently used on mobile SHALL meet a minimum touch target size.

#### Scenario: Tap target sizing
- **WHEN** the app is used on a touch device
- **THEN** primary controls (tabs, language toggle, copy, remove, CTAs) have a target size of at least 44x44 CSS pixels

### Requirement: Motion respects user preferences
Animated UI (e.g. the encrypted text reveal) SHALL respect `prefers-reduced-motion`.

#### Scenario: Reduced motion user preference
- **WHEN** `prefers-reduced-motion: reduce` is enabled
- **THEN** animated text effects are disabled or reduced to a non-animated reveal

### Requirement: Screen readers can read revealed text, not scrambled glyphs
Scrambled/revealing text effects SHALL not cause screen readers to read gibberish.

#### Scenario: EncryptedText accessibility
- **WHEN** a screen reader encounters encrypted/revealing text
- **THEN** it announces the final intended text
- **AND** it does not announce intermediate scrambled characters
