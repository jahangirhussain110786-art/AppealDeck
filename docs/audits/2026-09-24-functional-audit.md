# Functional audit and seller-value review — 24 September 2026

## Verdict and scope

The app already contains most of the capabilities missing from the older launch review. The useful work in this pass was repairing the connections between editing, saving, revision, review and export. This is a local audit and repair pass, not certification that the product wins appeals or that production integrations work.

Reviewed the saved launch handoff, current project instructions, current-state register, 22–24 September gap/build reports, workspace request/evidence/response/history flow, drafting API, export, questionnaire, wording checks, schema limits and CI. Preserved the existing untracked audit-coverage CSV. No deployment, remote push, real payment, external message, secret change or database migration.

## Verified defects and repairs

| Priority | Defect and consequence | Repair and evidence |
| --- | --- | --- |
| P1 | Autosave treated an empty string as removal of the draft override. Clearing previously saved text resurrected the old text on reload. | Preserve empty strings; only `undefined` removes an override. Unit coverage and a browser clear/reload regression. |
| P1 | Questionnaire draft keys used positions. Reordering or replacing the response form could put an old answer under a different question. | Bind drafts to exact question text. Convert existing positional drafts against their original form on load. Preserve removed-question drafts for recovery/export. Unit migration and browser reorder/reload coverage. |
| P2 | The schema allowed 50 saved answers but only 20 draft fields, and limited draft keys to 200 characters despite 500-character questions. | Allow 100 draft fields and 550-character keys. Regression checks a full 50-answer questionnaire. The bound remains finite. |
| P1 | Confirming coverage of multiple issues used the response-save callback, which erased unfinished response drafts without saving their text. | Separate issue confirmation from response saving. Browser coverage confirms unfinished text survives the checkbox and reload. |
| P1 | After changing previously attested corrective actions, reload restored the old confirmation tick alongside the new unfinished text. | Initialize confirmation only when displayed corrective actions match the confirmed version. Extend the existing operational-response browser regression through autosave/reload. |
| P2 | Saving response facts replaced a captured whole workspace, potentially overwriting newer queued edits in other sections. | Merge only the response fields into the latest workspace in the serialized commit queue. Preserve unrelated draft keys. |
| P2 | Case notes omitted questionnaire answers entirely, including answers retained from earlier forms. Unconfirmed saved drafts were omitted too. | Export current and earlier answers. Include unfinished drafts in a separate explicitly unconfirmed section; intentional blanks are identified. Unit and downloaded-file browser checks. |
| P2 | Preparing a response serialized the encrypted vault's unfinished field drafts into the API request, although composition does not use them. Large drafts could also exhaust the request size limit. | Exclude `workspace.draft` from the compose payload, alongside saved document checks. Confirmed response fields remain available to the composer. |
| P1 | The wording check could accept removal of `not`, contraction negation, planning language, or an existing recognized supplier name. Its disclosure overstated what pattern matching could establish. | Reject changes to explicit negation/planning marker counts and dropped recognized names. Add adversarial tests. State clearly in the review UI, privacy disclosure and current-state register that these checks cannot establish semantic equivalence or catch every invented claim. |
| P2 | A displayed wording suggestion remained accept-able while its parent was saving/preparing a response. | Respect the parent's disabled state on the acceptance button. |

Main implementation: `src/lib/workspaceDraft.ts`, `workspaceSchema.ts`, `workspaceExport.ts`, `src/components/workspace/CaseWorkspace.tsx`, `ResponseReview.tsx`, `ImproveWording.tsx`, `src/core/wordingLock.ts` and matching tests/content.

## Seller and expert comparison

These are directional signals from public discussions and practitioner writing, not a representative customer survey or evidence of AppealDeck's efficacy. Search freshness does not make an older article new; the practitioner pieces below are older guidance checked on 24 September 2026. No outcome rate is inferred.

