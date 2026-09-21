# Phase 3: the journey, and what to build for it

Checked: 21 September 2026. Repository: `52cf0cf`. Status: Phase 3 complete within its agreed scope. Design and source inspection only. No implementation, no runtime validation, no new external research beyond reuse of the saved files.

## Founder decisions this phase was built on

Both were taken in chat on 21 September 2026, after Phase 2 flagged them:

1. **Map all three entry points**, not one lead customer. Phase 2 recommended narrowing; the founder chose breadth. This phase makes that affordable by designing **one case spine with three doors**, not three products — see §2. The cost of the choice is recorded honestly in §8.
2. **IP, trademark, copyright and related-account cases get an evidence-and-outreach lane, with no dispute drafting.** They stop being routed straight to "professional review." D6 is untouched: forged documents, fraud and child safety remain never-sold and always routed out.

## Plain-language result

The journey a suspended seller actually walks has ten stages, and the app already covers six of them well. The work is not a rebuild. It is four things:

- **One spine, three doors.** The panic-hour seller, the document-request seller and the already-rejected seller all need the same case record. They differ only in which screen they land on first and what it asks. Building three doors onto one spine also retires the "two products" problem for free, because the old interview becomes Door A rather than a second system.
- **The weakest stage is the one nobody designed: waiting.** It lasts weeks. Today it is a date field with a label admitting no reminder is sent. It is also where the seller is idle — and where, on a local-first product, their case can be silently deleted by the browser.
- **The single most urgent finding is a data-loss risk.** The vault is IndexedDB via Dexie, and nothing in `src/` ever calls `navigator.storage.persist()`. Safari evicts script storage after seven days without interaction; other browsers evict under pressure. The one stage where a seller does not touch the app for weeks is exactly the stage that can destroy their case file. This is a small fix and it should not wait for a build phase.
- **The lead differentiator is half-built.** For the already-rejected seller, the app stores the previous request, the previous submission text and its attachment hashes — but never compares them. There is a novelty *warning* keyed to attempt count, not an actual comparison. The infrastructure is there; the feature is not.

On technology: keep deterministic rules as the floor, add local document reading as an assist that never auto-confirms anything, keep cloud drafting behind its existing founder gate, and leave SP-API deferred — the one thing nobody has established is whether a deactivated seller can authorize it at all, which is precisely our buyer.

## Method and limits

Reused the Phase 1 and Phase 2 findings, the saved OCR/technology research, and the saved agency and analog-product research. Inspected `workspace.ts` (types, `routeWorkspace`, `workspaceGaps`), `caseEvidence.ts`, `CaseOutcome.tsx`, `responseAnalyzer.ts`, `caseState.ts`, and the vault `db.ts` layer directly.

This phase did **not** run the app, measure OCR accuracy on real notices, benchmark bundle size, test browser eviction behaviour, or validate any capability with a user. Acceptance criteria below are written to be testable; none of them has been tested. Effort labels are rough and relative, not estimates.

---

## 1. The journey: ten stages

"Exists" is a source finding at this commit, not proof of live behaviour.

