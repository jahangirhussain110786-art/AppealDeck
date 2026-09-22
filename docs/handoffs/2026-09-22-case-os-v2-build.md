# AM-26 Case OS v2 — build evidence log

**Pass:** AM-26 / AA-39–43, ratified by the founder in chat on 22 September 2026.
**Direction (the authority for this pass):** [`2026-09-22-case-os-v2-ratified-direction.md`](2026-09-22-case-os-v2-ratified-direction.md)
**Amendment:** `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` → AM-26
**Reasoning:** `docs/DECISIONS.md`, 22 Sep 2026 entry

---

## Resume pointer

**Next task: AA-41 + AA-43 (K2 — document reading, shipped together with the disclosure correction).** AA-39 and AA-40 are complete. Two founder decisions are still open and are listed at the end of this file.

---

## Baselines — measured 22 Sep 2026 at `eb52f6e`, before any AM-26 code

Run fresh this session rather than carried forward from an earlier commit's log.

| Gate | Result | Exit |
|---|---|---|
| `npm run typecheck` | clean | 0 |
| `npm run lint` | No ESLint warnings or errors | 0 |
| `npm run lint:copy` | PASS | 0 |
| `npm run format:check` | All matched files use Prettier code style | 0 |
| `npx vitest run` | **563 passed in 62 files** | 0 |
| `npm run build` | succeeded; middleware 26.8 kB | 0 |

Note on the build figure: exit code and middleware size were observed directly. The full route-table count was not recounted in this run — it was 33 at `4bf2691` and nothing in this pass changed routing. Recount it at the first AA-39 commit.

Playwright and Lighthouse were **not** run for this paperwork step; no UI changed. Both are required before the pass is called complete.

---

## Task log

### AA-38b — paperwork (this step) · docs only, no `src/`

**Done 22 Sep 2026.**

- `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` — AM-26 written in full with AA-39–43; the pre-existing "AM-26 is deliberately not written into this file" note updated to record the ratification rather than being deleted; Definition of Done count 38 → 43 with a 22 Sep status line.
- `docs/DECISIONS.md` — 22 Sep entry, five alternatives considered and why each was rejected.
- `docs/handoffs/2026-09-22-case-os-v2-ratified-direction.md` — new. Contains the two-journey comparison the founder asked for in writing, the verified-code table, the build order, and the two pending founder calls.
- `docs/handoffs/SESSION-START-PROMPT.md` — both PATH lines repointed; current-pass banner rewritten with the two hard rules; changelog entry appended.
- `CLAUDE.md` §4 — new 22 Sep bullet; NEXT 4 ACTIONS rewritten around AA-39 → AA-43.
- This file — new.

**Verified in source before writing any of it** (each claim re-checked at `eb52f6e`, not carried over from a summary):

| Claim | Where it was checked |
|---|---|
| Decoder describes, does not decide | `src/core/noticeParser.ts` — 66 lines, returns category + window + four booleans; `src/core/classifier.ts` picks one of 7 kinds by priority |
| No entity extraction | no ASIN / case-ID / order-ID / date extraction anywhere in `noticeParser.ts` |
| Notice families with no home | `ViolationKind` (`src/core/index.ts`) has 7 members — nothing for verification/INFORM, performance metrics, product safety, restricted products, Seller Challenge |
| IP / related-account / product-safety silently refused | `routeWorkspace()`, `src/core/workspace.ts:120` → `specialist`; identity and funds → `clarification` |
| Nothing ever speaks first | `reminderAt` (`src/lib/caseStore.ts:37`) and `reminderDue` (`src/core/caseState.ts:93`) are written and read; **no delivery mechanism exists** — the only scheduled job is `/api/jobs/purchase-emails` |
| No document reading | zero `FormData` / multipart handlers across `src/app/api` and `src/lib`; no upload endpoint exists |
| Text already leaves the device | `/api/decode`, `/api/compose`, `/api/extract-field`, `/api/analyze-reply` are server routes; `legal/privacy.md` §2 discloses it; `src/app/decode/DecodeClient.tsx:146` renders `<LocalFirstBadge processing="server" />` |
| The two journeys are nested, not parallel | `src/app/(app)/case/page.tsx:52` renders `CaseWorkspace` by default, `?mode=classic` is the only route to the standalone interview, and `CaseWorkspace.tsx:581` embeds `InterviewFlow` |

