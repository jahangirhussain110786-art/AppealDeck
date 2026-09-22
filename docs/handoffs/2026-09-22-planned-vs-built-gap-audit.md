# Planned vs. built — the full gap register

**22 September 2026.** Every planning document, spec, amendment, gate, register and handoff in this
repository, read against the code at `c6bb9a0`, to find what was decided, specified or promised and
never actually reached the product.

**This file makes no judgement about whether an item should now be built.** That is deliberate: the
founder asked for the finding pass first and the classification pass second. Each entry therefore
records what was promised, where, what exists in code, and the evidence — and then stops. The
columns **Still wanted? · Still relevant? · Action** are left blank for the classifying pass.

---

## 0. Method, and what this register is worth

- **Sources read:** all 69 files under `Planning/`, all 66 under `docs/`, `CLAUDE.md`, `AGENTS.md`,
  `legal/*.md`. 18,366 lines.
- **Verification:** every claim below was checked against `src/` by grep or by reading the file, at
  `c6bb9a0`. Where I write "no caller", I ran the search; the exact command is in §7 so it can be
  repeated. Nothing here is inferred from a status line in another document — the documents are
  precisely what turned out to be unreliable.
- **Two corrections I made to myself while auditing**, recorded because they show the failure mode
  of this kind of sweep: I first concluded the "since you were here" brief was dev-only (it is on
  the dashboard, `DashboardClient.tsx:626` — my grep output was truncated by `head`), and I first
  concluded the evidence matrix was disconnected from the live product (it is connected through
  `composer.ts`, `documentCheck.ts`, `/api/read-document` and `CasePreview.tsx`). Both are stated
  correctly below. If a third party re-runs this, expect to find one or two more of these.
- **What this register cannot tell you:** whether a gap matters. Several items below are dead by
  correct decision and only the paperwork is missing. Several others are silent product failures.
  They look identical in a grep.

**Counts.** 13 items built-and-unreachable · 30 specified-and-never-built · 9 recorded-as-done
that are not · 11 stale or superseded statements · plus the founder-owned backlog summarised in §6.

---

## 1. Category A — built, ratified, and unreachable

This is the category the founder's instinct was right about, and the one no checkbox could have
revealed. Every item here **exists, is tested, and was ticked off as delivered**, and no seller can
reach it. Eleven of the thirteen became unreachable on 22 September 2026, when the classic interview
was retired at the founder's direction — a correct decision whose consequences were never swept up.