| # | Stage | What the seller is doing | Exists today | Where it breaks |
|---|---|---|---|---|
| 1 | **Arrive** | Panicking, searching, pasting | Decode page, free, no account | One door only; the other two situations have no entry of their own |
| 2 | **Understand** | Working out what was actually alleged | `parseNotice` classifies, flags windows; decode API suppresses due dates when the receipt date is unconfirmed | Returns no response protocol; no ASIN or case ID extracted |
| 3 | **Confirm the request** | Reading the current response page, telling us what it asks | `routeWorkspace` proposes a protocol from notice + form text; seller confirms | `clarification` is a dead end: it explains why it cannot route, then stops |
| 4 | **Assemble evidence** | Finding invoices, reports, letters | Requirements proposed from the request's own words with `sourceQuote` anchoring; review with page refs, notes, hashes; deleting a file reopens its requirement | Every document read by hand; no conflict detection across documents |
| 5 | **Write the narrative** | Root cause, what was fixed, what prevents it | Composer uses the seller's real text; `gapReason` distinguishes evidence gaps from narrative gaps; critic rules flag future tense, blame-shifting, vague time, stale documents, unreferenced evidence | Placeholder-free but rules-only; no preventive-measures help beyond the one optional step |
| 6 | **Check before sending** | Last look | `workspaceGaps` blocks on unconfirmed route, unreviewed requirements, broken source quotes, thin explanation; `noveltyRequired(attempt)` warns from attempt N | The novelty warning is a count, not a comparison — it cannot tell the seller *what* is unchanged |
| 7 | **Submit** | Pasting into Seller Central themselves | Submission recorded: text, receipt, revision, attachment hashes | Read-only by design; correct and non-negotiable |
| 8 | **Wait** | Nothing, for weeks | A reminder date field that says AppealDeck does not send it | **The weakest stage.** No delivery, no "what to do / not do", and the vault can be evicted while the seller is away (§5) |
| 9 | **Read the reply** | Decoding a rejection | `analyzeReply` categorises into reinstated, final decision, identity verification, document request, needs more information, funds decision, unrecognized, with `extractedAsks`; a new request becomes a revision, the old one is kept in `previousRequests` | The new request is captured but never set against the old one; the seller re-enters the loop blind |
| 10 | **Close** | Outcome, archive, keep the record | Outcome state, archive action, opt-in outcome schema, detailed text export | Export is notes, not an evidence package; outcome table has no rows because migration `0008` is unapplied |

**Where the value concentrates:** stages 4, 6 and 9. Those are the three places where a case record beats a chat window, and all three are partly built.

---

## 2. One spine, three doors

The three situations converge by stage 4. They differ only in entry stage and first question.

| Door | Who | Enters at | First screen asks | Then joins the spine at |
|---|---|---|---|---|
| **A — New notice** | Panic hour, first response | 2 | "Paste the notice." | 3 (confirm the request) |
| **B — Document request** | Told to produce invoices/reports/LOA | 3 | "Paste what the response page asks for." Skips root-cause narrative entirely | 4 (assemble evidence) |
| **C — Rejected already** | Submitted once, got a template back | 9 | "Paste what Amazon sent back, and what you sent last time." | 3, carrying the previous attempt |

Three consequences worth stating:

- **Door B must not ask for a Plan of Action.** The documented instant-rejection cause is submitting prose when records were demanded. The router already distinguishes `documents` from `operational`; the entry screen should too, rather than funnelling everyone through a POA-shaped interview.
- **Door C is the only door that starts with Amazon's words rather than the seller's.** `analyzeReply` already exists to read them. This is the cheapest door to build and the one no competitor and no Amazon tool serves.
- **The legacy interview becomes Door A.** Phase 1 found the "two separate products" claim overstated but the two UI paths real. Framing the interview as one door onto the shared spine resolves it by design instead of by deletion, and removes the need to decide whether to rip anything out.

---

## 3. The IP and related-account lane

Per the founder's decision. These cases stop short-circuiting to `specialist` and get a lane that does the useful, safe work:

| Do | Do not |
|---|---|
| Record the complaint, the rights owner, ASINs, and the stated basis | Draft a dispute or argue the merits of the claim |
| Track the deadline and the current response page | Advise on whether the claim is valid |
| Organise evidence: invoices, authorization letters, supply-chain records | Certify that any document is authentic |
| Prepare **outreach to the rights owner** requesting retraction, since a retraction only travels from the rights owner to Amazon directly | Contact anyone on the seller's behalf |
| Offer the professional-help route as a visible, unpressured option | Imply the seller does not need a lawyer |
| For related-account: help identify the stated link, evidence of separate operation, and evidence the link is removed | Assert the accounts are unrelated |

