## ADDED Requirements

### Requirement: Help/docs are available offline in-app
The mobile app SHALL bundle the Safeparts help/docs content and make it available inside the app without opening an external browser.

#### Scenario: Open help while offline
- **WHEN** the user opens help/docs while offline
- **THEN** the help/docs content loads successfully

### Requirement: Help respects locale and direction
The in-app help experience SHALL provide English and Arabic content with correct direction behavior.

#### Scenario: Open Arabic help
- **WHEN** Arabic UI is active and the user opens help
- **THEN** the Arabic docs locale is shown
- **AND** the help view renders right-to-left where appropriate

### Requirement: No network requests are required to render help
Rendering in-app help SHALL NOT require fetching remote assets.

#### Scenario: Airplane mode help
- **WHEN** the device is in airplane mode
- **THEN** help content renders fully without network requests