| ID | What | Promised in | Code state | Evidence |
|---|---|---|---|---|
| **A-01** | **Marking an action done, and attesting to it.** EF-2 specified an explicit attestation checkbox with fixed microcopy ("You confirm this action is truly complete… AppealDeck cannot and does not verify documents"), and a critic rule that fires when a draft claims a corrective action nobody attested. | `04-EVIDENCE-FIRST-HARDENING.md` §EF-2; AM-16 / **AA-19 [x]** | The data model is complete and correct. Nothing in the product can write to it. The only code that sets `status`, `attestation` or `declined` is `interviewEngine.applyAnswer`, which has no caller. Every action item is therefore frozen at `status:"todo"` forever, `computeReadiness().unattestedActions` is always empty, and the critic rule at `composer.ts:255` can never fire. | `readiness.ts:8-24`, `readiness.ts:75`, `interviewEngine.ts:281-306`, `composer.ts:255` |
| **A-02** | **Objection-aware alternatives.** The founder's own scenario: the checklist says "obtain a compliant invoice", the seller says "I can't", and the product offers predefined alternatives with honest consequences instead of a dead end. AM-17 called this the moment agencies earn their fee. | `05-CASE-OS-SPEC.md` §2; AM-17 / **AA-22 [x]** | `alternativesFor()` builds them; only the dead step engine calls it. `src/core/workspace.ts` — the live case model — contains zero occurrences of `declin*`, `alternativ*` or `attest*`. The composer's `[Declined: …]` branch is unreachable. | `interviewEngine.ts:355`, `interviewEngine.ts:36`, `composer.ts:129-130` |
| **A-03** | **"Have you already done this, will you, or can't you?"** — the step that asks before demanding a file. | AM-24 / **AA-37 [x]** (founder direction, 12 Sep) | `actionCheckAnswer` is written only by the dead `applyAnswer`. | `readiness.ts:16-24` |
| **A-04** | **The interview step engine itself** (`nextStep`, `applyAnswer`, `interviewProgress`). | AM-17 §4, AM-21 | No caller anywhere outside the `core/index.ts` re-export. Only the `CaseFile` type and `createCaseFile()` survive in use. This is the mechanism A-01, A-02 and A-03 all hang from. | `core/index.ts:183` is the only reference |
| **A-05** | **`whyAmazonWantsIt`** — the one honest sentence per evidence requirement explaining why Amazon asks for it. EF-1 made it a required field of the matrix precisely so it could be shown. | `04-EVIDENCE-FIRST-HARDENING.md` §EF-1; register **#22** | Rendered in exactly one place: `EvidenceSlotPanel.tsx:230`. That component is rendered only by `/dev/ui`, which 404s under `next start`. The live evidence surface (`EvidenceReview.tsx`) renders `workspace.Requirement` — `{id,label,sourceQuote,status,note,…}` — which has no such field. | `EvidenceSlotPanel.tsx:230`; `workspace.ts:44-55` |
| **A-06** | **The three outreach letters** — supplier invoice request, rights-owner retraction, follow-up nudge. Written as pure data, scoped into the paid consultant review (B-16) as the content where expert review matters most. | `04-EVIDENCE-FIRST-HARDENING.md` §EF-4; AA-19; register **#28/#35/#40** | `letters.ts` is complete and tested. `lettersForEvidenceKind()` is called only from `EvidenceSlotPanel.tsx` — i.e. only from the dev gallery. A seller cannot obtain any of the three. | `EvidenceSlotPanel.tsx:23,151,212` |
| **A-07** | **Draft-strength signal.** Built in direct response to founder feedback on 12 Sep: a three-sentence, blame-shifting draft with no corrective actions was displayed as "Full draft — all required evidence is present", with nothing telling the seller the writing itself was thin. | Founder feedback 12 Sep 2026, recorded in the module's own header | `src/lib/draftStrength.ts` has **no importer at all**. The problem the founder reported is still live in the product. | `draftStrength.ts:1-14`; no import found repo-wide |
| **A-08** | **ID paste normaliser** — strips zero-width characters and curly quotes from pasted ASINs and case IDs. | AA-31, explicitly listed as "also done" | `src/lib/idNormalize.ts` has no importer. | no import found repo-wide |
| **A-09** | **POA clipboard builder** (`buildClipboardText`) | Wave C / AA-28 | No importer. Presumably superseded when `/compose` was retired, but never removed. | `poaClipboard.ts` |
| **A-10** | **`Stepper`** — the progress rail ("Step 4 of ~9 · 2 evidence items pending") that AM-17 §4.1 property 7 named as the thing that makes the flow "a process, not a companion". | AM-17 §4.1; AA-26 | Referenced only by `DevUiGallery.tsx`. | `DevUiGallery.tsx:53,470` |
| **A-11** | **`MagnifierDocumentIllustration`, `ShieldCheckIllustration`** — two of the three layered SVGs built in AM-22 V2, which V7's own checklist says must "appear in their designated places". | AM-22 V2 / AA-35 | Referenced only by `DevUiGallery.tsx`. V7 — the sweep pass that would have caught this — is the one task of AM-22 never run. | orphan scan, §7 |
| **A-12** | **`src/lib/motion.ts`** — AM-18's DoD names this file as the home of the motion system. | `06-PREMIUM-UI-UX-SPEC.md` §5 + DoD | The module is a dead re-export with no importer. **The policy itself is fine** — `providers.tsx:9-10` sets `MotionConfig reducedMotion="user"` by importing framer-motion directly. Only the named file is dead. Low severity; listed for completeness. | `providers.tsx:9-10` |
| **A-13** | **The reachability gate has two blind spots**, and they are what hid A-01 through A-12. `scripts/lint-reachability.mjs` counts a reference from `src/app/dev/ui/DevUiGallery.tsx` as a real reference, although that route is dev-only; and it checks components and API routes only, so a dead module under `src/core/` or `src/lib/` (A-04, A-07, A-08, A-09, A-12) is invisible to it. | Built 22 Sep 2026 precisely to stop "built but unreachable" | The gate passes today with thirteen unreachable features behind it. | `lint-reachability.mjs` — no `dev/ui` exclusion |

> **Why this cluster exists.** `d9cb847` (22 Sep) retired the classic interview at the founder's
> explicit direction. That was right — two front doors meant every feature had to be built twice.
> But the interview was also the **only** surface for the AM-16 evidence discipline and the AM-17
> objection model. Retiring the door removed the rooms behind it, and the amendments file still
> carries AA-19, AA-22 and AA-37 as delivered. Three casualties of that commit were found and
> reported on 22 Sep (`FieldSuggester`, `priorAppealCount`, the orphaned routes). These are the
> rest of them.