**Discovered, worth carrying forward:**

1. The §1 amendment index table in `02-BUILD-PLAN-AMENDMENTS.md` stops at AM-17 — AM-18 through AM-25 were never added. Pre-existing, left as-is and flagged in AM-26 rather than half-corrected by adding one row. The §3 per-amendment sections remain authoritative.
2. The 21 Sep session's note reserving AA-39 onward for AM-26 was correct and is now honoured exactly.
3. The founder's privacy instruction, taken at face value, would have scoped a much larger and riskier change than the code actually requires. Reading the source first shrank it to one missing capability plus three copy corrections. Worth repeating as a method, not just an outcome.

---

### Honesty pass — false and near-false product claims

**Done 22 Sep 2026.** Founder direction: *"either remove or correct or take any suitable action on false statements of our tool."* Audited every absolute claim in `src/content/`, `src/components/` and `legal/` rather than assuming where the problems were. Two real findings; the rest of the copy was already careful.

1. **`legal/privacy.md` was a stale orphan that contradicted the live page.** The privacy notice actually served at `/privacy` is generated from `src/content/legal.ts` (via `LegalPage`), and that content is accurate — it states plainly that decoding and response preparation send text to our server. The markdown draft still said the opposite: *"not uploaded to us by default. We cannot read your case vault."* The 11 Sep 2026 audit added "this is NOT what's rendered" banners to `terms.md`, `refund.md` and `withdrawal-consent.md` — **`privacy.md` was missed**, and it was the one file whose divergence was a false claim rather than a stylistic one. Corrected in place with a superseded banner, an explicit "never correct the live page to match this file" instruction, and a dated correction note.
2. **`LocalFirstBadge` carried a false variant one prop away from a real page.** `processing="browser"` rendered *"Decoded in your browser. Nothing sent"*, and its tooltip invited the reader to verify it in DevTools by observing *"zero requests"* to our host — a check that **would have failed**, because decoding has always been a server round-trip. It was only ever rendered in the dev gallery, so no visitor saw it, but an invitation to verify a false claim is worse than the claim alone. The variant is removed rather than left as a trap; the remaining text is a claim about Amazon, so it stays true after AA-41.

**Deliberately not changed yet:** `src/content/legal.ts` says *"Original evidence files are not uploaded for these actions"* and *"Original evidence files are not sent for drafting."* Both are **true today**. They become false when AA-41 ships, which is exactly what AA-43 exists to fix — in that same commit. Rewriting them now would mean publishing a false statement in the other direction.

### AA-39 — K0: the kernel

**Done 22 Sep 2026.** Verified in a browser against two real notices, not only in tests.

**Built:**

- **`src/core/responseType.ts` (new)** — `determineResponseType()` decides which response Amazon is asking for: plan of action · supporting documents · acknowledgement · questionnaire · no action · undetermined. Every determination carries the seller's own quoted sentence and its offsets. `UNDETERMINED` is a first-class answer with an honest instruction, never a guess.
- **`src/core/entities.ts` (new)** — extracts ASINs, order IDs, labelled case IDs, dates, amounts and requested records, each with spans back into the source. Case IDs are matched only when labelled, because a bare ten-digit run is far more likely to be a phone number. All-numeric dates are flagged `ambiguous` instead of being resolved by guessing day/month order.
- **`src/core/violationKinds.ts` (new)** — taxonomy v2 adds `VERIFICATION`, `PERFORMANCE_METRIC`, `PRODUCT_SAFETY`, `RESTRICTED_PRODUCT`, with guidance and evidence requirements for each. `SEVERITY_GATED` deliberately unchanged.
- **`routeWorkspace()` rewritten** — D6's gate narrowed to what D6 actually names; `verification` is now its own route; and the routing decision is delegated to `determineResponseType` so `/decode` and the workspace cannot disagree.
- **Three new protocols** — `verification`, `questionnaire`, `acknowledgement`, with `COMPOSABLE_PROTOCOLS` marking where drafting prose is the right output (`verification` is excluded on purpose).
- **`/api/decode` and `/decode`** — the decision and the extracted details are now returned and rendered, with the quoted source sentence shown under "Where we read that".

