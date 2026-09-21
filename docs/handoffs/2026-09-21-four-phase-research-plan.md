# AppealDeck: four-phase research plan

Date: 21 September 2026
Status: planning complete; Phase 1 research not yet performed in this pass.

## Purpose and scope

Find a defensible product direction for a simple, useful Amazon seller case workflow: understand what is requested, gather real evidence, complete relevant actions, prepare an appropriate response, and handle what happens next. Research should test the earlier proposals, including whether sellers need and will pay for them. It cannot establish that the product is failure-proof or guarantee word-of-mouth growth.

The current request is to plan first. Execute research one phase at a time; after Phase 1, stop with its findings and carry-forward questions. These are research phases, separate from the older K0–K3 implementation sequence. No implementation is authorized by this plan.

## Starting material and evidence status

- Founder brief: `prompt-for-chatgpt.txt`, including the Meta AI conversation and Claude summary.
- Prior proposals: the four `2026-09-19-case-os-v2-*` direction, research, feature-register, and plain-guide documents.
- Paused work: `2026-09-19-case-os-v2-second-opinion-RESUME.md` and its six salvage research files covering Amazon mechanics, seller voice, agency practice, OCR, growth/trust, and analogous workflows/packaging.
- Implementation context: current `AGENTS.md`, the launch-readiness handoff, and recent Git history. The launch review predates subsequent continuity, checkout, outcome, and audit fixes; its findings need rechecking before being called current gaps.
- Current checkout at planning: HEAD `52cf0cf`; the two newest commits add research/planning. The prompt was the only untracked file before this plan was added.

This planning pass read the brief and reviewed the recent document structure, key sections, resume material, and changed-file history. It did not audit every source file, read all six raw salvage files, run the app, or verify external claims. The salvage and prior AI summaries are leads, not confirmed evidence. Their completeness does not establish source quality.

## The four phases

| Phase | Main question | Work | Deliverable and exit condition |
|---|---|---|---|
| **1. Establish the facts** | Which claims can we safely base the product on? | Verify the highest-impact Amazon mechanics and competitor claims; separate official requirements from seller anecdotes and AI speculation; spot-check relevant implementation claims. | One evidence brief: verified, qualified, contradicted, or unresolved claims; current product baseline; and a short list of changes this evidence implies. Each direction-changing claim has a source or an explicit uncertainty. |
| **2. Establish seller value** | Who needs this most, what fails them today, and why would they choose and recommend it? | Reuse seller accounts and agency reviews; compare Amazon's own tools, direct competitors, agencies, and manual alternatives. Examine a small set of distinct seller situations, willingness-to-pay evidence, case pricing, support expectations, and plausible acquisition channels. | A target customer and initial case scope, a comparison of unmet needs, and a testable value proposition. Separate observed demand from hypotheses requiring interviews or a pilot. |
| **3. Design the complete journey** | What is the simplest reliable way to deliver that value? | Map notice intake through response, waiting, rejection, escalation, and closure. Review evidence checks, missing facts, conflicting documents, uncertain routing, accessibility, mobile use, privacy, recovery, and human handoff. Compare local document reading, optional cloud help, integrations, and deterministic rules on feasibility and cost. | One journey map and a prioritized capability table: reuse, improve, add, defer, or reject. Each proposed capability addresses a supported user need and has fallback behavior and an acceptance criterion. |
| **4. Decide the build and validation plan** | What should we build first, and what evidence would justify continuing? | Rank work by user value, evidence strength, dependencies, effort, and operating cost. Define per-case scope, support/refund expectations, pilot design, meaningful product metrics, launch gates, and later experiments for referrals or partnerships. Revisit unresolved assumptions that affect the decision. | A phased implementation backlog, a bounded pilot and measurement plan, cost assumptions, and explicit go/revise/stop criteria. Development remains a separate task. |

## Phase 1: bounded execution plan

### 1. Build a compact claim list from existing work

Start with roughly 10–12 direction-changing claims, rather than rechecking all 96 proposed features. Prioritize by impact if wrong and weakness of evidence. Candidate questions:

1. What response paths are actually supported, and how do notice wording, marketplace, account status, and the live form affect the choice?
2. What can Amazon's Seller Assistant actually do for appeals, for whom, and under what access restrictions? What remains uncertain about deactivated accounts?
3. Which invoice requirements are specific to a notice or case type, rather than universal rules?
4. What is established about Seller Challenge and verification workflows, including eligibility and notice-specific deadlines?
5. Do credible sources support the transcript's claims about bot checks, AI-text detection, rejection percentages, word limits, or success probabilities?
6. What evidence supports claims about repeated submissions or permanent loss of appeal options? Distinguish a reported experience from an official rule.
7. Which claimed SP-API capabilities exist and can realistically be accessed for the intended seller state?
8. What current official terms materially constrain the proposed scope, data handling, or automation? Keep legal conclusions unresolved where primary text or qualified interpretation is missing.
9. Which claimed product gaps remain in this checkout: routing, extraction, document reading, reminders, duplicate journeys, and export?

Select the final shortlist after checking saved sources. Combine related claims; do not expand the phase into a full legal, competitor, or technical audit.

### 2. Reuse evidence before searching

Search the salvage files for the selected claims and original URLs. Read only relevant excerpts. Open original sources for the claims that drive decisions; retrieve fresh material when the saved source is secondary, outdated, ambiguous, or unavailable.

Prefer official Amazon help, announcements, and API documentation for platform behavior. Distinguish Amazon staff statements from seller posts on the same forum. Competitor websites establish advertised features, not demonstrated quality. Reviews and seller stories show experiences, not population-level rates or causal proof.

### 3. Verify the relevant code baseline

Inspect targeted functions and their callers for the selected implementation claims. Start with `noticeParser.ts`, `workspace.ts`, the Decode client, workspace components, composers, export code, and reminder-related code only as needed. Use recent commits to avoid reporting repaired issues as open. Label source inspection separately from runtime verification; do not run broad builds or tests merely to write a research plan.

### 4. Record the decision consequence

Use one ledger with these fields:

`Claim | verdict | original source URL or code path | date checked | marketplace/scope | limitation | consequence for AppealDeck`

Unknowns stay unknown. Do not convert uncertain dates, eligibility, OCR output, anecdotal outcomes, or unsupported statistics into hard product gates. If a risky claim is unsupported, preserve the legitimate user need and propose a testable alternative.

### 5. Stop and report

Deliver one new Phase 1 document with a short plain-language summary at the top, the evidence ledger, current baseline, and at most five priority questions for Phase 2. Stop once the selected claims are resolved or explicitly bounded. An inaccessible source is a recorded limitation, not a reason for endless searching.

## Credit discipline

- Work in one session with no subagents.
- Reuse this plan and saved evidence across phases; do not reload the whole repository or all raw research.
- For Phase 1, aim for 4–6 focused search queries and 8–12 relevant page reads. These are planning ceilings, not credit estimates; if they do not resolve a claim, record the gap for targeted follow-up.
- Batch independent retrievals and keep excerpts compact. Follow links only when they could change a decision.
- Save one concise findings file per phase, with its evidence and next questions, instead of multiple overlapping reports.
- Do not rerun working tests, build prototypes, call paid product APIs, or conduct broad competitor sweeps during Phase 1.
- Stop after each phase. Neither elapsed time nor completed research authorizes the next phase or implementation.
- These controls reduce unnecessary work; exact credit use and completion within an account allowance cannot be guaranteed.

## Research standards across all four phases

Keep the founder's aim of a simple, proactive journey central. Treat earlier feature decisions as proposals to examine, with reasons recorded for any recommendation to change them. Prefer measurable usefulness over feature count. Distinguish ease of document checking from proof of authenticity; genuine action records from generated fiction; case completeness from predicted approval; and draft assistance from authorized external actions.

No external messages, user interviews, purchases, implementation, deployment, commits, pushes, edits to existing planning/reference files, or memory updates are part of this planning task. Later research may prepare interview scripts or pilot materials without contacting anyone.