---

## 2. Category B — specified and never built

### B.1 — Correctness and evidence

| ID | What was specified | Where | Code state |
|---|---|---|---|
| **B-01** | **≥4 realistic notice fixtures per violation family.** | Gate 1 check 8; B-03; v1.0 §13.1 | The six original families have exactly 4 each (POLICY 5). The four families added by taxonomy v2 on 22 Sep — `VERIFICATION`, `PERFORMANCE_METRIC`, `PRODUCT_SAFETY`, `RESTRICTED_PRODUCT` — have **zero**. Classifier accuracy is unmeasured for 4 of 10 families, and the M-3 gate ("fixture accuracy ≥90%") cannot be evaluated for them. |
| **B-02** | **≥2 synthetic Amazon-reply fixtures per analyser category, including one adversarial** — "a rejection quoting the seller's own template language back". | `05-CASE-OS-SPEC.md` §3 | No reply fixture corpus exists. `responseAnalyzer.test.ts` has 10 inline unit tests, one example per category, no adversarial case. Register **#92** (a *real* 2026 corpus) is correctly struck as unbuildable; this synthetic one was never struck and was never built. |
| **B-03** | **The reply delta.** "A new reply generates a proposed delta: what Amazon requested, what is already covered, what conflicts and what task reopens. Confirm before applying; retain the old one." | blueprint §6; register **#59**; `05-CASE-OS-SPEC.md` §3 | `applyWorkspaceReply()` archives the previous request and **resets every requirement to `"needed"`**. The seller redoes the entire evidence review from scratch on each Amazon reply. This is the labour the product exists to save, on the most common path (the median real case is multi-round). |
| **B-04** | **The escalation ladder** — the §7.3.5 ordered stages (revised POA → seller-performance@ → jeff@/ESR → Call-me-now → BSA dispute, display-only) with stage-entry criteria and each stage linked to a letter. | `04-EVIDENCE-FIRST-HARDENING.md` §EF-4 | A bare `ESCALATION` state, one generic sentence (`caseState.ts:210`) and a nav label. No ladder, no stages, no criteria, no letters. |
| **B-05** | **Requirement instances = the notice's own list ∪ the reviewed matrix**, each carrying applicability, alternatives and source. | register **#12 / #88** (both "Build", K0) | Half-built. `proposedRequirements()` (`workspace.ts:140`) derives requirements from the notice text using its own five regex→label pairs and never consults `evidenceModel.ts`. The matrix is used elsewhere (composer gap lists, document checks, `/api/read-document`, `CasePreview`) but not in the union that was specified, so a requirement Amazon did not spell out in the notice is never raised. |
| **B-06** | **Seller override of the decoded type, and correction of extracted entities.** | AA-31 remainder; kill-criterion **K12** ("classification-confidence display and user override verified working"); register **#6** ("source spans + seller correction") | Neither exists. Entities render read-only on `/decode` (`DecodeClient.tsx:387`). K12's pre-agreed response to a wrong-classification signal therefore has no mechanism behind it. |
| **B-07** | **Deadline provenance** — stated / seller-entered / assumed — plus timezone, and "no deadline found" as an honest first-class state. | register **#82**; AM-03 | `Deadline` (`deadlinesModel.ts:13-18`) has no provenance field. Provenance survives only inside English label strings. No timezone handling. |
| **B-08** | **Form-constraint capture** — allowed file types, size, field lengths, attachment count, taken from the actual response form the seller is looking at. | blueprint §6; register **#56** | Every limit in the product is a hardcoded `maxLength` (500 / 2000 / 4000 / 12000 / 50000). Nothing is captured from Amazon's form, so the pre-submit checklist cannot tell a seller their answer will be truncated. |
| **B-09** | **Export naming map** — renaming creates export copies with an original↔export map. | blueprint §6; register **#31** | `evidencePack.ts` writes a plain-text manifest only. No renaming, no map. (No ZIP and no PDF, both by recorded decision — not listed as gaps.) |
| **B-10** | **Free-decode evidence hook** — the free decode shows the required-evidence kinds for the classified violation. EF-2 called this "the honest conversion hook: it demonstrates we know what the case needs before asking for money". | `04-EVIDENCE-FIRST-HARDENING.md` §EF-2 | Not on `/decode`. A similar list exists one step later on the dashboard (`CasePreview.tsx`), behind the case, where it no longer does the job it was designed for. |
| **B-11** | **AA-31 remainder:** a root-cause category step; dated corrective-action rows; a neutral character counter on the draft; "jargon swaps". | AA-31 | None built. The only character counter is on the pasted-notice field (`RequestReview.tsx:109`). AA-31 itself records that jargon swaps were "never scoped precisely enough to implement" — that still holds. |

