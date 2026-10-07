# Handoff, 7 Oct 2026 (end of day): the Safari/WebKit finding and exactly where the work stands

Written so the next session (or the founder) can pick up tomorrow without re-deriving anything. Read sections 1 and 2 first. Section 5 is the to-do list in order.

## 1. The issue in one paragraph

While extending the end-to-end suite to Safari's engine (WebKit) and Firefox, 33 of 179 tests failed in WebKit and all of them traced to **one real product bug**: text a seller enters **before the page's JavaScript has finished loading** is lost or ignored in WebKit. Chromium and Firefox cope. Safari is roughly a quarter of seller traffic (every iPhone), and the first thing a frightened seller does is paste their notice, often before a slow connection has delivered the scripts. So this is not a test quirk.

## 2. What exactly goes wrong (verified, not guessed)

Reproduced with scripts that hold the page's scripts back (`_next/static/chunks/**` delayed 1.5 s), fill the box immediately, wait for the page to become interactive, then look.

| Place | WebKit before the fix | Chromium / Firefox |
| --- | --- | --- |
| `/decode` notice box | The pasted text **stays visible**, but React's state is empty, so the **Decode button stays disabled for good** until the seller types another character. | Button enables. |
| `/login`, `/signup`, `/forgot-password` (and `/reset-password`, same pattern, not separately reproduced) | The typed or autofilled email (and password) is **wiped** when React takes over the controlled input. | Kept. |
| Home page paste box (`#hero-notice`, `HeroTool.tsx`) | Same pattern as `/decode` (controlled textarea). Not separately reproduced before the fix; covered by the new test. | Kept. |

Why: the fields were controlled React inputs (`value={state}`). WebKit either leaves DOM text that React's state never saw (textarea) or resets the DOM to the empty state value on hydration (inputs).

Scripts used to prove it (scratch, not committed): `webkit1.cjs`, `webkit2.cjs` (early fill, three browsers), `webkit3.cjs` (auth pages). The result lines before the fix: chromium `true/true`, **webkit `false/false`**, firefox `true/true`.

## 3. The fix (written, built, partly verified, NOT yet committed)

New hook `src/lib/useAdoptPrehydration.ts`: a stable `ref` callback that runs once when React takes the element over and hands any text already in the element to the state (`setValue(current => current || el.value)`, so a restored draft is never replaced by an empty box).

- `src/app/decode/DecodeClient.tsx` and `src/components/marketing/HeroTool.tsx`: textarea stays controlled, gains `ref={adoptNotice}`.
- `login`, `signup`, `forgot-password`, `reset-password` pages: inputs changed from controlled (`value=`) to uncontrolled (`defaultValue=""`) plus `ref={adoptX}` and the existing `onChange`, so React has nothing to overwrite. `PasswordInput` forwards the ref.
- Verified after rebuilding: `webkit2.cjs` now prints `true/true` for all three browsers; `webkit3.cjs` shows the login email kept and submitted ("Invalid login credentials" came back from Supabase, which proves the typed values were sent).
- Lint and typecheck were clean after the change.

**Not yet done for this fix:** a full re-run of the WebKit suite, running the new spec, committing, and a CI decision (section 5).

## 4. State of the repository and background jobs right now

Last pushed commit: `66ba4d1` (Plan of Action examples guide). CI was green on it. Everything below is **uncommitted** in the working tree:

**Finished and tested earlier in the session, just not committed (safe to commit):**
- AI drafting integration hardening: `src/lib/draftCache.ts` (new), `src/lib/ratelimit.ts` (`rateLimitDraft`, 20 new drafts per seller per day), `src/app/api/compose/route.ts` (cache hit re-verified, daily limit, fallback reasons), `src/app/api/__tests__/compose-ai.test.ts` (151 API tests passed with these), `src/content/workspace.ts` (daily_limit copy, "Writing your draft…" strings), `src/components/workspace/ResponseReview.tsx` (busy button and status line), `e2e/compose-errors.spec.ts` (6 passed including the new delayed-server test).
- `package-lock.json`: `npm audit fix` (sharp 0.35.4 to 0.35.5; production audit now 0 findings). `.github/workflows/ci.yml`: new `npm audit --omit=dev --audit-level=high` step.
- Examples guide added to `e2e/a11y.spec.ts`, `e2e/journey.spec.ts`, `e2e/reflow.spec.ts`, `e2e/share-cards.spec.ts`.
- `playwright.config.ts` and `package.json`: `webkit` and `firefox` projects and `npm run test:e2e:cross`.
- `docs/audits/2026-10-07-launch-audit-plan.md`: L-035 to L-039 added (L-039 says cross-browser "results below"; those results are not written yet).

**The WebKit fix (section 3), also uncommitted:** `src/lib/useAdoptPrehydration.ts`, the four auth pages, `DecodeClient.tsx`, `HeroTool.tsx`, and the new `e2e/prehydration.spec.ts` (written, **never run yet**).

