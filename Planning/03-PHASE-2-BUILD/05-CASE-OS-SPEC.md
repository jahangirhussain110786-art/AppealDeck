# 05-CASE-OS-SPEC — case state machine, objection-aware actions, response analyzer, and the guided Case Copilot

**Why this file exists / when to use it.** Founder direction (2 Sep 2026): AppealDeck must be *"truly an OS for sellers, not just a writing tool — it should ask for relevant documents, ask the seller to take actions, and when a seller won't take an action, hear the concern and offer alternatives."* AM-16 already built the evidence half of that (matrix, checklist, attestation, readiness, gap draft). This file specs the remaining half — the **case lifecycle**: a deterministic state machine that always knows *what to do right now*, an action model that handles refusal with honest alternatives instead of a dead end, a response analyzer that turns Amazon's replies into the next round's plan, and a **guided interview loop** over all of it — the founder's chat request rebuilt as a finite step flow after the second-pass direction (2 Sep 2026): *"not a 24/7 chat window everyone will use like a general AI tool — a subsequent conversation system: our OS asks, the seller submits or denies with reason, our OS analyzes and gives the next response window, until everything is clear, then generates the factually-grounded POA. Capped to our services, strictly and professionally."* Actioned as amendment **AM-17** in `02-BUILD-PLAN-AMENDMENTS.md` (checkboxes live there; spec lives here — same split as AM-16/`04-EVIDENCE-FIRST-HARDENING.md`).

**The architectural rule that keeps this from becoming junk:** the conversation is an *interface*; the case file is the *product*. Every suggestion the system makes is produced by the deterministic engine (state machine + matrix + guidance corpus); the LLM only translates between the seller's words and structured case fields. A free-form chatbot that improvises advice is exactly the GPT-wrapper failure mode documented in `04-EVIDENCE-FIRST-HARDENING.md` §2 — we do not build one.

**Terms:** Interview = the guided step-flow surface (§4; retired name: "Case Copilot" — chat-flavored naming invites chat behavior). Engine = the deterministic core (state machine, matrix, questionnaire, readiness). Step = one engine ask + one seller submission. Novelty = material change (new evidence, changed root-cause framing) between appeal attempts (AM-03).

---

## 1. Case state machine (`src/core/caseState.ts`)

Today the case lifecycle is implicit across modules (decode → intake → draft → deadlines → vault). Make it explicit — the OS's home-screen question is *"what should I do right now?"*, and every state answers it.

```
DECODED ──► GATED_PRO_HELP            (severity-gated kinds: terminal state for self-serve)
DECODED ──► INTAKE ──► REMEDIATION ──► READY ──► SUBMITTED(n) ──► AWAITING
AWAITING ──► APPROVED ──► CLOSED(outcome captured, post-win checklist P1)
AWAITING ──► REJECTED ──► REVISION(novelty required) ──► READY (attempt n+1)
AWAITING ──► NO_RESPONSE(t) ──► FOLLOW_UP ──► AWAITING | ESCALATION(stage k)
ESCALATION(k) ──► SUBMITTED / AWAITING (per §7.3.5 ladder; stage 5 renders "consult a professional")
FUNDS_TRACK: parallel sub-state whenever a funds hold is detected
             (locked until funds_appeal_eligible at +60d ──► FUNDS_READY ──► FUNDS_SUBMITTED ──► …)
```

- Transitions are **event-driven and deterministic**: decode completes; intake finishes; readiness crosses the kind's required-complete threshold; the seller marks "I submitted" (timeline event); the seller pastes Amazon's reply (feeds §3); a deadline fires. No LLM in transition logic.
- Every state exposes `{nextBestActions[], availableDocTypes[], expectations}` — `expectations` uses qualitative, claims-gate-safe copy only ("typical, not guaranteed"; never hours/percentages — banned-numbers rule).
- `REVISION` enforces the AM-03 novelty rule structurally: "mark as submitted" on attempt 2+ requires a readiness delta or a changed root-cause/evidence framing acknowledged by the critic — near-identical resubmission is the documented path to a permanent "no further consideration" lock, and burning attempts is the #1 self-inflicted harm in the 2 Sep forum evidence.
- Severity-gated kinds short-circuit to `GATED_PRO_HELP` before any workflow — the Copilot must not become a side door around the D6 gate.
- UI consequence (web app first, M-W): the case view leads with the current state + next best actions; tabs (Notice/Intake/POA/Evidence/Timeline/Escalation) hang off it. The dashboard's per-case card shows state + next deadline.

