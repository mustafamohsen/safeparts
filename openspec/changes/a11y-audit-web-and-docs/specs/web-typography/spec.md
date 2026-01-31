## ADDED Requirements

### Requirement: Accessibility fixes must not change branding
Accessibility-related changes SHALL NOT change branding colors or font families.

#### Scenario: Non-branding constraint
- **WHEN** implementing accessibility improvements
- **THEN** existing colors and font families remain unchanged

### Requirement: Font size may change only when needed for accessibility
Font size adjustments SHALL be made only when required to meet accessibility needs (readability, minimum touch target sizing, or conforming focus indicators).

#### Scenario: Font sizing guardrail
- **WHEN** a font size change is made
- **THEN** it is justified by an accessibility requirement (e.g. WCAG-aligned readability or target sizing)