### B.2 — Measurement, money and safety rails

| ID | What was specified | Where | Code state |
|---|---|---|---|
| **B-12** | **The six canonical funnel event names, verbatim** — `decoder_session`, `decode_completed`, `intake_started`, `checkout_opened`, `pass_purchased`, `outcome_reported` — plus two supporting series and three web-only supplements (`gated_screen_shown`, `poa_generated`, `refund_requested`). The spec is explicit: "use these strings verbatim in code, sheets, and conversation — renaming events later poisons every historical comparison." | `06-OPERATIONS/03-ANALYTICS-AND-METRICS.md` §1; D10; Gate 3 check 34 | `analytics.ts:13-18` implements **four** events under **different names**: "Decode Completed", "Intake Started", "Purchase Completed", "Outcome Shared". `checkout_opened` — the step that isolates a pricing problem from a checkout problem — does not exist. Neither supporting series exists. None of the three supplements exist. This is cheap to fix now and expensive to fix after the first month of data. |
| **B-13** | **Nightly `supabase db dump --data` → encrypted off-site copy via GitHub Actions**, while on the free tier. | `02-PHASE-1-FOUNDATION/01-ACCOUNTS-AND-SERVICES.md` item 8; budget §3 | `.github/workflows/` contains `ci.yml` and `deploy-preview.yml` only. **Licences, entitlements, outcome events and case reminders have no backup of any kind.** |
| **B-14** | **A CI grep gate for `superpower`** in any copied donor file. | CLAUDE.md §3 (FORBIDDEN SOURCES, "absolute, no exceptions"); `04-REPO-AND-FIXTURE-CORPUS.md` item 9; build-sequence §5 | The `guarantee` gate exists (`lint-copy.mjs:28`). The `superpower` gate exists nowhere — not in CI, not in any script. The rule it enforces is one of the project's three absolutes. |
| **B-15** | **A guard that a free-tier (`appealdeck-dev`) Gemini key can never be used on a user-data path.** D9 exists because free-tier prompts train Google's models. | AM-08; **AA-11**; D9 | There is one `GEMINI_API_KEY` and no separation of dev and prod projects anywhere in code, env or CI. Nothing would detect or prevent a free-tier key in production. (The founder half — creating the two GCP projects — is also open; the guard is the AI-owned half.) |
| **B-16** | **TRC-08 item 4: a reserved budget slice for pass-holders**, so free-tier load cannot starve a paying customer mid-case. **TRC-08 item 5: alerting** to the founder the moment the breaker trips. | `03-TECHNICAL-RISK-CONTROLS.md` TRC-08 | Neither exists in `breaker.ts`. Items 1–3 are built and, to their credit, **fail closed** in production (`checkBreaker` returns `circuit_open` when Upstash is unset). Note also that `spendCapPerDay` counts **requests**, not dollars — it is a money ceiling only once cost-per-call is known, which is B-17. |
| **B-17** | **Load-test ~100 fixture drafts against the paid Gemini tier, measure the real cost per case, and set the rate limits and daily spend cap from the measured number, never guessed.** | B-19 sub-step; TRC-08 requirement 2; unknowns register item 10 | Never run. Every limit in the product is the placeholder the spec explicitly says must not survive. |
| **B-18** | **The spike drill** — scripted load trips the breaker, both clients visibly degrade to rules-only, budget window rolls over, cloud path recovers with no deploy. Named a hard M-W blocker. | TRA-08; Gate 3 check 30 | Never run. |
| **B-19** | **Error tracking (Sentry) and uptime monitors (Better Stack, 4 monitors).** | `06-OPERATIONS/03` item 3; MASTER item 18 | Not installed. Recorded as a deliberate founder priority call on 11 Sep — listed here so it is not mistaken for an oversight. |
| **B-20** | **Chargeback evidence-packet generator** — one script that assembles the six required items for a dispute. | `06-OPERATIONS/04-PAYMENT-OPERATIONS.md` item 2 | Not built. Needed the first time a chargeback arrives, which is not a moment to start building. |

### B.3 — Product surfaces a seller can see