## 2. Objection-aware action model (extends AM-16's `ActionItem`)

The founder's scenario: the checklist says *"obtain a compliant supplier invoice"* and the seller says *"I can't"* or *"I won't."* Today that's a silent skip. Agencies earn their fee at exactly this moment — by translating refusal into an informed choice. The D6-compatible version:

```ts
interface ActionAlternative {
  id: string;
  label: string;             // "Switch narrative to sourcing change + inventory disposal"
  honestyNote: string;       // what this alternative honestly claims and does NOT claim
  consequence: string;       // qualitative, matrix-sourced ("Amazon commonly re-asks for the invoice")
  readinessImpact: 'none' | 'reduced' | 'path_change';
}
// ActionItem gains:
//   declined?: { reason: string; at: string }
//   alternatives: ActionAlternative[]        // predefined per kind+action, from the matrix data
```

Rules:
- Every declinable action carries **predefined** alternatives authored with the retained consultant (B-16 scope — this content is where expert review matters most). The LLM *selects and phrases*; it never invents an alternative.
- One alternative is always **"decline and proceed"** with its honest consequence — seller agency is the product's spine (read-only, seller in control). The consequence copy is drawn from the matrix's `whyAmazonWantsIt` and the §1.1 evidence (e.g., invoices-missing → instant-reject cluster), stated qualitatively, never as invented odds.
- A declined action behaves like a skipped intake answer downstream: the composer **never claims it**; readiness reflects it; the gap draft names it. Declining with an adopted alternative re-routes the plan (e.g., inauthentic without an obtainable invoice → disposal/closure narrative + sourcing change + a POA that honestly says what was done instead).
- Hard floor unchanged: any "alternative" that amounts to fabricating evidence is refused with the severity warning (forged-docs gate). "I can't get an invoice" never yields "make one look right."
- Persuasion ethics: the system may present cost-of-inaction **honestly** (the agencies' "fear + logic" minus the invention) — matrix-sourced consequences, the burned-attempt warning, the scam-market warning — and then respect the choice.

## 3. Response analyzer (`src/core/responseAnalyzer.ts`) — promote rejection analysis from P1 to v1

The median real case is multi-round; an OS that goes silent after draft #1 is a writing tool. v1.0 M6 already plans the "Amazon replied" paste box with rejection analysis deferred to P1 — promote the analyzer to v1, deterministic-first:

- Input: pasted Amazon reply. Output: `{category, extractedAsks[], stateTransition, planUpdates[]}`.
- Categories (rule patterns first — these letters are formulaic; LLM assist only when ambiguous, per the M3 two-stage pattern):
  `needs_more_information` ("we do not have enough information") → re-run gap analysis; surface which matrix items are still open.
  `document_request` (specific docs named) → map each named doc to an `EvidenceKind`; open/raise the matching action items.
  `identity_verification` → verification checklist path (INFORM-adjacent; taxonomy-v2 candidate noted in `04-…` §1.1).
  `final_decision_negative` ("this decision is final" / "no further consideration") → `ESCALATION` advance + honest copy that self-serve odds are now poor + pro-help pointer.
  `reinstated` → `APPROVED`; opt-in outcome capture (EF-5); post-win hardening checklist (P1 content; the eventual Guardian seed — D7 untouched).
  `funds_decision` variants → funds track update.
  `unrecognized` → manual tag; never guess to the user (M3 confidence rule applies).
- **Fixture corpus extension (B-03):** ≥2 synthetic Amazon-reply fixtures per category, including one adversarial (a rejection quoting the seller's own template language back).
- Acceptance: each reply fixture produces the correct category, state transition, and at least one concrete plan update without LLM assistance for the unambiguous set.

## 4. The Guided Interview — the "chat" rebuilt as a finite step flow (founder hardening, 2 Sep 2026)

**Founder concern (second pass):** a 24/7 chat window reads as free AI chat — people will use it like a general assistant and burn cloud tokens for zero benefit. Correct. The fix is **structural, not policing**: rate-limiting an open chatbot is defense; not building a chatbot is design. The surface is exactly the founder's "subsequent conversation system": the OS asks → the seller submits, or declines with a reason → the engine analyzes → the next response window renders → until the case file is complete → the composer runs on the factually gained data.

### 4.1 Abuse-proof by construction — seven properties that make general chatting impossible

1. **No persistent input box.** There is no always-on text field anywhere. Each step renders its own **typed** input: buttons/chips for enums, file upload for evidence slots, date/number fields, and a bounded short-text field ONLY where a narrative is genuinely required (root-cause account, decline reason). No blinking cursor = nobody "talks" to it. This one UI decision kills the "it's an AI chat" perception.
2. **The engine owns the agenda.** Every step is engine-chosen (state machine + matrix + M4 question sets). The seller's options at any step: answer · decline-with-reason · "why do you need this?" (renders the matrix's `whyAmazonWantsIt` card — zero LLM) · go back. There is no way to change the subject, because there is no subject input.
3. **Deterministic-first step routing.** Every submission hits rules first (validation, enums, regex). The LLM is invoked ONLY when a bounded free-text field needs extraction into structured fields. Expected effect: the large majority of steps complete with zero cloud calls (measure at B-19; the expectation is never published as a number).
4. **No chat endpoint exists.** The backend exposes only purpose-built routes — `decode`, `extract-field`, `compose`, `critique`, `analyze-reply` — each with a fixed input cap and schema-constrained output (zod, per the M3 stage-2 pattern). There is no `/chat` route to abuse; this also shrinks the prompt-injection surface to five known shapes.
5. **Per-case LLM budget, metered server-side.** Cloud calls are charged against the **case key** (the M11 `passCases` entitlement), not the session: a fixed per-case call budget (set from B-19 measured cost; ceiling in the cents-per-case range per AM-07's estimate — measured, not guessed), with a typed "budget reached — continuing with forms + rules" degradation. The free tier holds no case key and can reach exactly one route: `decode`. AM-12's per-device/IP limits and daily spend cap remain the outer wall.
6. **Notice-likeness prefilter.** Before ANY cloud call, a deterministic heuristic (Amazon-notice markers, ASIN/Order-ID density, length bounds) screens pasted text. Junk paste gets "this doesn't look like an Amazon notice" at zero cost — the free decoder cannot be farmed as a general summarizer.
7. **Finite sessions with a finish line.** An interview ends (required-complete → draft) and shows progress ("Step 4 of ~9 · 2 evidence items pending") — a process, not a companion. Off-topic free text gets one fixed response — "That doesn't answer this step; here's what's needed and why" — and the step re-renders. The system never banters, because bantering isn't a state.

### 4.2 The loop (v1, ships with M-W)

- **ASK:** the engine renders the step — intake question, evidence ask (matrix), action check (§2), or status explanation (state machine) — with typed inputs plus "I can't or won't do this."
- **ANSWER / DECLINE:** declining opens reason categories (+ optional bounded text); categories map straight to §2's predefined alternatives — routing usually needs zero LLM.
- **ANALYZE:** rules validate; a bounded free-text field gets ONE extraction call (capped input, schema output, ≤1 retry) landing in structured case fields only.
- **NEXT:** state machine + readiness choose the following step; the loop ends at required-complete → gap draft or full draft per AM-16.
- The LLM's only jobs remain: **extract** fields, **phrase** the engine's chosen content plainly, **select** among predefined alternatives. Per-step output filters (M5.5 family): no "guarantee", no probabilities, no time promises, severity screen (fabrication or gated-kind requests → refusal + professional-help route). Notice text, Amazon replies, and seller text are **untrusted input** (prompt-injection posture — add to `03-TECHNICAL-RISK-CONTROLS.md` at implementation).
- The step log is stored encrypted in the vault for the seller's reference but is **never** a composer source — only extracted structured fields are (fact-locking preserved).
- **Parity + floor:** the same steps render as a classic form page; with cloud declined, capped, or down, short-text answers are kept verbatim in the case file (marked unparsed) and everything else works. The interview IS the wizard — one engine, two renderings — so "AI down" never means "product down".
- Free/paid seam matches M11 exactly: free = decode + triage card + the first 3 intake steps; everything after = Appeal Pass. Interview extraction calls join the B-19 load test so budgets come from measured cost.

### 4.3 Case-questions drawer (replaces the former "v1.1 open chat" — retired)

"Will Amazon accept this?" / "What does Section 3 mean?" gets a **zero-LLM FAQ drawer**: guidance-corpus cards (`guidance.ts`, matrix `whyAmazonWantsIt`, state-machine expectations) retrieved deterministically by the case's kind + state. Questions the corpus can't answer render the fixed honest line ("no tool can honestly answer that — here's what is known…") or the professional-help pointer. **Generative open Q&A is parked indefinitely**; reviving it requires opt-in outcome data showing the interview leaves real questions unanswered, plus a decision-log append. Being capped to our service, strictly and professionally, IS the positioning — general-purpose AI chat is the competitor's failure mode, not a feature we lack.

### 4.4 Panic-hour triage card (guidance layer, free tier)
First decode response includes DO-NOW / DO-NOT lists per kind. The DO-NOT list is where trust is won in hour one: don't fire off an instant angry appeal (burned attempts are scarce), don't open a new account (related-account ban), don't buy "guaranteed reinstatement" or share your password/AnyDesk with anyone (2 Sep evidence: that's the scam-market norm), don't fabricate documents (severity + it's the one unforgivable class). Cheap content, directly monetizes as credibility.

