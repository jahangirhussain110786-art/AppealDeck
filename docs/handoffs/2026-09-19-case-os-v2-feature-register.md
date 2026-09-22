# Case OS v2 — feature register (the 70 from the Meta AI transcript + 26 the transcript missed)

19 September 2026 · Companion to the [direction doc](2026-09-19-case-os-v2-direction.md). Numbers 1–70 match the founder's pasted conversation and the 18 Sep decisions file (`docs/product/2026-09-18-feature-decisions.md`); 71–96 are additions from this pass.

> **STATUS, 22 Sep 2026 — read this before using the table below.** The *Code today* column was
> grep-verified at `a3fc0ac` and is now wrong for roughly a third of the rows: AM-26 was ratified on
> 22 Sep and AA-39…AA-43 shipped the K0 kernel, most of K1, and the highest-value K2 items. What is
> built, struck and held is recorded in `CLAUDE.md` §4; this file is kept as the reasoning behind
> each decision, not as a to-do list.
>
> **Struck from the plan (do not build):**
> - **#1, #2, #25, #30 — local in-browser OCR.** Superseded by the founder's 22 Sep instruction that
>   the product reads the seller's documents server-side ("we are not selling the vault, we are
>   selling solution"). Shipped as `/api/read-document` + `src/lib/documentChecks/`. Leaving these
>   rows live invites someone to add ~15 MB of Tesseract that duplicates the server.
> - **#90 — per-document cloud-extraction consent.** Contradicts the same instruction and the
>   blanket disclosure already shipped as AA-43.
> - **#48 — RAG on 10k approved POAs.** This file's own note says no lawful corpus exists. That is
>   Never, not Later.
> - **#92 — real 2026 reply-letter corpus, and #59's dependence on it.** Needs redacted,
>   permissioned letters from real sellers. The founder has no seller access (AM-26), so this is
>   unbuildable on current inputs, not merely deferred. Revive if appeal writers join.
> - **#8, #61, #63 — SP-API, Account Health cross-check, post-reinstatement monitoring.** D7, and
>   each needs API approval on a seller account in good standing. Formally out of v1.
> - **#66, #67, #68 — expert marketplace, social proof, affiliate/white-label.** Downstream of
>   having customers; business-model items, not product.
>
> **Held, with the trigger that revives each:**
> - **#74 Seller Challenge track** → a real case that qualifies. It is Account Health Assurance only
>   (AHR ≥250 for six months, Professional plan); a panicking deactivated seller rarely qualifies.
> - **#53 PDF output, #89 evidence versioning** → a real user hitting the need. Weight for unproven
>   demand until then.
> - **#38, #49, #19, #20, #44, #81** (SOP generator, word counts, task dependencies, coaching,
>   questions drawer) → **the first appeal-writer review.** These are precisely the things a
>   professional will tell us the right shape of; building them blind is guessing, and recruiting
>   that professional is the plan AM-26 exists to serve.
> - **#85 merged home** → after the first deploy, judged against a live product.
>
> **Next, in order:** deploy · #87 scam/not-Amazon track · #86 multi-issue notices · #91 "have you
> already replied?" · the legal-boundaries research that has been unowned since 19 Sep.
>
> **Retired from AM-21 rather than rebuilt:** the AI field-suggestion half of AA-33. Its endpoint
> returned a graded `low|medium|high|critical` severity — the exact thing #7 below rejects — and
> AA-39's `determineResponseType` plus `clock.ts` replaced it with something grounded in the
> notice's own words. Deleted 22 Sep.

**Columns.** *18 Sep* = the earlier decision (Keep / Adapt / Defer / Reject). *Code today* = grep-verified state at `a3fc0ac`: **E** exists, **P** partial, **N** none, with the file that proves it. *v2* = this pass's verdict: **Build** (as described), **Build-adapted** (need kept, mechanism changed for D6), **Later** (after pilot data), **Never** (with the replacement named). *Phase* = K0 kernel · K1 one journey + clock · K2 sensors · K3 pack + tracks · L later · — none. *Gap* = which §3 gap in the direction doc it belongs to.

## A. Understand — decoder as decision engine