**Background jobs that may still be running or just finished:** the full WebKit suite re-run (task output files `b1cz4m8l3.output` and `b5pf29ekf.output` under the session's `tasks` folder in the temp directory). They hold the port 3000 server; if a job is still running, wait or kill it before starting any Playwright command, otherwise you get "http://127.0.0.1:3000 is already used". The first WebKit run (33 failures) is in `b4l32e62k.output`.

## 5. To do tomorrow, in order

1. **Check no leftover server/job** on port 3000 (`preview_list`, or look for stray `next start`). Stop it.
2. **Read the WebKit re-run result** (`b1cz4m8l3.output` or `b5pf29ekf.output`, the last lines list failures). Expect most of the original 33 to be gone. For every remaining failure decide: real Safari bug, or test assumption (for example keyboard Tab order differs on macOS Safari, `showSaveFilePicker` absent, popups, downloads). Fix real ones; mark genuine engine differences in the test with a comment, never by weakening a Chromium assertion.
3. **Run `e2e/prehydration.spec.ts`** in all three projects (`CI=1 npx playwright test e2e/prehydration.spec.ts --project=chromium --project=webkit --project=firefox --retries=0`, after a fresh `npm run build`). It must pass in all three. As a negative control, stash the hook change on one auth page and confirm the WebKit test fails.
4. **Run the Firefox suite** (`--project=firefox`) the same way; nothing has been run there yet beyond the one early-fill script.
5. **Run the standard gates**, then commit and push in sensible commits (suggested split: AI drafting hardening + audit gate; cross-browser projects; pre-hydration fix + spec): `npm run typecheck`, `lint`, `lint:copy`, `lint:reachability`, `lint:sources`, `format:check`, `npx vitest run`, `npm run build`, then `CI=1 npx playwright test --project=chromium --retries=0`. Check `gh run list` after pushing; Linux CI has caught things Windows missed three times today.
6. **Decide the CI policy for browsers** (founder-cheap option): add a small CI job that runs only `e2e/prehydration.spec.ts` plus the decode and marketing specs on WebKit, rather than the 18-minute full suite. Recommendation: do it, because this bug class returns silently.
7. **Check other controlled first-touch inputs for the same class.** Not yet reviewed: `VaultGate.tsx` passphrase fields, `PriorAttempts.tsx`, the case workspace's inputs after sign-in (they appear after hydration, so probably safe), and anything else with `value={state}` that a seller can reach in the first seconds. `git grep -n "value={" -- src` is the starting list.
8. **Finish the audit file**: add the WebKit/Firefox results to L-039, add the pre-hydration finding as L-040 (P1: Safari seller cannot decode a pasted notice when they paste early; auth fields wiped), update `docs/CURRENT-STATE.md` with a "tested in Chromium, WebKit and Firefox" line only after steps 2 to 4 are green.

## 6. Everything else decided or built today (so it is not lost)

The full list is in `docs/audits/2026-10-07-launch-audit-plan.md` (findings L-001 to L-039) and `docs/audits/2026-10-07-product-gap-register.md`. In short, built and pushed today: calendar file for case dates; Word and print-to-PDF export; daily ops digest and `/api/health`; **AI drafting of the Plan of Action behind a deterministic fact and overclaim check** (`src/core/draftVerification.ts`, `src/core/policyBrief.ts`, `src/lib/llm/draftResponse.ts`); on-device browser translation wiring (`src/lib/translate.ts`); EU/EEA/UK purchase gate (`src/lib/region.ts`, env `BLOCKED_PURCHASE_COUNTRIES`); worked-examples guide (`src/content/guideExamples.ts`); restored-vault auto-unlock; questionnaire prompt fix; many smaller fixes.

## 7. Founder-owned items still open

- **Paddle Default payment link** (sandbox and live). Without it nobody can pay: the overlay opens then fails with `transaction_default_checkout_url_not_set`. DEPLOYMENT step 5a.
- **Gemini billing** on the key's project, then `GEMINI_PAID_TIER_CONFIRMED=true` on Vercel. Until then AI drafting falls back to the seller's own wording and says so.
- Production Paddle, mailboxes (`support@`, `billing@`, `privacy@`), `RESEND_API_KEY`, `OPS_ALERT_EMAIL`, `CRON_SECRET`, the two backup secrets, the real domain, Paddle country restriction (DEPLOYMENT 5b), migration `0016`.
- **Expert handoff is ON HOLD**: build only after the founder writes words like "Yes you can implement this expert expiry share link handoff system". Email forwarding is parked for the future extension (AM-27 still applies). Both recorded in `docs/DECISIONS.md` (7 Oct 2026).
- Markets: US first, Saudi Arabia next; EU/UK purchases blocked. Research summary is in the 7 Oct conversation; no usable Saudi or Pakistan seller-count data was found, so do not quote numbers for them.

## 8. Practical traps (learned the hard way today)

- Never write a regex or `\n` through a shell heredoc, a Python string, or `node -e`; it silently corrupts (a literal backspace once replaced `\b` and a rule never matched). Use the Write or Edit tool, then scan: `grep -nP "[\x00-\x08\x0b\x0c\x0e-\x1f]" <file>`.
- Playwright with `CI=1` starts its own server on 3000: stop any `preview_start` server first.
- `CRLF` files (`vercel.json`) defeat scripted replacements; use the Edit tool after a Read.
- After a signed-in walk restore the dev account: unbind the licence (`case_id = null`) and delete its `license_devices` rows (scratch scripts `cleanup-dev.cjs`, `unbind.cjs` were used).
- Linux CI has 15 px classic scrollbars: test layout at 305 px wide.
