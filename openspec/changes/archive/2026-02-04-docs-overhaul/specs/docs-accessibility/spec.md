## MODIFIED Requirements

### Requirement: WCAG 2.2 AA conformance for the docs site
The Safeparts help site (Astro/Starlight) SHALL meet WCAG 2.2 Level AA requirements for keyboard and screen reader accessibility across all docs routes in both locales.

#### Scenario: Automated accessibility scan
- **WHEN** the docs site is scanned with an axe-core based checker on every docs route under `/help/` and `/help/ar/`
- **THEN** the scan reports 0 `serious` and 0 `critical` issues