| ID | What was specified | Where | Code state |
|---|---|---|---|
| **B-21** | **Browser-notification reminders.** AA-40 promised "a real reminder delivery path (browser notification; **email for signed-in sellers**)". | AM-26 / **AA-40 [x]**; register **#78** | Only the email half exists (`caseReminders.ts`, `/api/jobs/case-reminders`, inert until `RESEND_API_KEY` and a deploy). The `Notification` API appears nowhere in `src/`. For a signed-out seller — the entire audience AM-21's access ladder was designed around — **nothing speaks first at all**. AA-40 is ticked. |
| **B-22** | **A support surface**: an easily found About/Support page naming the actual operator, with a realistic, stated response window. | launch-readiness review §7; Gate 2 check 20 | No support page, no support address, no stated response window anywhere in `src/`. The only contacts are `billing@` and `privacy@` inside the legal pages, and one link labelled "About the service" pointing at `/terms#independence`. Phase 4's launch gate "response window stated and operationally real" cannot pass. |
| **B-23** | **Public knowledge base + the top-20 canned responses as product-facing content.** | `06-OPERATIONS/01-SUPPORT-OPERATIONS.md` items 2 and 5 | The canned responses exist as a planning file (`Planning/06-OPERATIONS/canned-responses.md`). No KB is published and nothing is reachable from the product. |
| **B-24** | **Guardian waitlist capture** ("notify me when account monitoring ships") and the **persona telemetry pack** (locale/user-agent segmentation on the decoder). | `07-REFERENCE/06-EDGE-PERSONAS.md` items 1–2 | Neither built. Gate 3 check 37 permits "coming soon + waitlist only" for Guardian; there is no waitlist. A stray `NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB` remains in `.env.example` with no code reading it. |
| **B-25** | **The four SEO guide pages** on the panic queries, plus on-page SEO for `/decode`. | B-21; `04-PHASE-3-LAUNCH/01` item 7 | Not built. Gated behind the founder's one-hour keyword verification, which has also not happened — so this is correctly blocked, not forgotten. |
| **B-26** | **The withdrawal-function page** (form → email/webhook into the refund workflow). | `02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md` item 8 | Not built. The consent checkbox and the waiver copy exist. **This may be genuinely unnecessary** — the statutory right is waived at immediate delivery and the 7-day voluntary refund runs by email — but nobody recorded that reasoning, so it still reads as an open commitment. |

### B.4 — The extension (nothing started, correctly)

| ID | What | Where |
|---|---|---|
| **B-27** | The entire MV3 extension: paste-mode panel, vault, deadline alarms, licensing, popup, options, kill switch, CWS package. | B-23…B-27; TRA-01, TRA-02, TRA-06, TRA-07, TRA-09, TRA-10; AA-17 (kill-switch drill); AA-18 (pin `@crxjs/vite-plugin` ^2.7.x); Gate 2 checks 24 and 27 |

Listed as one line because it is one decision, not twelve gaps: the extension was always third in D3's
order and the web surface is not deployed yet. **AM-27 (22 Sep) has already reduced its scope to
paste-only**, so the DOM-harvest and injector work these items assumed is gone. The useful reading is
that roughly a dozen unticked boxes across four documents all resolve to "the extension has not
started", and they inflate every open-item count.

---

## 3. Category C — recorded as done, and not (or only partly)

The most dangerous category, because each of these is a place where a future session will read a
tick and build on it.

| ID | Record says | Reality |
|---|---|---|
| **C-01** | **AA-19 [x]**, **AA-22 [x]**, **AA-37 [x]** — the evidence discipline, the objection model, the action-check step. | All three are unreachable (A-01, A-02, A-03). The code is real; the product does not contain the feature. |
| **C-02** | **AA-40 [x]** — "a real reminder delivery path (browser notification; email…)". | Email only (B-21). |
| **C-03** | **AA-31** lists the ID paste normaliser as done. | `idNormalize.ts` has no importer (A-08). |
| **C-04** | **AA-35** reads "V1–V8 not started". | V1–V6 and V8 shipped on 12 Sep (`39a09a8`, `4bf76b0`). **V7 — the cross-page sweep — is the one task never run**, and its own checklist is what would have caught A-11. The amendment text has been stale for ten days. |
| **C-05** | **AA-04** unticked (record the DOM-harvest/injector ruling in `docs/DECISIONS.md`). | Done on 22 Sep as AM-27. |
| **C-06** | **AA-25** unticked (founder ratifies AM-17). | Ratified 11 Sep, per this same file's own status line at line 460. |
| **C-07** | **AA-29** unticked (copy audit + content modules + lint gate). | Listed as DONE in the same file's 11 Sep status line, and `src/content/` + `lint-copy.mjs` exist. |
| **C-08** | **`09-MULTI-CASE-ARCHITECTURE-SPEC.md`** DoD: "P1 (case-switcher UI) not started", and "evidence listing elsewhere still reads the whole vault rather than filtering by the active case". | Both are done. `DashboardClient.tsx:240/467/578/635` lists and switches cases; `EvidenceSlotPanel.tsx:52` and `caseEvidence.ts:6` filter by `caseId`. A "New case" action exists (`CaseWorkspace.tsx:727`). **Genuinely open from that spec:** it still has no AM-XX number and no `docs/DECISIONS.md` entry — the only multi-case work in the repo with no amendment record. |
| **C-09** | Gate checks **8, 16, 19, 25, 29, 31, 39** unticked; **TRA-03, TRA-04, TRA-05, TRA-11, TRA-12** unticked; **B-02, B-10, B-11, B-14, B-18** unticked; MASTER items **8, 9, 15, 22** unticked. | Substantially built and tested. These are bookkeeping, not work — but they are why "757 unticked boxes" is a meaningless number today, and why the founder could not tell from the documents what was left. |

