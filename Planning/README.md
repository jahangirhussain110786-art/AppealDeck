# AppealDeck — Execution Playbook

**Version 1.0 · 26 Aug 2026 · Jhangir Hussain**
**Status: ready to execute. Start at [MASTER-CHECKLIST.md](MASTER-CHECKLIST.md), item 1.**

---

## What this is

This folder is the complete, self-sufficient execution playbook for **AppealDeck** — a product that helps suspended Amazon sellers by (1) decoding their deactivation notice for free, (2) drafting an AI-generated Plan of Action (POA — the structured appeal document Amazon requires), (3) tracking appeal deadlines, and (4) keeping an encrypted, local-first case vault. It is sold as a **$199 one-time "Appeal Pass" per case** (with a $29/mo "Guardian" subscription deferred until its monitoring feature exists), against human consultants whose verified prices run **$600–$5,000 per case**.

The playbook was distilled on 25–26 Aug 2026 from five rounds of multi-agent research (34 source documents, indexed in [07-REFERENCE/08-SOURCE-DOCUMENT-INDEX.md](07-REFERENCE/08-SOURCE-DOCUMENT-INDEX.md)) **plus an independent live-web verification pass** that confirmed the market case and corrected seven stale premises. Where this playbook and any older document disagree, **this playbook wins**.

A team that has never seen this project should be able to execute from these files alone. Items genuinely requiring the founder's personal judgment are flagged `⚠ FOUNDER-DECISION` — everything else is decided.

## The verdict, in one line

**CONDITIONAL GO** — demand is real and independently verified, the stack is viable at near-zero marginal cost, and the cash requirement fits the founder's budget; but the GO holds only under four conditions (web-first compliance spine, Phase-0 blockers closed first, honest no-guarantee positioning, gates enforced). Full reasoning and evidence: [00-DECISION/01-VERDICT.md](00-DECISION/01-VERDICT.md).

## The four hard rules (never break these — they ARE the strategy)

1. **Never the word "guarantee", never a success-rate claim** without our own opt-in outcome data. The market is scarred by scam appeal services; honesty is the differentiator. (Grep gate: "guarantee" = 0 hits in anything user-facing.)
2. **Severity gating:** hopeless case types (forged documents, fraud, child-safety) are **never sold a Pass** — they are routed to a professional-help screen.
3. **Read-only, no automation, ever.** The product never clicks, submits, or automates anything in Seller Central. Paste-mode (user pastes the notice text) is the primary, policy-proof path.
4. **Local-first.** Case data stays in the user's browser. The only data that leaves: license checks, consented cloud-AI calls, anonymous opt-in telemetry.

## How to use this playbook

**Reading order for a new team member (≈2 hours):**
1. This file
2. [00-DECISION/01-VERDICT.md](00-DECISION/01-VERDICT.md) — why we're doing this
3. [08-TEAM/01-ROLES-AND-OWNERS.md](08-TEAM/01-ROLES-AND-OWNERS.md) — who does what (find your role)
4. [MASTER-CHECKLIST.md](MASTER-CHECKLIST.md) — the sequence
5. The phase folder you are executing, in file order

**Execution model:** work through [MASTER-CHECKLIST.md](MASTER-CHECKLIST.md) top to bottom. Each item links to the file holding the full procedure. Three **gates** (before build / before launch / before first paid customer) must pass before crossing — they live in [00-DECISION/03-GATES-AND-KILL-CRITERIA.md](00-DECISION/03-GATES-AND-KILL-CRITERIA.md), together with the kill criteria that tell you when to stop.

## Folder map