**Discovered while building, each a real defect rather than a tidy-up:**

1. **Six hand-maintained copies of the kind list outside `core/`** — a zod enum, three route validators and a page-level type guard — none checkable by TypeScript, because a standalone string array is structurally unrelated to a union. Adding a kind compiled cleanly while the API silently rejected it, which would have defeated the entire taxonomy change. All now derive from `VIOLATION_KINDS`. The same class of drift existed for `Protocol` in `workspaceSchema.ts`; now derived from `PROTOCOLS`.
2. **A past-tense mention read as a request.** "Your previous Plan of Action was received. Please provide the supplier invoice." routed to the composer instead of to documents. Caught by the existing routing test, not by mine. Fixed with a `HISTORICAL` guard, and the plan-of-action terms now require an actual request verb in prose while still counting as a request when they appear as a bare form-field label.
3. **Verb inflections were not matched.** Found by decoding a real verification notice in the browser: "by providing government-issued identification" extracted nothing at all, because the patterns only matched bare infinitives and the document nouns omitted identity documents. Both modules now share one `REQUEST_VERB`.
4. **Two security tests would have been silently gutted by a naive fix.** `compose-gate` and `checkout-intent-gate` each asserted that a *forged* protocol is rejected — but their scenario was a related-account notice, which only counted as forged because D6's gate had drifted. Once the gate was narrowed correctly, both notices routed legitimately and the tests failed. Flipping the expectations to 200 would have deleted the guarantee that route validation runs before a pass is claimed. Both were rebuilt as genuine mismatches instead, with the reasoning recorded inline.
5. **A span-invariant inconsistency in my own design**, caught by a test helper: `requested_record` carries a canonical display label rather than the notice's wording, so its `value` cannot equal its source slice. Documented explicitly on the type rather than papered over.

**Browser verification (dev server, two notices):**

- A notice mentioning "Plan of Action" twice — once past-tense, once negated — plus a documents request: correctly decided **Supporting documents**, quoted the right sentence, and extracted the ASIN, date, case ID and both requested records. This is the exact case that would have burned a seller's appeal attempt.
- A verification notice: previously fell through to `UNKNOWN` with no guidance. Now classified **Identity or business verification**, with verification-specific guidance that says plainly a Plan of Action is the wrong response, and the requested identity document extracted. No console errors on either.

**Gates after AA-39:** tsc 0 · lint 0 · lint:copy PASS · format:check 0 · **vitest 604/604 in 64 files** (from 563/62) · build 0, middleware 26.8 kB, clean `.next`.

**Not done in this task, by design:** Playwright and Lighthouse were not re-run (deferred to the end of the pass); screenshots not captured — the desktop window state blocked the capture, and the browser verification above is recorded as text instead.

### AA-40 — K1: the clock speaks first

**Done 22 Sep 2026.** Verified in a browser via the dev gallery (the dashboard needs a signed-in vault, and this session does not type passwords).

**Built:**

- **`src/core/clock.ts` (new, pure)** — decides what is due and what came due while the seller was away. Takes `now` as a parameter rather than calling `Date.now()`, so every case is directly testable. Four urgency bands (overdue / today / soon / scheduled) on whole UTC calendar days, so a date is not "1 day away" at one minute past midnight. Terminal cases produce nothing — chasing a seller about a case they have already won is what makes a product feel automated rather than attentive.
- **`WAITING_THIRD_PARTY` case state** — a case blocked on a supplier or rights owner previously sat in "Evidence gathering", which reads as the seller not having done their homework. It now has its own state, its own next-best-action, and a `waitingOn` record (party, since, follow-up date) that feeds the clock.
- **`ClockBriefCard`** — the first thing on the dashboard. Four states, all reviewed in the dev gallery.
- **`lastSeenAt` on the case log** — stamped once per visit and only *after* the brief is computed against the previous value, guarded by a ref because StrictMode double-invokes effects and this project has already lost a case file to that exact race (`InterviewFlow.tsx`, 19 Sep 2026).
- **The email half** — migration `0011_case_reminders.sql`, `src/lib/caseReminders.ts`, `POST/DELETE/GET /api/reminders`, the `/api/jobs/case-reminders` cron, and `buildCaseReminderEmail`. Opt-in per case. Inert until the founder applies `0011` and adds `RESEND_API_KEY`, the same way the purchase email was inert before its key.