---

## 4. Category D — stale or superseded statements that should be struck

These are not gaps. They are sentences that will send a future session in the wrong direction, which
is the same cost.

| ID | Stale statement | Superseded by |
|---|---|---|
| **D-01** | **`$199` as the price of the Appeal Pass — 171 occurrences across 54 files.** Measured, not estimated; full breakdown and triage in **§4a**, because this one is larger and more delicate than the rest of this table. | The 21 Sep commercial reset: **$249 flat, worldwide, no country tiering**. `src/content/` is correct; almost nothing else is. |
| **D-02** | **Cloudflare Pages + Supabase Edge Functions** as the settled launch stack. | The 4 Sep single-host decision: Vercel. Still asserted in AA-12, B-09, Gate 2 check 14, `01-ACCOUNTS-AND-SERVICES.md` item 11, `04-PHASE-3-LAUNCH/01` item 2. (`GDPR-KIT.md` was already corrected on 11 Sep — the others were not.) |
| **D-03** | **The price experiment $99 / $149 / $199** across the first ~20 sales, as an open founder decision. | Superseded by the $249 flat decision. Appears as B-22, MASTER item 35, unknowns register item 7. |
| **D-04** | **The five-slot header** (Decode · Case · Dashboard · Vault · Pricing/Billing). | **AM-25** reduced it to three (Decode · Dashboard · Vault). `07-ACCESS-AND-CONTINUITY-SPEC.md` §3.1 and its acceptance item 3 still specify five. |
| **D-05** | **AI field suggestions on a free account** as a live feature with a daily cap. | Deleted 22 Sep 2026 and deliberately retired, not restored. `07-ACCESS-AND-CONTINUITY-SPEC.md` §9 and acceptance item 6 still specify it. |
| **D-06** | **The Guided Interview acceptance set** (red-team set, per-case LLM budget degradation, classic-form parity). | The interview was retired 22 Sep. `05-CASE-OS-SPEC.md` §4 and its DoD are now describing a product that does not exist. Note this is the same document whose §1–§3 are still authoritative — it needs splitting, not deleting. |
| **D-07** | **"Missing appeal window → default to 90 days, displayed as an assumption."** | The code does something better and different: `deadlinesModel.ts:65-70` returns `dueAt: null` with "Appeal window ambiguous — verify the exact date in your Account Health dashboard". **This is an improvement over the spec**, but it is an unrecorded divergence from AM-03 and build-sequence §4. Worth ratifying rather than leaving as a silent contradiction. |
| **D-08** | **`docs/MIGRATIONS.md`**: "`npm test` is green (all 159 tests)". | 792 tests in 73 files as of 22 Sep. |
| **D-09** | **`package.json`**: `filesystem:up` passes `--args V:\AppealDeck`. | The repo is `V:\AppealDeck1`. Same class as the nine stale paths fixed on 11 Sep; this one was missed because it is in `package.json`, not a document. |
| **D-10** | **`NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB`** in `.env.example`. | Guardian is deferred (D7) and Gate 3 check 37 says it must not be purchasable anywhere. No code reads the variable; its presence is the only risk, and it is small. |
| **D-11** | **`Planning/kilo-upgrade.md`** (7 unticked boxes) and **`Planning/04-BUILD/MCP-*.md`** configure a different agent tool and a Windows MCP bridge. | Not product work. They inflate the open-item count and one box says `git init` in a repo that has been under git since 29 Aug. |

---

## 4a. D-01 in full — the $199 that outlived the decision