**Guardrail that must survive implementation:** `professionalReviewRequired`, once set by a confirmed earlier request, still forces `specialist` and a later reply must not clear it. That behaviour exists today and this lane must not weaken it. D6's three categories stay out entirely.

---

## 4. The hard cases

| Situation | Designed behaviour | Why |
|---|---|---|
| **Uncertain routing** | `clarification` stops being terminal. It states what is missing, offers the one action that would resolve it, and lets the seller proceed with the route marked unconfirmed rather than blocking | Today it explains and stops. A seller in panic reads that as the product refusing to help |
| **Missing facts** | Never invent, never infer a date. Show extracted / seller-confirmed / still unknown as three visible states | Matches the decode API already suppressing unconfirmed due dates |
| **Conflicting documents** | Flag disagreements across linked evidence — dates, quantities, supplier names — as a question to the seller, never as a verdict | "Ease of checking is not proof of authenticity" (Phase 1). A conflict the seller can see is worth more than a score |
| **Stale evidence** | Already handled: deleting or replacing a file reopens its requirement | Keep. This is the integrity behaviour most tools lack |
| **Recovery** | The case survives the wait: persisted storage, a visible last-saved state, and an export the seller can re-import | See §5 — currently the largest structural risk |
| **Human handoff** | Every lane can reach professional help. Severity-gated cases are routed there and never sold a Pass | D6 |
| **Losing** | Closure has to work when the answer is no: record the outcome, keep the file, offer the next legitimate step, do not upsell | Phase 2 Q5 — recommendation after a loss depends entirely on this stage |

---

## 5. Cross-cutting, and the one urgent item

**Storage persistence — urgent.** The vault is Dexie over IndexedDB (`src/core/vault/db.ts`). No call to `navigator.storage.persist()` exists anywhere in `src/`. The saved technology research records that Safari evicts script storage after seven days without interaction; other engines evict under pressure. Stage 8 routinely lasts longer than seven days and involves no interaction by definition. A seller can therefore return to find the case gone, through no fault of their own, at the worst possible moment — and the product's own promise is that there is no server copy. Request persistence, show whether it was granted, and tell the seller plainly what to do if it was not. This is small, and it should not wait.

**Privacy.** Local-first is the differentiator (Phase 2), so any document leaving the device must be a per-document, explicit, revocable choice with the destination named — never a global setting, never a default. Anything that trains on inputs is disqualified outright.

**Mobile.** Per EP-3 the web flow is the only path for mobile-only sellers, and the panic arrives on a phone. Stages 1–3 and 8–9 must work on a phone. Stage 4 (uploading supplier invoices) realistically will not, and should say so rather than fail quietly.

**Accessibility.** The existing WCAG 2.2 AA and Lighthouse gates apply to every new surface, including the three entry screens. New states introduced here — unconfirmed route, conflict flag, persistence warning — are status messages and need to be announced, not merely coloured.

---

## 6. Technology comparison

| Approach | Feasibility | Cost | Privacy | Fails when | Verdict |
|---|---|---|---|---|---|
| **Deterministic rules** (today) | Proven, shipped | $0 marginal | Perfect | Text is unstructured or absent | **Keep as the floor.** Everything else degrades back to this |
| **Local document reading** | pdf.js text layer first — most supplier invoices are digital PDFs and need no OCR. For scans: `ppu-paddle-ocr` (MIT, PP-OCRv6 tiny, ~6 MB, WebGPU with WASM fallback) returns **boxes and confidence**; Tesseract.js v7 is ~15 MB and returns raw text only | $0 marginal; one-time download | Perfect — never leaves the device | Tilted scans (saved research records ~31% accuracy at 3–5°) and handwriting | **Add, assistive only.** Prefer PaddleOCR *because* boxes and confidence let the seller see where a value came from. Must never auto-mark a requirement reviewed |
| **Optional cloud help** | Gemini paid tier already integrated; native PDF text, not used for training, ~$0.02/case under D9 | Small but spiky during suspension waves; D9 already mandates a ceiling and breaker | Requires the document to leave the device | The seller has not explicitly consented for that document | **Keep gated.** Per-document opt-in only. Cloud OCR alternatives at ~$10/1,000 pages are worse: one may use inputs for improvement absent an org opt-out, which disqualifies it |
| **Integrations (SP-API)** | Partly verified: the Seller Performance report needs the Selling Partner Insights role; notifications report status transitions | Large build, ongoing maintenance | Requires OAuth handover — directly contradicts the local-first position | **Unknown whether a deactivated seller can authorize at all** | **Defer (D7).** The unknown is fatal for our exact buyer; resolve it with a bounded test before any build |