| Folder | What it holds | When |
|---|---|---|
| [00-DECISION/](00-DECISION/) | Verdict, decision log, gates & kill criteria | Read first; consult at every gate |
| [01-PHASE-0-BLOCKERS/](01-PHASE-0-BLOCKERS/) | Credential rotation, partnership agreement | **Day 1–3, before anything else** |
| [02-PHASE-1-FOUNDATION/](02-PHASE-1-FOUNDATION/) | Accounts, domain + legal pages, payments (Paddle), repo + fixture corpus, community presence | Week 1–2 |
| [03-PHASE-2-BUILD/](03-PHASE-2-BUILD/) | Build sequence, **amendments (authoritative over the v1.0 spec)**, technical risk controls, and the verbatim technical spec in `reference/` | Week 1–8 |
| [04-PHASE-3-LAUNCH/](04-PHASE-3-LAUNCH/) | Web decoder launch (first revenue, week 4–5), Chrome Web Store submission, design-partner beta, launch-day runbook | Week 4–8 |
| [05-PHASE-4-GROWTH/](05-PHASE-4-GROWTH/) | First-100-users plan, community playbook, SEO content plan, competitive response | Week 1 onward |
| [06-OPERATIONS/](06-OPERATIONS/) | Support, crisis playbook, analytics & metrics, payment operations | Standing — live from launch |
| [07-REFERENCE/](07-REFERENCE/) | Market evidence (the fact-check gate for all copy), competitor dossier, risk register, unknowns register, resource stack & budget, edge personas, roadmap, source index | Consult as needed |
| [08-TEAM/](08-TEAM/) | Roles & owners, recruitment kit, AI-session continuity protocol | Read at onboarding |

## Who does what (the three owners used on every action item)

| Owner | Means |
|---|---|
| **Founder** | Jhangir Hussain (solo, Pakistan). Accounts, spending, approvals, community voice, all external contacts — plus Seller Central access, retrieval of Amazon's Agent-Policy text, and talent sourcing. |
| **AI assistant** | The AI coding agent that executes the entire technical build from [03-PHASE-2-BUILD/](03-PHASE-2-BUILD/). It cannot open accounts, sign contracts, or post publicly. |
| **External** | Appeals-QC consultant, accountant, optional scoped counsel, E&O insurance broker. **Nothing is shared with any collaborator before a written agreement per [01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md](01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md).** |

Details, decision rights, and burnout guardrails: [08-TEAM/01-ROLES-AND-OWNERS.md](08-TEAM/01-ROLES-AND-OWNERS.md).

## Money, honestly

Available cash: ~$1,100–2,300 (+ ~$500–1,200 recruitment budget). One-time setup ≈ $20–50 on the lean path (store account $5, domain ~$15; the old $200 agreement-template line item is gone — solo founder, no partnership agreement) plus two priority spends: appeals consultant $1,000–2,000 and E&O insurance $500–2,500/yr before public launch. Target infrastructure run-rate: $0–25/mo at launch (Cloudflare Pages free + Supabase; ceiling ≤$50/mo). The only planning-grade year-1 revenue figure is the conservative **~$17k gross**; every larger number in the source research is illustrative. Full budget and allocation decision: [07-REFERENCE/05-RESOURCE-STACK-AND-BUDGET.md](07-REFERENCE/05-RESOURCE-STACK-AND-BUDGET.md).

## Provenance

Source research lives in `V:\Extension 2.3\Future\` (do not treat any of it as current without checking [07-REFERENCE/08-SOURCE-DOCUMENT-INDEX.md](07-REFERENCE/08-SOURCE-DOCUMENT-INDEX.md) — several documents are superseded, and one, `Ai-chat.txt`, carries numbers that are banned from all planning and marketing). The technical spec executed by the AI assistant is [03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md](03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md) **as modified by** [03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md](03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md). The old code repository `V:\Extension 2.3\` contains third-party proprietary code — copy **only** the donor files listed in the build plan §6, and never anything from the forbidden-sources list in §2.6.

## Definition of done (for this README)

- [ ] Every new team member has read the reading-order list above before touching a task.
- [ ] The four hard rules are known by heart by everyone with user-facing output.
- [ ] Execution proceeds only via [MASTER-CHECKLIST.md](MASTER-CHECKLIST.md), with gates enforced.
