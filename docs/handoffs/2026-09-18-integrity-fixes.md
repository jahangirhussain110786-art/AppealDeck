# 18 September 2026: integrity fixes

This implementation follows the analysis in 2026-09-18-project-analysis.md. That document is a historical baseline, not the current state. Existing AppHeader home-link edits and the visual-direction mockup were preserved. No application deployment or git push was performed.

## Implemented

- Account-ID-owned entitlements, client write revocation, per-case Appeal Pass binding, and multiple-license-safe lookups replace email-only authorization. Checkout creates a server-owned intent with authenticated purchaser, case, allowlisted price and exact accepted consent text.
- Signed Paddle events are processed transactionally with true event IDs, unique transaction provisioning and a durable confirmation outbox. Database failures remain retryable; unknown prices never grant access. Approved full refunds and chargebacks revoke access even when delivered before purchase completion; duplicate completion cannot reactivate them. Guardian sale provisioning remains out of scope.
- Account vaults use separate databases. Guest vaults use tab-session identifiers and a session-only secret rather than a persistent device key. Sign-in moves a guest draft to an empty account vault, or merges its active case after an existing account vault is unlocked. Old shared vaults are preserved and require explicit recovery confirmation. Account changes lock and reload the page.
- Portable backups wrap the content key with a backup passphrase. Restore validates every encrypted record before writing and refuses populated destinations. Cloud upload failures no longer report success. Content encryption and visible metadata are disclosed accurately.
- Case file/log/index/pointer writes are transactional. Deleting a case removes its log too. Dashboard has a case switcher. Composer, dashboard and evidence uploads scope documents to the active case. Removed documents stop satisfying evidence requirements. Evidence controls share an already-unlocked vault.
- The interview waits for saved-case loading before allowing automatic case creation, closing a browser-discovered reload race. Read failures now show retry guidance instead of silently starting fresh.
- Shared bounded domain schemas protect compose/interview. Severe cases are blocked server-side. Deadline extraction requires an appeal-related clause and preserves ambiguity. A seller-selected reminder date makes the no-response state reachable without inventing Amazon deadlines.
- Production rate limits and AI breakers fail closed when infrastructure is missing; deterministic composition survives AI infrastructure failures.
- Device-cap checks cover revoked-device reactivation, with a database trigger serializing concurrent activations. Failed device registration cannot silently bypass checks.
- Checkout and polling use the current case, including passphrase-protected vaults. A pass for an older case does not suppress checkout for a new case. Polling errors leave a retry surface.
- Preview deployment writes its URL output, limits secret-bearing runs to same-repository PRs, and requests explicit workflow permissions. Playwright owns its CI server, runs the production build in CI, and launches correctly on Windows. The normal e2e command excludes the artifact-producing screenshot project.

## External changes actually made

Supabase migrations 0009_entitlement_integrity.sql and 0010_atomic_device_cap.sql were applied to the project selected by NEXT_PUBLIC_SUPABASE_URL. SQL regressions first ran inside rollback-only transactions. An authenticated development-account REST probe confirmed license UPDATE is denied and own-license SELECT still works. Existing dev-grant ownership was migrated; no historical paid licenses were present. Email confirmation settings were not changed.

Paddle sandbox now has a USD 199.00 one-time, tax-inclusive Appeal Pass price and a client token. Local sandbox environment variables were updated in the ignored .env.local file. No real payment was taken, and no production Paddle catalog was changed. Setup script: scripts/setup-paddle-sandbox.mjs.

## Validation

Final results are recorded at the end of this file. Unit coverage includes portable JSON recovery on a different database, non-empty restore refusal, write rollback, guest/account isolation and continuity, evidence scope, strict schemas, deadline disambiguation and signed webhook failures. SQL coverage includes event replay, refund ordering, transactional rollback and the device cap. Browser coverage includes authenticated sign-in/sign-out, draft continuity, cross-tab isolation, API validation, auth gates and automated accessibility checks.

## Deployment requirements and remaining external limits

1. Deploy the application code together with these migrations. The only accessible Vercel project found was named backend and was not identifiable as AppealDeck; it was not modified. No live app release was made.
2. Set the authoritative Paddle price, client token, environment and PADDLE_WEBHOOK_SECRET for that app host. Subscribe its webhook to transaction.completed, adjustment.created and adjustment.updated (plus lifecycle events only if subscriptions are introduced). A real completed sandbox checkout and provider-delivered replay through a public app URL still need to be exercised; local signature tests and SQL simulations do not substitute for that.
3. Configure RESEND_API_KEY, verified EMAIL_FROM and CRON_SECRET. Those email/cron secrets were absent in the inspected local configuration. The outbox preserves confirmations; the browser confirmation endpoint retries after activation and the scheduled worker retries daily. Email delivery itself has not been demonstrated.
4. Keep UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set in production. Missing configuration intentionally denies limited API operations; AI composition retains deterministic fallback.
5. A cloud backup upload/download drill through the real Storage service is still required before claiming end-to-end cloud recovery. Portable serialization and recovery are covered by automated crypto tests.

Limitations: browser-held automatic-unlock keys protect storage at rest, not against someone controlling the same browser profile or malicious same-origin JavaScript. Closing a guest session can make its remaining encrypted database unreadable; ciphertext is preserved rather than destructively purged. Legacy shared-vault ownership cannot be inferred safely. Case IDs are client-generated and server-bound at purchase; this is per-case entitlement enforcement, not proof of a real-world Amazon case identity. This pass does not certify legal compliance or absence of every possible defect.

## Reproduction

- npm run typecheck; npm run lint; npm run lint:copy; npm run format:check
- npm test
- npm run build
- npm run test:e2e (CI=1 selects next start; load .env.local into the test process to include the authenticated dev-fixture test)
- node --env-file=.env.local scripts/check-entitlement-migration.mjs (rollback-only)
- node --env-file=.env.local scripts/verify-entitlement-security.mjs

The SQL device-cap test is supabase/tests/device_cap.sql and must run inside a rollback-only transaction. Do not run the development user rotation script to test authentication; it deletes/recreates the fixture account.

Additional browser findings fixed: automatic unlock now notifies dashboard consumers to load their cases. The returning-account browser regression checks two cases survive a guest-to-account merge. Broken local skill junctions left over from the workspace move were repointed from V:/AppealDeck to V:/AppealDeck1; no skill contents were deleted.

## Final verified results

- TypeScript: pass. ESLint: zero warnings/errors. Copy lint: pass. Prettier: pass. git diff --check: pass.
- Vitest: **459/459 tests, 53 files**, including the 10,000-record migration harness.
- Final production build: pass.
- Final Chromium production-build suite: **56/56 tests, no retries, 42.4 seconds**. The authenticated test includes guest-to-account transfer, sign-out isolation, returning-account merge preserving two cases, and a mocked per-case denial rendering checkout. It does not complete a payment.
- Supabase transactional payment regressions: pass, rolled back. Device-cap SQL regressions: pass, rolled back. Live authenticated license UPDATE: denied. Own-license SELECT: passed. No unassigned licenses or regression payment rows remained.
- Final code changes remain in the working tree for review; no commit, push or application deployment was made.
