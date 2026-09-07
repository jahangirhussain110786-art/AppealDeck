# Decisions Log

## 2026-09-07 — Wave C

### AuthCard extraction (Task 6)

- **Option 1:** Keep auth pages as-is with duplicated markup. _Rejected_ — violates DRY; the 4-page duplicate was flagged in Wave B review.
- **Option 2:** Extract as `<AuthCard>` wrapper component. _Chosen_ — clean separation of layout (AuthShell) + shared UI helpers (GoogleButton, Divider, SubmitButton, StatusMessage). Each page retains its own form fields and auth logic.
- **Option 3:** Use a form library (React Hook Form). _Rejected_ — overkill for 4 simple forms; the codebase doesn't use RHF elsewhere.

### DeviceManager revoke confirmation (Task 5)

- **Option 1:** Bare button click → immediate revoke. _Rejected_ — destructive action needs confirmation.
- **Option 2:** Inline toast undo. _Rejected_ — doesn't match the existing pattern; device revocation is irreversible.
- **Option 3:** Radix Dialog confirmation. _Chosen_ — consistent with DeleteDialog pattern in VaultView; uses existing `@radix-ui/react-dialog`.

### Lighthouse a11y threshold

- Bumped from 0.95 → 1.0. The 7 audited pages (home, pricing, decode, login, privacy, terms, refund) all score 100 on accessibility via axe-core.

### axe-core e2e

- **Option 1:** Run axe via Playwright test helpers. _Chosen_ — `@axe-core/playwright` is the standard integration; 6 tests cover critical violations + keyboard nav + skip-link.
- CI e2e job updated to `npm run start` before Playwright (previously only ran build + test:e2e against built static output; a11y needs a running server).

## 2026-09-04 — Domain topology

- Single-host deploy for first launch (marketing + auth + app on `.vercel.app`). Subdomain split deferred.

## 2026-09-03 — Paddle checkout

- Overlay mode (Paddle.js v2) chosen over inline — simpler integration, no PCI surface.
