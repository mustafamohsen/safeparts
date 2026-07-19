# Native Windows accessibility release checklist

Run this checklist against the exact packaged build before a preview or canonical release. Use only synthetic Secrets and Recovery shares.

## Keyboard

- Complete Split and Recover with Tab, Shift+Tab, arrow keys, Space, and Enter.
- Verify Ctrl+1 and Ctrl+2 switch tasks, Ctrl+Enter runs the primary action, and Ctrl+Shift+Delete clears only the current task.
- Confirm focus remains visible and never becomes trapped.
- Dismiss every dialog and confirm focus returns to the relevant control.

## Narrator and UI Automation

- Run Accessibility Insights FastPass with no critical failures.
- Confirm every editor, selector, button, status, and result has an accurate name, role, enabled state, and value or text pattern.
- Confirm Split and Recover progress, readiness, success, and failure changes are announced.
- Complete both workflows with Narrator without using pointer input.
- Confirm icon-only or compact actions expose names and help text.

## Display and input

- Check light, dark, and every Windows contrast theme.
- Check 100%, 150%, 200%, and 300% display scaling plus Windows text scaling.
- Resize to the minimum useful window and verify content remains reachable by scrolling.
- Exercise Unicode, Arabic and other right-to-left text, dead keys, AltGr, emoji, multiline selection, and IME composition.
- Confirm the native title bar retains usable caption buttons at every scale and theme.

## Sensitive-data review

- Confirm clipboard reads and writes occur only after explicit actions.
- Confirm dialogs, logs, CI artifacts, screenshots, and accessibility output contain no entered Secret, Recovery share, reconstructed bytes, or passphrase.
- Clear each task and the full workbench, then confirm late native operations do not repopulate cleared state.