---

## 5. Scope discipline (what this does NOT add)

- **No new milestones.** §1–§3 fold into M-4 (they are core modules + data); §4.2 folds into M-W (it is the paid web experience). If anything slips, the cut order is: the case-questions drawer → the interview rendering (the classic form page ships alone — same engine) → response-analyzer LLM assist (rules-only categories ship). The state machine, objection branches, and rule-based analyzer are not cuttable — they are the OS claim.
- **No automation, ever** — nothing here sends, submits, or fills anything on Amazon (D6; Agent Policy now in force makes this near-mandatory).
- **No predictions** — the Copilot inherits the readiness language rule verbatim ("case-file completeness — not a prediction").
- **No human-in-the-loop service** through the chat (Paddle AUP / AM-01: the Pass must remain automated software output; Expert Review stays deferred per D7).
- Feature freeze after AM-17 until first paid Passes + opt-in outcomes exist: further depth is bought with outcome data, not speculation (D10 is the arbiter).

---

## Definition of done

- [ ] AM-17 (AA-22…AA-25) recorded in `02-BUILD-PLAN-AMENDMENTS.md`; M-4/M-W gates carry the new acceptance lines; founder has ratified AM-17 (with AM-16).
- [ ] `caseState.ts`, objection-extended action model, and `responseAnalyzer.ts` exist with unit tests; the fixture corpus includes Amazon-reply fixtures; an evidence-incomplete + declined-action case produces an honest gap draft that names the declined item's chosen alternative.
- [ ] The Guided Interview passes the red-team set: fabrication request refused; gated kind routed out; "what are my chances?" answered with the fixed honest line; off-topic free text gets the fixed redirect (never a conversational reply); the per-case LLM budget stop degrades to forms + rules visibly; every step's advice traceable to engine output.
- [ ] The classic form rendering completes an entire case with cloud disabled (degradation parity proven); the backend exposes no `/chat` route (API-surface check).
- [ ] A newcomer can answer from this file alone: what state a case is in after a pasted rejection, what happens when a seller refuses an action, and why the chat cannot become a chatbot.