---

## 7. Capability table

Ordered by value against evidence strength. Effort is relative. Every row states the need it serves, what happens when it fails, and how you would know it works.

### Reuse — already right, do not touch

| Capability | Need served | Acceptance criterion |
|---|---|---|
| Request-anchored requirements (`sourceQuote`) | Seller must see the request came from Amazon's words, not ours | Every requirement still resolves to a substring of the notice or form; `workspaceGaps` flags it when it does not |
| Evidence integrity on delete/replace | A case must not silently claim evidence it no longer has | Deleting a linked file reopens its requirement; covered by existing tests |
| Submission recording with hashes | Stage 9 and stage 10 are impossible without it | Text, receipt, revision, attachment hashes retained per submission |
| Reply categorisation | Door C's entry point | Six categories plus `extractedAsks`; unmatched text returns `unrecognized` rather than guessing |
| Composer critic rules | Documented rejection causes | All findings remain warnings; none becomes a hard block |
| Severity gating and `professionalReviewRequired` stickiness | D6 | A later reply cannot clear the flag |
| Read-only submission | D6, Agent Policy | No code path submits to Amazon |

### Improve — infrastructure exists, the feature does not

| # | Capability | Need | Fallback | Acceptance criterion | Effort |
|---|---|---|---|---|---|
| I1 | **Prior-submission comparison** | Door C's whole reason to exist; burning an attempt on an unchanged appeal is a documented harm | If the previous text is missing, show the attempt-count warning that exists today | Given a stored previous submission, the seller is shown what is unchanged and what is new **before** submitting; no approval language anywhere in the output | M |
| I2 | **Attempt ledger** | One readable view of asked → sent → returned, per revision | Renders from whatever revisions exist, including one | Every revision shows its request, its submission and its reply, in order, on one screen | S |
| I3 | **Clarification gets an exit** | Today's dead end reads as refusal | Keeps the current explanation | Every `clarification` result names one concrete next action and allows proceeding with the route marked unconfirmed | S |
| I4 | **Decode returns a suggested protocol** | Stage 2 currently hands off nothing to stage 3 | Omits the suggestion when confidence is low, as it already does for due dates | Decode output carries a suggested protocol with its basis, or explicitly none; the seller still confirms | M |
| I5 | **ASIN / case-ID extraction** | Identifies the case; long-standing AA-31 remainder | Manual entry, as today | Identifiers extracted where present; never fabricated; seller can correct | S |
| I6 | **Evidence package export** | Phase 1: export is notes, not a package. The agency norm is an indexed exhibit set | Existing text export stays | Export produces an indexed set of the actual linked files plus the case record; index entries map to requirements | M |
| I7 | **Honest waiting stage** | Stage 8 is the weakest and the longest | Keeps the stored date | The wait screen states the deadline, what to do, what not to do, and — until delivery exists — says plainly that the seller must return themselves | S |

### Add — new, each serving a need established in Phases 1–2