**Measured at `c6bb9a0`: 171 occurrences of `$199` in 54 files** (168 in 53, excluding this audit's
own references to the problem). The product charges **$249** and has since 21 September; only
`src/content/` knows it.

**Do not run a find-and-replace.** Roughly half of these occurrences are correct and must survive.
There are three distinct kinds, and they are mixed inside the same files:

### (a) Live text that would misprice, mislead or misdescribe — this is the real defect

Each of these is written to be *used later*, by the founder or by a future session, and each would
carry $199 into the world at the moment it is used.

| File | Why it is dangerous |
|---|---|
| `docs/DEPLOYMENT.md:82` | The Paddle setup instruction: "**Appeal Pass** (one-time, $199)". Following this document creates the product at the wrong price and **charges sellers $199**. The single highest-consequence line in the repository. |
| `legal/withdrawal-consent.md:13` | The EU consent authoring record says the honest-expectations card states "$199 one-time per case". The rendered card says $249. **This is the same shape of defect as the missing "not legal advice" sentence** — an authoring record that no longer matches what a buyer is shown, inside the one document whose whole job is proving what the buyer was told before paying. |
| `Planning/06-OPERATIONS/canned-responses.md:12` | A support reply to be pasted into an email to a paying customer: "One Appeal Pass = $199 one-time". |
| `Planning/01-PHASE-0-BLOCKERS/PADDLE-APPLICATION-DRAFT.md:13,26` | The text to submit to Paddle. Describing the product to your merchant of record at a price you do not charge is a misdescription to the MoR. |
| `Planning/01-PHASE-0-BLOCKERS/SERVICE-ACCOUNTS-CHEATSHEET.md:74` | "Create a product 'Appeal Pass' $199 one-time". Same consequence as `DEPLOYMENT.md`. |
| `Planning/02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md` (6) | Including the §4.1 product spec and the Paddle acceptable-use answer sheet. |
| `Planning/04-PHASE-3-LAUNCH/PUBLIC-POSTS-DRAFTS.md:17,26` | Publishable launch copy: "**Appeal Pass — $199 one-time**". |
| `Planning/08-TEAM/EXTERNAL-OUTREACH-DRAFTS.md:10`, `RECRUITMENT-OUTREACH-DRAFTS.md:23` | Outreach messages to consultants and design partners. **These are the drafts AM-26's appeal-writer recruitment will actually send.** |
| `AGENTS.md:152` | The one-line product description every coding session reads first. |
| Build sequence (B-20), AM-21, TRC, EF-1, the verdict, MASTER-CHECKLIST, the four launch documents, payment operations, first-100, competitive response, unknowns, roadmap, edge personas, market evidence, risk register, recruitment kit, session continuity, `Planning/README.md` | Instructions and acceptance gates stated in terms of a price that no longer exists. |

### (b) Correct history — must not be touched

`docs/handoffs/*` (every dated session record, including `2026-09-21-commercial-review.md`'s nine
hits, which are *the analysis that produced the change*), `docs/DECISIONS.md`, `docs/product/*`, the
v1.0 reference build plan, `2026-09-02-COMPETITOR-RECHECK.md`, the salvage research, and
**`CLAUDE.md:62`** — "paid acquisition is arithmetically closed at $199" is a true statement about
the old price and rewriting it would destroy the reasoning. The house convention already says
historical documents are not rewritten; that convention is what protects these.

### (c) Competitors' prices — must not be touched

`Planning/07-REFERENCE/02-COMPETITOR-DOSSIER.md` has nine hits and **most are other companies'
$199/month tiers** (SellerForge Pro, an $79.99–199/mo rival, a $199/mo audit tool, Seller Basics'
$199/mo membership). The file even carries the warning "their $199/month does NOT validate our $199
one-time price". A blind sweep would silently corrupt the competitive record and the price anchors
that `01-MARKET-EVIDENCE.md` §1.2 gates all marketing copy against.

**So the work is a triage, not a substitution** — roughly 35 files to edit by hand, 19 to leave
alone, and a decision in each historical file about whether to add a dated "superseded by the 21 Sep
reset" note rather than change the number. Two lines are worth doing before anything else, whatever
the classification pass decides: `docs/DEPLOYMENT.md:82` and `legal/withdrawal-consent.md:13`.

---

## 5. What actually caused this

Four mechanisms, each of which produced several of the entries above. They are worth naming because
the classification pass should probably decide about the mechanism, not only the items.

1. **A door was retired and the rooms behind it were left standing.** Thirteen features (§1) became
   unreachable in one commit. The commit was correct; the sweep never happened. The reachability
   gate built the same day cannot see it, because the dev gallery imports everything (A-13).
