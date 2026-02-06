# EAS (Build + Submit)

This app is intended to ship via App Store / Play Store.

## Prereqs

- Expo account + EAS project set up for this app
- Store credentials configured (App Store Connect + Google Play)

## Local usage

From `mobile/`:

- Install: `bun install`
- Login: `bunx eas login`

Build:

- Dev: `bunx eas build --profile development --platform all`
- Preview: `bunx eas build --profile preview --platform all`
- Production: `bunx eas build --profile production --platform all`

Submit:

- `bunx eas submit --profile production --platform ios`
- `bunx eas submit --profile production --platform android`

## CI credentials

CI will require an Expo token and store credentials to submit builds.
Keep them in GitHub Actions secrets (do not commit credentials).