| # | Capability | Need | Fallback | Acceptance criterion | Effort |
|---|---|---|---|---|---|
| A1 | **Storage persistence + honest state** | §5. Silent case loss during the wait | If persistence is refused, warn and prompt an export | `navigator.storage.persist()` is requested; the granted/denied state is visible; denial produces a warning and an export route | **S — do this first** |
| A2 | **Three entry doors on one spine** | The founder's decision; Door B must not demand a POA | Any door can fall back to Door A | Each door lands on its own first screen and joins the shared case; Door B never requests root-cause narrative | M |
| A3 | **IP / related-account lane** | §3 | Professional review stays one click away throughout | These notices no longer route to `specialist` by default; the lane offers evidence, deadline and outreach, and never drafts a dispute; D6 categories still route out | M |
| A4 | **Rights-owner outreach letter** | A retraction only travels from the rights owner | Plain template if no details were extracted | Produces a letter the seller sends themselves; no claim about the dispute's merits; nothing is sent by us | S |
| A5 | **Local document reading, assistive** | Stage 4 is entirely manual | pdf.js text layer first; if OCR is unavailable or low-confidence, the seller reads it as today | Extracted values appear as suggestions with confidence and location; no requirement is ever auto-marked reviewed | L |
| A6 | **Conflict flags across evidence** | Contradictions the seller cannot see are the expensive kind | Silent when nothing conflicts — flags, never filler | Disagreeing dates, quantities or supplier names across linked evidence raise a question; no verdict, no score | M |

### Defer — with the condition that would reopen each

| Capability | Why deferred | Reopens when |
|---|---|---|
| Reminder delivery | Needs consent, scheduling, privacy and failure handling; the cron currently runs purchase emails only | A7 has shipped and sellers ask for it |
| Cloud-drafted prose | Founder-gated Task 4 | The founder says so in chat |
| SP-API | D7, plus the unresolved deactivated-seller authorization question | A bounded feasibility test resolves it |
| Mobile vault parity / PWA | EP-3 P2 triggers | Mobile ≥30% of sessions and mobile conversion ≥50% of desktop |
| Non-US marketplaces | Router supports US only | After the US journey is validated |

### Reject — and keep rejecting

Approval prediction or success scoring · document authenticity certification · auto-submission or autonomous Seller Central access · simulating Amazon's internal reviewer · any success-rate claim without opt-in outcome data. Each was already refused by D6, D7 or the Phase 1 evidence; none is reopened here.

---

## 8. What this does not solve

- **The founder chose breadth over a lead customer.** The spine makes that buildable, but Phase 2's finding stands: three doors means three stories to tell, and the panic-hour door (A) is the most contested ground in the market. Nothing here makes that competition easier — it only makes the build cheaper.
- **The commercial assumption is untouched.** No observed evidence exists that anyone pays a one-time per-case fee for self-serve appeal software. Every capability above could ship and that would still be true. It needs a pilot.
- **The two stale reference facts from Phase 2 are still unfixed** — the withdrawn AppealsPro win rate and the "Amelia does not write appeals" claim. Both would produce false copy today.
- **Migration `0008` is still unapplied**, so no outcome row can ever be written, so the "win rates only from opt-in data" promise cannot begin accumulating data.
- **Nothing here has been tested.** Every acceptance criterion is a proposal.

## 9. Five questions for Phase 4

1. Does A1 (storage persistence) ship immediately as a standalone fix rather than waiting for a build phase? It is small, it prevents silent data loss, and it is currently a live risk.
2. What is the first shippable slice — the Door C + I1 + I2 bundle (the differentiator, mostly built) or the A2 three-door restructure (broader, more visible, more work)?
3. Is A5 (local document reading) worth its download cost and accuracy cliff before any evidence that sellers want it, or does it wait behind the pilot?
4. What does one Appeal Pass cover across revisions — Phase 2's unanswered question, now sharper, because the journey explicitly loops through stage 9 more than once?
5. What is the pilot: how many sellers, at what price, measuring what, and what result would stop the project rather than continue it?

Phase 4 is not started. It should rank this table against cost and evidence strength, define the pilot and its stop criteria, and produce a backlog — not begin implementation.