| Observed need | Evidence | What the app provides and the implication |
| --- | --- | --- |
| Understand precisely which evidence remains missing after rejection. | [Seller discussion and Amazon moderator response: repeated rejected appeals](https://sellercentral.amazon.com/seller-forums/discussions/t/1004d831-7d0b-4f70-8553-00bd1cbea7d4). | Requirements tied to notice text, evidence notes, document checks and reply deltas already exist. Preserve these records reliably; actual Amazon acceptance remains outside the tool's control. |
| Match records to the specific affected transactions or products. | [Seller discussion: uncertainty over requested delivery evidence](https://sellercentral.amazon.com/seller-forums/discussions/t/fd2fb303-8e95-404a-94f6-948ae4567bb4?postId=fd2fb303-8e95-404a-94f6-948ae4567bb4). | Extracted identifiers and document comparisons help. They do not authenticate evidence or establish Amazon's unstated criteria. |
| Concise, specific explanations that connect the cause, completed correction and prevention. | [ecommerceChris: how to write a Plan of Action](https://www.ecommercechris.com/how-to-write-an-amazon-plan-of-action-poa/) (older practitioner guidance). | Separate response sections, critic findings and completion confirmations exist. The fixes stop confirmations from silently following changed text. Wording help must remain reviewable and cannot invent the seller's actions. |
| Distinguish a root cause from merely restating the complaint. | [ecommerceChris: complaint causes versus root causes](https://www.ecommercechris.com/get-your-amazon-account-reinstated-fast/) (older practitioner guidance). | Existing guided facts and critic checks support preparation. Real-case expert review is still needed to measure whether these prompts elicit sufficiently specific answers. |

The product direction fits these needs. More generic template generation is not evidence of more seller value. The next outcome-oriented validation should use consenting sellers and an independent appeal specialist: can a user identify the requested route, cover every question, locate the needed records, preserve revisions and deliver a readable handoff without assistance?

## Still open before a paid launch

Current **local** environment presence checks, without printing credentials: Paddle environment is `sandbox`; price/client token and Gemini key are present. `PADDLE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, and `GEMINI_PAID_TIER_CONFIRMED` are absent. These observations do not establish the state of Vercel or the providers.

1. Verify sandbox checkout → signed webhook → correct case entitlement → confirmation email, replay/refund behavior, then configure and verify live billing under a separate release action. The local unit tests do not prove provider delivery.
2. Confirm the paid Gemini project and production switch before sensitive seller information uses cloud document/wording features. The app contains the production switch; billing status was not inspected here.
3. Configure/test email and cron delivery, support mailbox and operational backup secrets. Complete a real backup restore drill; unit crypto recovery and 10k-record migration tests are different evidence.
4. Validate representative consented cases with specialists and sellers. Synthetic routing fixtures and working UI flows do not prove correct real-world outcomes. Do not publish success rates from this audit.
5. Broader AI semantic equivalence remains unsolved by regexes. The code now blocks several concrete failure classes and the product describes its limits. An added lowercase action with no new number/name can still pass; seller comparison and acceptance remain essential.

## Second pass — outside the workspace (24 Sep 2026, Claude Code)

The first pass stayed inside the case workspace. This pass covered the server routes, billing, reminders, dates, the vault backup and sign-in redirects. Two defects were found and fixed:

| Priority | Defect and consequence | Repair and evidence |
| --- | --- | --- |
| P1 | **A seller could pay $249 twice for one case.** `/pricing` checked only whether the active case existed and could be drafted, never whether it already had a Pass. It offered "This Pass will cover your active case" and a working Buy button. `/api/checkout/intent` created a second checkout without checking either. One Pass already covers every revision, so the second payment bought nothing, and the only remedy is a refund. | The server refuses with 409 when `fetchLicenseForUser(user, case)` is active, and refuses with 503 rather than guessing when the lookup fails. `/pricing` shows "already has its Appeal Pass" and disables the button. A refunded Pass (`canceled`) can be bought again. Three new tests in `checkout-intent-gate.test.ts`. **The page half is not browser-verified**: it needs a signed-in session with a paid case. |
| P2 | **Follow-up dates counted in UTC, not on the seller's calendar.** Picked dates (the reminder, the "chase" date) are stored as midnight UTC of the chosen day. The dashboard clock took "today" in UTC too, so for part of every day it disagreed with the deadline chip on the same page, which uses the seller's calendar. From midnight to 05:00 in Pakistan a reminder due today read "tomorrow"; from 19:00 in New York one due tomorrow read "today" and the case turned "follow-up due" early. The case-notes export printed both dates in local time, which is the day before anywhere west of UTC. | `clock.ts` counts the item's UTC calendar day against the seller's local today, the same rule as `daysUntilDay`. `reminderDue` uses `daysUntilDay`, and the export uses `formatDay`. New tests are written from local clock times so they hold in any zone. They were run under Asia/Karachi, UTC and America/New_York, and **one fails against the old code** on this machine. |

Checked and found sound (no change): Paddle signature verification and the exactly-once event function (refunds and chargebacks revoke access; a completed transaction needs a matching checkout intent); per-case Pass checks on compose, wording help and document reading; identity documents never leaving the device; reminder delivery (one bad address cannot block the rest, three attempts and then it stops, deleting a case cancels its reminder first); `safeNext` on every sign-in, sign-up and callback path; backup restore (every record is decrypted and checked before anything is written, and restore refuses a vault that is not empty).

Noted for a founder decision, not changed:
- Restoring a backup switches the vault to passphrase mode, so every page asks for the backup passphrase until the seller turns automatic unlock back on in the vault.
- Restore needs an empty vault, so a seller who started a fresh case on a new device must delete it before restoring their old one.
- `/api/analyze-reply` (rules only, no AI) accepts any active Pass on the account rather than one for the case. It costs nothing to run, so this is a pricing question rather than a leak.

Gates after the second pass: all lints and typecheck 0 · vitest **1122/1122** in 87 files · build clean · Playwright chromium `CI=1 --retries=0` **116 passed / 0 failed / 0 skipped**.

## Third pass — cost controls, compose, outcomes, devices (24 Sep 2026, Claude Code)

| Priority | Defect and consequence | Repair and evidence |
| --- | --- | --- |
| P1 | **Anyone could switch AI reading off for every seller, at no cost.** `withGeminiBreaker` wraps the whole route, so the day's spend cap (240, one counter for the service) was counted at the door: before sign-in, before the Pass check, and for requests that never reach Gemini. The per-minute limit in front of it keys on request headers a script can vary. About 241 anonymous POSTs to `/api/read-document` or `/api/improve-wording` disabled both for every paying seller until midnight UTC. A seller's own refused requests (an identity photo, an unnamed record) spent it too. | `BreakerOptions.spendCountedAt: "call"`. Spend is counted by `reserveSpend` inside `callGemini`, immediately before the request to Google, so only a signed-in, Pass-holding request that is about to cost money can use the budget. It fails closed on a Redis error. Document reading tells the seller when the daily limit is the reason. Four tests in `breaker.test.ts`. |
| P2 | **A refused outcome share was silently lost.** `OutcomeShareCard` reported whether the send worked, but both callers marked the prompt answered regardless. A seller who pressed "Share it" while the server could not record it (a rate limit, or the outcome table not yet applied) was told nothing, and the card never returned. The dashboard's "success" toast was the button label, "Share it". | The card keeps itself open on a refused send and says nothing was sent. On success it confirms, then resolves. New signed-in e2e test (`workspace.spec.ts`): first send refused, card stays; second send accepted, card closes. |
| Register | **`docs/CURRENT-STATE.md` never mentioned Upstash**, though the limiter fails closed in production. Without it, buying a Pass, preparing a response and every other signed-in server feature answers "too many requests", while the register listed several of them as Live. | A note under the status legend names Upstash as the step under every signed-in server feature. |

Checked and found sound (no change): `/api/decode` is public but rules-only, with no AI call, so it has no cost to abuse; compose checks the gate, the Pass and the per-case Pass in the right order, and the page strips submission history before sending (a realistic case stays far under the 200 KB cap); the device cap is per account (the oldest active licence) and device removal checks ownership; the Gemini paid-tier switch is enforced for both AI routes.

Noted for a founder decision, not changed:
- Outcome rows are anonymous by design, so a seller who shares "approved" by mistake cannot correct it, and the aggregate keeps the wrong row. Any future published rate should allow for that, or the card should ask for confirmation first.
- The breaker records a failure only for a 5xx status, and document reading returns 200 with `ok: false` when Gemini fails, so the error-rate circuit never opens for that route. It is harmless, because the per-call timeout still applies, but the circuit protects less than its name suggests.

Gates after the third pass: all lints and typecheck 0 · vitest **1126/1126** in 87 files · build clean · Playwright chromium `CI=1 --retries=0` **117 passed / 0 failed / 0 skipped**.

## Validation

Browser authentication-dependent checks are distinguished from local/mocked paths; no browser test is treated as proof of a real payment or Amazon submission.

The audit's session ended while tracing one browser failure: in `e2e/journey.spec.ts`, a document check appeared to vanish after reload even though a "Checked" line had shown. The session was finished by a second AI on the same day (Claude Code). What it found:

- **This is a test defect, not a product defect.** The test waited for `/^Checked /` as its sign that the vault write had landed. For an image, however, the local picture-quality check immediately shows "Checked on this device. …", before anything is saved, so the test could reload while the write was still in progress. The product's dated "Checked {date}." line (`DocumentCheckPanel.tsx`) renders only after `commit()` returns true, which is after the write. The wait now excludes the local-check line. The race would not reproduce in 14 runs under either one or four workers, so the fix comes from reading the code, not from catching the failure again.
- The temporary `audit-*` console logging in `CaseWorkspace.tsx` and the diagnostic spec `e2e/audit-debug.spec.ts` were removed. The browser regressions for this audit's fixes are in `e2e/response-continuity.spec.ts`, renamed from `audit-continuity.spec.ts`.
- The sign-in continuity test in `e2e/integrity.spec.ts` targeted the retired "Current case" `<select>`. It now counts the case buttons in the dashboard's "Your cases" region.

Gates, run fresh after these changes: typecheck 0 · lint 0 · lint:copy PASS · lint:reachability PASS · lint:sources PASS · format:check 0 · **vitest 1116/1116 in 87 files** · build clean · **Playwright `CI=1 --project=chromium --retries=0`: 116 passed / 0 failed / 0 skipped**, including the signed-in tests with the dev-account fixture. The `[WebServer] The destination stream closed early` lines in that run are server log noise from downloads cut off by page reloads. They are not failures.