2. **The dev gallery launders reachability.** `/dev/ui` exists to preview components and 404s in
   production. Anything wired only into it looks referenced to the gate and to a casual grep, and is
   invisible to sellers. Four components and, indirectly, the whole EF-4 letter set sit behind it.
3. **Ticking is the last step of a task, and it is the step that gets skipped.** Nine entries in §3.
   Both directions occur — done-but-unticked and ticked-but-not-done — which is why the checkbox
   state carries no information any more and why the founder was right not to trust it.
4. **Decisions are recorded where they were made, not where they will be read.** The $249 price
   reached `src/content/` and `CLAUDE.md` and none of the twenty planning documents that still say
   $199. Same for Vercel, the three-slot header, and the retired field suggestions.

---

## 6. Category E — founder-owned, summarised

Not enumerated item by item, because these are almost entirely one blocked chain rather than many
independent tasks. **Nothing is deployed**, and roughly 500 of the 757 unticked boxes are downstream
of that.

- **The chain:** deploy → Paddle live approval → first real transaction → Gate 3 revenue checks
  (28–31, 36, 39) → design-partner beta → CWS → launch-day → first-100 → the weekly review ritual.
  Until the first link exists, none of the rest can be ticked, and their open state says nothing
  about whether the work behind them is ready.
- **Small, unblocked, and currently blocking code that is already written:** `RESEND_API_KEY`
  (without it the reminder cron delivers nothing), `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (analytics is
  inert), `CRON_SECRET`, and the two GCP projects behind AA-11.
- **Open decisions with no owner but the founder:** the go/revise/stop thresholds for the pilot —
  Phase 4 §7 states plainly that "a stop criterion chosen after seeing the data is not a stop
  criterion" and the thresholds are still placeholders; the EU comply-or-decline question from the
  legal research; E&O insurance (Gate 2 K3); the scoped UPL review before any US marketing spend
  (check 40).
- **Still on disk:** the leaked-credential cleanup at `V:\Extension 2.3\extraction\`, and the old
  Supabase project's key rotation, unverified since Phase 0.

---

## 7. How to re-run this

```bash
# Components reachable only from the dev gallery
for f in $(find src/components -name "*.tsx" ! -path "*__tests__*"); do n=$(basename "$f" .tsx); \
  refs=$(grep -rl "\b$n\b" src/ e2e/ --include=*.ts --include=*.tsx | grep -v "^$f$" \
  | grep -v "__tests__" | grep -v "DevUiGallery"); [ -z "$refs" ] && echo "DEV-ONLY: $n"; done
```

```bash
# Core and lib modules with no importer at all
for f in $(find src/core src/lib -name "*.ts" ! -name "*.test.ts" ! -path "*__tests__*"); do \
  n=$(basename "$f" .ts); [ "$n" = "index" ] && continue; \
  refs=$(grep -rl "/$n\"\|/$n'\|\./$n\"\|\./$n'" src/ e2e/ --include=*.ts --include=*.tsx \
  | grep -v "^$f$" | grep -v "\.test\." | grep -v "__tests__"); \
  [ -z "$refs" ] && echo "NO-IMPORTER: $f"; done
```

Both are worth adding to `lint-reachability.mjs`; between them they found every item in §1.

---

## 8. The classification pass

For each ID above, the next pass needs four answers. Nothing here presumes any of them.

| Question | Why it is not obvious |
|---|---|
| **Still wanted?** | Some of §1 was superseded in substance by the workspace even though the amendment still claims it. A-01's attestation, for instance, may belong on the workspace's `Requirement`, not be restored as an action item. |
| **Still relevant to the current mindset?** | AM-26 reordered everything around "capable of being sold to a relevant audience", and the audience is now an appeal writer, not a seller found through ads. That changes which of these are worth anything. |
| **Restore, rebuild elsewhere, or strike?** | For §1 specifically these are three different amounts of work, and striking is a legitimate answer for most of them — but it has to be written down, or the next session finds the code again. |
| **Does it block deploy?** | Almost nothing here does, and the four exceptions are all small. **D-01's two live lines** — `docs/DEPLOYMENT.md:82` and `legal/withdrawal-consent.md:13` — are the only items that would do visible harm on the day of deploy: one sets up the Paddle product at $199, the other is the consent record that is supposed to prove what the buyer was shown. **B-12** (event names) is cheap now and unfixable later without losing comparability. **B-13** (no database backup) and **B-14** (the missing `superpower` gate) are the two whose cost of being wrong is not proportional to their size. |