**The privacy decision inside AA-40, made explicitly rather than by accident:** email is the only channel that reaches a seller who is not on the site, and an email cannot be sent from a closed device. So a reminder row must exist server-side. It carries a due date, a coarse violation kind, and the vault's own opaque case id — no notice text, no evidence, no draft, no free text. It is opt-in per case, turning it off deletes the row, and `src/content/legal.ts` gained a sentence saying exactly this **in the same commit**, with the "last updated" date moved to 2026-09-22. AM-26 point 4 authorises the channel; the disclosure is not deferred to AA-43.

**Tone contract on the reminder email, enforced by tests rather than by review:** this message arrives unprompted at someone whose livelihood is suspended. `caseReminderEmail.test.ts` asserts it states only the date the seller set, explicitly says nothing has changed and that Amazon does not notify us, contains no prediction or guarantee, contains no manufactured urgency ("urgent", "act now", "last chance"), says how to stop it, and escapes HTML so a label cannot inject markup.

**Discovered:**

1. **A copy defect the gate caught in my own comment** — `lint:copy` flagged a banned soft word ("just") inside a code comment. The gate scans comments, not only user-facing strings.
2. **A stutter in the card, caught by reading the rendered page rather than the code** — the "New since you were last here" phrase appeared in the header *and* verbatim on every row. The row marker is now a short "New".
3. **Nine pre-existing Playwright failures, confirmed not caused by this work.** `e2e/decode-continuity.spec.ts` (7) and `e2e/workspace.spec.ts` (2) fail an axe `color-contrast` check: #9fa195 on #434c49 = 3.38:1 against a 4.5:1 requirement, on a `bg-muted text-muted-foreground` revision badge. **Verified by stashing all of this session's work and re-running the same two tests on the clean checkout — both still failed**, so the cause predates AA-39/AA-40. Not fixed here: the colour system is founder-approved under AM-22, and a token change needs its own pass checking every muted-on-surface pairing in both themes. Spawned as a separate task with full reproduction detail.

**Gates after AA-40:** tsc 0 · lint 0 · lint:copy PASS · format:check 0 · **vitest 638/638 in 67 files** (from 604/64) · build 0, clean `.next` · Playwright chromium **63 passed / 9 failed / 3 skipped**, all 9 failures pre-existing and verified as such.

**Deliberately not done:** browser push notifications. Delivering one while the tab is closed needs a service worker, a push service and VAPID keys — real infrastructure — and a notification that only fires when the seller already has the page open does not "speak first" in any sense worth the name. Email does the job honestly; a half-working notification would not.

**Founder decisions still open (neither blocks AA-41):**

1. **Identity documents** — read server-side with AI like invoices, or checked in the browser? Recommendation and reasoning in the direction doc's AA-41 section.
2. **The classic interview** — keep or retire, now that AA-39's routing fix makes the workspace usable for every notice family.
3. **New:** apply `supabase/migrations/0011_case_reminders.sql` and add `RESEND_API_KEY`, or email reminders stay inert. `0008` is still unapplied from the earlier pass.

### AA-41 — K2: sensors, the product reads the documents

*Not started.* Founder call pending: identity-document processing split. **Must ship with AA-43 in the same commit.**

### AA-42 — K3: evidence pack and tracks

*Not started.*

### AA-43 — disclosure parity

*Not started.* Blocks AA-41. Targets: `legal/privacy.md` §1 and §2, `src/components/LocalFirstBadge.tsx`, the "Encrypted on your device" label in `src/content/marketing.ts:162`.

---

## Standing reminders for this pass

- Never run `npm run build` while `next dev` is live, or the reverse — this project has hit the resulting `.next` cache corruption twice and lost an hour to false test failures each time.
- Report hashes only from `git log`; exit codes decide gates; a task done at reduced scope is written up as NOT DONE, not as done.
- Batch 3–4 tasks per commit, gates once per batch, push once gates are green — the founder's standing workflow, already authorized.