| # | Feature | 18 Sep | Code today | v2 | Phase | Gap | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Multi-format intake (paste / forwarded email / PDF / screenshot / SP-API) | Adapt | P — paste only (`DecodeClient.tsx`); files go to the vault but are never read | Build paste + PDF + image; email-forwarding **Later**; SP-API **Later** (D7) | K2 | G4 | Local pdf.js/Tesseract.js worker; forwarding needs sender verification + malware handling first. |
| 2 | OCR for screenshots | Keep | N | Build (local, in-browser, Worker) | K2 | G4 | Uncertain regions highlighted; manual transcription always available. |
| 3 | Language detect + translate | Defer | N | Later | L | — | Detect early and say "US English only" (already in `routeWorkspace` for marketplace ≠ US). |
| 4 | 15+ violation labels | Adapt | P — 7 kinds (`src/core/index.ts`) | Build taxonomy v2: `PERFORMANCE_METRIC`, `VERIFICATION`, `RESTRICTED_PRODUCT`, `PRODUCT_SAFETY` (gated); split authenticity complaint from falsification allegation | K0 | G3 | Additive; severity gates unchanged or stronger. |
| 5 | Intent classifier (appeal / dispute / docs / acknowledge / info / ignore) | Keep | P — `routeWorkspace()` only after the seller types form instructions | **Build at decode time** with reasons + source sentence; abstain when unsure | K0 | G1 | The single highest-leverage item in the transcript. |
| 6 | Entity extractor (ASINs, case IDs, complainant, dates, policy links) | Keep | N — parser returns kinds + day-count only (`noticeParser.ts`) | Build with source spans + seller correction | K0 | G2 | Never invents an ID; regex first, bounded LLM extraction second. |
| 7 | Severity 1–5 + timeline estimate | Adapt | P — `isSeverityGated`, `expectationsCopy` | Build-adapted: concrete urgency + scope + reason for specialist; **no** numeric level, **no** timeline | K0 | G1 | Banned-numbers rule. |
| 8 | Account Health cross-check via API | Defer | N | Later (post-reinstatement monitoring spike only) | L | — | A5/A6 show a scoped read-only path; useless while deactivated. |
| 9 | Deadline calculator | Adapt | E — `deadlinesModel.ts`, carried on the case since 14 Sep | Build-adapted: add **provenance** (stated / seller-entered / unknown), timezone, "no deadline found" as honest state | K1 | G6 | Parser's any-"N days" over-match noted 18 Sep — anchor to the appeal clause. |
| 10 | Related-account risk detector | Adapt | P — regex kind hint | Build-adapted: recognise wording, route to factual relationship timeline (see #62) | K0 | G3 | Wording ≠ relationship. |
| 11 | Complaint-source identifier | Adapt | N | Build-adapted: record who the notice *names* (brand, rights owner, "customer report"); otherwise unknown | K0 | G2 | No inference of competitor abuse. |
| 12 | Evidence-requirement generator | Keep | E — matrix (`evidenceModel.ts`) + notice-sourced `proposedRequirements()` | Build: requirement *instances* = notice's own reactivation section ∪ reviewed matrix, with applicability + alternatives + source | K0 | G1 G2 | Replaces the universal list with the notice's list first. |
| 13 | BSA / policy RAG | Adapt | N | Later: small reviewed source registry with dates; no autonomous policy authoring | L | — | EF-5 quarterly re-check is the maintenance path. |
| 14 | Case memory ("Amazon stricter now") | Adapt | P — multi-case list + outcome recorded (19 Sep) | Build-adapted: show the seller's own prior cases/attempts on request; never infer a hidden penalty | K1 | G5 | |
| 15 | Fake-notice detector | Adapt | N | Build (basic, deterministic): sender/link heuristics, "verify inside Seller Central" card, `not_amazon` track | K0 | G1 | Cannot certify authenticity from pasted text. |
| 16 | Split multi-violation notices | Keep | N | Build: `issues[]` on Workspace v2; shared context, separate requirements | K0 | G1 G3 | Full mixed-protocol submissions Later. |
| 17 | One-line summary card | Keep | E — decode result + annotations | Build-adapted: the §2 "sentence 1" (alleged · asked · known · unresolved) | K0 | G1 | |
| 18 | Approval-odds estimator | **Reject** | N | **Never** → four-state requirement checks + unresolved list | — | — | See direction §4. |

## B. Fix — workbench, evidence, external drafts, coaching

| # | Feature | 18 Sep | Code today | v2 | Phase | Gap | Notes |
|---|---|---|---|---|---|---|---|
| 19 | Dynamic task builder | Keep | P — `generateActionItems()` by kind; workspace requirements by notice | Build: dependency-aware tasks from requirement instances; one next action, full plan expandable | K1 | G5 G7 | |
| 20 | Single-task focus | Adapt | P — classic interview does it; workspace shows all | Build: interview engine becomes the workspace's ask-surface | K1 | G5 | Keep the full plan one click away. |
| 21 | Lock POA until all green | Adapt | E — gap draft vs full draft, watermark (`readiness.ts`, `workspace.ts`) | Keep as is: block the *ready-to-submit claim*, never the work | — | — | Already correct. |
| 22 | "Why this matters" + cost of skipping | Keep | E — `whyAmazonWantsIt`, alternatives' `consequence` | Build-adapted: surface in workspace, source-backed, qualitative | K1 | G11 | |
| 23 | 20-second micro-videos | Defer | N | Later | L | — | Maintained text + screenshots first. |
| 24 | Timer + revenue-loss nudge | Adapt | P — reminder date stored (`CaseOutcome.tsx`), never delivered | **Build delivered reminders** (browser + opt-in email); **Never** invented $/day | K1 | G6 | |
| 25 | Invoice OCR | Keep | N | Build (local worker; fields with page/region + confidence-of-reading) | K2 | G4 | |
| 26 | 12 invoice checks, PDF-only, supplier blacklist | Adapt | N | Build-adapted: per-field 4-state checks vs the *notice's* requirements; images allowed (A2); **no** blacklist | K2 | G4 | |
| 27 | Invoice strength score | **Reject** | N | **Never** → per-field findings | — | — | |
| 28 | Invoice "fixer" (email to supplier) | Adapt | P — static template (`letters.ts`) | Build: letter pre-filled from real requirement gaps + ASINs; waiting state; version link | K1 | G7 | Never reconstructs or backdates a document. |
| 29 | Destruction-proof validator | Defer | N | Later, only inside a reviewed playbook | L | — | Metadata ≠ proof; disposal is not a generic cure. |
| 30 | Screenshot validator | Adapt | N | Build-adapted in K2: check readable date/context when a requirement asks for it | K2 | G4 | |
| 31 | Amazon-standard renaming | Adapt | N | Build in export pack as *our* naming convention with an original↔export map | K3 | G12 | |
| 32 | Evidence ZIP + index | Keep | N — `buildCaseExport()` exports notes only | Build: manifest + cover + text (+ optional PDF) | K3 | G12 | Form may need individual files — say so. |
| 33 | Duplicate file detector | Keep | P — content hashes stored per requirement/submission | Build: same-hash warning across uploads **and** across submissions (see #96) | K2 | G9 | |
| 34 | Invoice "expiry" countdown | Adapt | P — `freshnessDays` in matrix, critic freshness check | Build-adapted: evaluate the 365-day window relative to the *notice date*; no daily expiry theatre | K2 | G4 | |
| 35 | Supplier email agent | Keep | P — template, seller sends | Build (as #28) | K1 | G7 | Product never sends. |
| 36 | 3PL / removal-order agent | Defer | N | Later | L | — | Never from a classifier's say-so. |
| 37 | Buyer apology emails | Defer | N | Later, after messaging-policy review | L | — | |
| 38 | SOP generator | Adapt | N | Build narrow: steps + owner + frequency + adoption state (draft/adopted) | K1 | G8 | A PDF is not prevention; state tracks adoption. |
| 39 | Fake training log | **Reject** | N | **Never** → blank template + guided log of a real session | — | — | Fabricated evidence = fraud + permanent Amazon action. |
| 40 | Retraction-request agent | Adapt | E — `RIGHTS_OWNER_RETRACTION` template | Keep; pre-fill complaint ID/ASIN once #6 exists | K1 | G2 | No legal position asserted. |
| 41 | Compliance-officer title / org chart | Adapt | N | Later; only real responsibility, recorded | L | — | |
| 42 | "Lie detector" re-asks | Adapt | N | Build-adapted: **contradiction review** from the facts ledger — both sources shown, seller resolves | K2 | G8 | Neutral wording; a mismatch has innocent explanations. |
| 43 | Fear/loss calculator | **Reject** | N | **Never** → factual cost-of-inaction (limited attempts, lock risk) | — | — | |
| 44 | Coach ("+30% approval") | Adapt | P — `whyAmazonWantsIt`, step prompts | Build-adapted: contextual help per step + case-questions drawer; no percentages | K1 | G11 | |
| 45 | Skip modal with bad odds | **Reject** | E (decline-with-reason + alternatives exists in `interviewEngine.ts`) | **Never** the odds; keep and surface the alternatives flow | K1 | G5 | |

## C. Prove — response, submission, follow-through

| # | Feature | 18 Sep | Code today | v2 | Phase | Gap | Notes |
|---|---|---|---|---|---|---|---|
| 46 | Data injection from real facts | Keep | P — `composeWorkspace` uses saved wording + reviewed file refs; `composePoa` uses narrative + slots | Build: compose from **confirmed facts only** (ledger) via one composer path | K2 | G8 G5 | |
| 47 | Tone switcher | Adapt | E — `toneProfileFor()` | Keep; protocol-specific structure matters more | — | — | |
| 48 | RAG on 10k approved POAs | Defer | N | Later / likely never (no lawful corpus) | L | — | D9. |
| 49 | 800–1100 word limiter | Adapt | N | Build-adapted: counts shown; limits come from the captured form, not a universal number | K1 | G1 | |
| 50 | Fluff remover | Adapt | E — AA-31 critic rules (now actually running since `a3fc0ac`) | Keep; extend with unsupported-claim check from ledger | K2 | G8 | Apology not categorically banned; never forced in a dispute. |
| 51 | "Amazon bot" critic score | Adapt | E — critic returns findings, not a score | Keep findings; **Never** a bot score | — | — | |
| 52 | Evidence references inside the text | Keep | P — `filename, page N: note` lines | Build: references bound to artifact version + export name; recheck after replace/rename | K3 | G12 | |
| 53 | Text + PDF + index output | Keep | P — text; export notes | Build (with #32) | K3 | G12 | |
| 54 | Force edits to evade AI detection | **Reject** | N | **Never** → specificity prompts + ledger | — | — | |
| 55 | Day 3/7/14 escalation sequence | Adapt | P — `FOLLOWUP_NUDGE` template; ladder text | Build-adapted: seller-chosen reminder → follow-up draft; no automatic cadence | K1 | G6 | |
| 56 | Pre-submit checklist | Adapt | P — gaps list + attestation | Build: from protocol + captured form (attachments, fields, sizes as the seller reports them) | K1 | G1 | |
| 57 | One-click copy + pack download | Keep | P — copy exists | Build pack (K3); copy stays separate and labelled | K3 | G12 | |
| 58 | Submission / outcome tracker | Keep | E — attempts, receipts, outcome, archive (19 Sep) | Keep | — | — | |
| 59 | Reply-driven roadmap update | Keep | P — `applyWorkspaceReply()` resets the route; analyser 7 regex classes | Build **reply delta** (asked before / already attached / reopened / must differ) + real 2026 fixtures | K2 | G9 | |
| 60 | Outcome learning loop | Adapt | E schema + endpoint (`outcomeModel.ts`, `/api/outcome`); migration 0008 unapplied | Keep data path; analysis Later with denominators; human-reviewed rule changes only | L | — | |

## D. Business and continuity

| # | Feature | 18 Sep | Code today | v2 | Phase | Gap | Notes |
|---|---|---|---|---|---|---|---|
| 61 | Full SP-API | Defer | N | Later: one scoped read-only spike (ACCOUNT_STATUS_CHANGED, performance report) for *Guardian*, not v1 | L | — | D7. |
| 62 | Related-account scanner | **Reject** | N | **Never** → factual relationship timeline for specialist review | K0 | G3 | |
| 63 | Post-reinstatement monitor | Defer | N | Later (Guardian, D7) | L | — | |
| 64 | Invoice-coverage dashboard | Defer | N | Later | L | — | Completeness ≠ validity for a future request. |
| 65 | $99 / $299 / $799 tiers | Defer | E — per-case Pass | Keep per-case; define Pass scope (revisions/replies/duration) before K1 | — | — | Founder decision §7.5. |
| 66 | Expert marketplace | Defer | N | Later; Paddle AUP + contracts first | L | — | |
| 67 | Social proof / stats | Adapt | N | Only consented, denominated, after pilot | L | — | |
| 68 | Affiliate / white-label | Defer | N | Later | L | — | |
| 69 | Audit trail | Keep | E — `history[]`, immutable attempts | Keep; add actor/source on facts (ledger) | K2 | G8 | App activity proves recording, not real-world action. |
| 70 | TOS liability shield | Adapt | E — legal pages at parity (11 Sep) | Re-review wording once K0 changes what the product claims to decide | K0 | — | |

## E. Missing from the transcript entirely (this pass)

| # | Feature | Code today | v2 | Phase | Gap | Why it matters |
|---|---|---|---|---|---|---|
| 71 | **Track decision exposed on the decode page** (before any account) | N | Build | K0 | G1 | The "recognise" step; the free hook that proves competence before asking for money. |
| 72 | **Optional form screenshot as a second input** to the track decision | N | Build | K0 | G1 | Notice text alone is often ambiguous; the Account Health form is the ground truth (A1). |
| 73 | **VERIFICATION track** (INFORM 10-day, identity, video call) with zero-LLM prep checklist | N — routes to "clarification" | Build | K0/K3 | G3 G10 | Research R4/R5: high-volume 2026 class, unsupported today. |
| 74 | **Seller Challenge track** (3 per 180 d, exhausted-appeals gate) | P — phrase detected only | Build | K3 | G10 | R3. |
| 75 | **`PERFORMANCE_METRIC` family** (ODR/LSR/VTR) with a metrics-shaped POA | N — inside `POLICY` | Build | K0 | G3 | R8. |
| 76 | **Facts ledger with provenance** | N | Build | K2 | G8 | Makes "no invented claims" mechanical. |
| 77 | **Duplicate-submission guard** (text + attachment hashes vs last attempt) | P — hashes exist | Build | K2 | G9 | R7: best-evidenced rejection cause; tiny to build. |
| 78 | **Delivered reminders** (browser Notifications; opt-in email for account holders) | N | Build | K1 | G6 | Nothing speaks first today. |
| 79 | **"Since you were here" brief** on return | N | Build | K1 | G6 | The agency-call feeling without AI. |
| 80 | **Waiting-for-third-party state** with follow-up date, nudge, version link | P — `waiting` status only | Build | K1 | G7 | Where agency hours actually go. |
| 81 | **Case-questions drawer** (zero-LLM FAQ by kind + state; spec 05 §4.3) | N | Build | K1 | G11 | Self-talking without a chatbot. |
| 82 | **Deadline provenance** (stated / entered / unknown) + timezone | P | Build | K1 | G6 | Honest timers. |
| 83 | **Retire the classic interview for new cases**; engine becomes the workspace's ask-surface | — | Build | K1 | G5 | Root of the "two products" feeling. |
| 84 | **Single composer path** (deterministic assembly → optional LLM phrasing → critic) | Two paths | Build | K1/K2 | G5 | |
| 85 | **Merged home** (Cases → case; dashboard duplication removed) | Two homes | Build | K1 | G5 | |
| 86 | **Multi-issue notices** (`issues[]`) | N | Build | K0 | G1 | Shared context, separate requirements. |
| 87 | **`not_amazon` / scam-suspect track** with "verify in Seller Central" card | N | Build | K0 | G1 | Panic-hour protection; scam market is active (2026 investigation). |
| 88 | **Requirement instances** (notice-sourced ∪ matrix; applicability, alternatives, source, review date) | P | Build | K0 | G1 | Replaces universal lists. |
| 89 | **Evidence versioning** (new file supersedes old; both kept; references re-checked) | P — hash + page | Build | K2 | G4 G7 | |
| 90 | **Cloud-extraction consent step** (explicit, per document, after local read) | N | Build (opt-in only) | K2 | G4 | T2 terms; local first. |
| 91 | **Attempt counter + "have you already replied?" intake** | P — `attemptCount` | Build | K0 | G9 | Stops a burned first attempt from being invisible to the plan. |
| 92 | **Real 2026 reply-letter fixture corpus** (redacted, permissioned) | Synthetic only | Build | K2 | G9 | Analyser quality is bounded by this. |
| 93 | **Extension-ready core** (all new modules pure TS) | Already the house rule | Keep | — | — | D3 extension later; nothing here blocks it. |
| 94 | **Dossier/risk updates**: Seller Assistant guides appeals; AppealsHub back online | — | Founder edit (gated) | — | — | R1, R10. |
| 95 | **Back-fill AM-23/24/25** into the amendments file; log v2 as AM-26 | — | Founder edit (gated) | — | — | Direction §7.6. |
| 96 | **Playbook reviewer** named for every supported track before pilot | — | Founder / consultant (B-16) | Pilot gate | — | Unchanged from 18 Sep strategy; nothing in v2 removes the need. |

## Tallies

- Transcript items: **Build / Build-adapted 41 · Keep-as-is 8 · Later 14 · Never 7** (the same 7 as 18 Sep, each with a replacement).
- Additions: **26**, of which 20 are code and 6 are founder/edit-gated paperwork.
- Items that need *no* AI at all: 73, 74, 77, 78, 79, 80, 81, 82, 87, 91 — ten of the highest-value rows. The OS feeling is mostly deterministic.
