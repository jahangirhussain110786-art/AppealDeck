# Collaborator & Contractor Policy — solo founder; binds before anyone ever gets access

**Why this file exists / when to use it:** AppealDeck is a **solo-founder** project: Jhangir Hussain (Pakistan) is the founder and the only principal. There is no co-founder, no partner, and no partnership agreement to sign — the former version of this file treated "Jhangir Hussain, Karachi" as an external partner distinct from the founder, which was wrong (corrected 29 Aug 2026; see `../00-DECISION/02-DECISION-LOG.md` §3 row 14). **Nothing in Phase 0 blocks on this file anymore.** It stays in the blockers folder because its rules bind BEFORE the first collaborator, contractor, VA, or appeals expert is engaged: run this file the day you consider giving anyone access to anything.

**Owner of the whole file:** Founder. **Cost:** $0 until a collaborator is engaged; then ~$50–200 (template + fixed-price review) to $500–2,000 (lawyer-drafted agreement). **Deadline:** none at Phase 0 — triggered by the first engagement. **Blocks (when triggered):** credential sharing, IP clarity, network recruiting, any collaborator work product.

Terms used below: **IP** = intellectual property. **NDA** = non-disclosure agreement. **POA** = Plan of Action, the written appeal document Amazon requires from suspended sellers. **Fixture corpus** = the library of real (anonymized) deactivation notices used to build and test the product. **MoR** = merchant of record, the payment provider (Paddle) that legally resells the product and handles VAT.

---

## 1. Hard rule and the do-not-share-before-signing list

**Hard rule: nothing on this list moves in either direction until both signatures are on a written agreement.** No exceptions for urgency, goodwill, or "we'll paper it later."

Do NOT share with any collaborator, contractor, or candidate (or anyone in their network) before signing:

| Category | Examples |
|---|---|
| Credentials of any kind | Supabase, Cloudflare, Paddle (or fallback MoR), Chrome Web Store (CWS) developer account, domain registrar, Google AI Studio, email, analytics |
| Product IP | Prompt library, violation taxonomy, POA templates, scoring/critic logic, module specs from the build plan |
| Fixture corpus | Collected notices, annotations, test cases |
| Commercial internals | Pricing experiments, margins, P&L, this playbook's non-public files, roadmap beyond public positioning |
| Legal work product | UPL analysis, compliance strategy details |

Do NOT accept from them before signing: any Seller Central login, screenshots of policy text taken from their account, or any client/seller data — accepting contributions before an IP-assignment clause exists is how ownership disputes start.

What MAY be discussed before signing: the public pitch (what AppealDeck is, roughly how it works at the level of the landing page), the proposed role, and the agreement draft itself.

---

## 2. What any collaborator agreement must contain (contents checklist)

Use this as the review checklist against whatever template or lawyer draft you end up with. Every row must be present.

| # | Clause | What it must say |
|---|---|---|
| 1 | **Roles & responsibilities** | Exactly what the collaborator does (e.g., appeals-content QC, VA triage, candidate sourcing), with named deliverables and dates where possible. Founder owns and operates the business, product, infrastructure, and all customer relationships. |
| 2 | **Compensation** | ⚠ FOUNDER-DECISION per engagement. Realistic structures: (a) flat fees per deliverable/milestone; (b) monthly retainer (PK market anchor: $150–400/mo territory for advisor/VA roles); (c) a small revenue share only for a genuinely load-bearing ongoing role — define the base precisely (net revenue after MoR fees and refunds), schedule, currency, and payment rail. No "TBD" in a signed document. |
| 3 | **IP assignment** | Everything the collaborator contributes to AppealDeck (templates, taxonomy notes, fixture notices, code, docs) is assigned to the founder on creation. No license-back beyond what's needed to perform the role. |
| 4 | **Confidentiality** | Standard NDA terms covering the §1 do-not-share list; survives termination 3–5 years; explicitly bars disclosure of non-public Amazon information obtained through any Seller Central account. |
| 5 | **Credential-handling protocol** | Founder retains sole ownership and admin control of ALL primary accounts (infrastructure, payments, CWS, domain). Collaborators receive per-person, least-privilege, read-only invites only where a task requires it — never shared passwords. Seller Central: no one ever shares an Amazon login; access is granted via Amazon User Permissions secondary-user invites, read-only, revocable. On exit, all access revoked within 24 hours. |
| 6 | **Exit terms** | Either party may exit with written notice (14–30 days). On exit: access revoked, confidential material returned/deleted, IP assignment survives, earned-but-unpaid compensation settled, and any revenue share stops accruing on new sales after exit. No equity, no ownership claim on the business. |
| 7 | **Non-solicit + non-compete** | Non-solicit of AppealDeck's contractors, design partners, and customers for 12–24 months. Non-compete narrowly scoped (Amazon-suspension-appeal software) and time-limited (12 months) — Pakistani courts apply a reasonableness test and may strike broad non-competes, so narrow beats sweeping. [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §3] |
| 8 | **Dispute resolution** | Governing law: Pakistan. For cross-border collaborators, an arbitration clause with a neutral seat — Singapore (SIAC) or London (LCIA) preferred. |
| 9 | **Term** | Initial term 12 months, renewable by mutual written agreement; clauses 3, 4, 7 survive termination. |
| 10 | **Status** | The collaborator is an independent contractor/advisor, not an employee, not a partner in the legal-partnership sense, and has no authority to bind the founder. |

---

## 3. Route options: template vs lawyer

| Route | Cost | Time | Good enough when |
|---|---|---|---|
| **Template + fixed-price review (recommended for v1)** | ~$200 total (free template + $50–200 fixed-price legal review on Upwork/Fiverr) | 1–3 days | Cash-constrained start; agreement mainly sets norms and IP assignment; you accept that enforcement is architecture-based anyway (see §4) |
| **Lawyer-drafted** | $500–2,000 | 1–2 weeks | Compensation is large, or the role grows into co-founder-like territory — revisit then |

[source: APPEALDECK_READINESS_AUDIT.md G-02; APPEALDECK_STREAM1_LEGAL_BUSINESS_FOUNDATION.md L-2, L-10]

Template route specifics: start from a free advisor/consulting-agreement template (StartupProject.org, LegalTemplateVault, Legaltemplates.net were verified free sources), then manually add the Pakistan governing-law + arbitration clause, the IP assignment, and the credential protocol — free templates are US-centric and contain none of these by default. Buy a fixed-price review (not hourly) and be aware a ~$100 marketplace reviewer may be a paralegal, not an attorney qualified in Pakistani law; that is an accepted trade-off at this stage.

Signing mechanics: exchange of signed PDFs by email or any free e-signature tool is legally fine for a two-party contract. Both parties keep a copy; the founder archives the executed PDF outside any code repo.

---

## 4. Reality check: what this paper does and does not do

Read this so nobody over-trusts the document. [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §2–3; STREAM_10_TALENT_OUTSOURCING_FREE_CHEAP.md gotchas]

- **NDAs against Pakistani counterparties are valid but practically weak.** NDAs are enforceable as contracts under Pakistan's Contract Act 1872, but Pakistan has **no trade-secrets statute**, its seven IP tribunals carry heavy backlogs, and enforcement costs will exceed the value of the secret for a solo founder. Arbitration works on paper and costs more than the secret.
- **Cross-border judgments barely travel.** Pakistan is not a Hague Judgments signatory; a foreign judgment needs separate enforcement action in Pakistan. The asymmetry means the agreement's real functions are: setting norms, making IP ownership unambiguous (which matters in international dealings — investors, acquirers, MoR onboarding), and creating a clean exit script.
- **ARCHITECTURE stops theft, not paper.** The actual protections are: **need-to-know staged disclosure** (public pitch → NDA-covered details → agreement-covered materials, each stage only as required), **server-side IP** (prompts, templates, scoring logic live on the backend and never ship to any client or contractor machine), and **speed** (shipping faster than a clone can follow). Design every collaboration task so that leaking what the collaborator can see would not hand over the product.
- **Platform work stays on-platform.** Any Fiverr/Upwork engagement stays on-platform for payment protection; pitching revenue share inside platform messaging violates their ToS — move people to a formal off-platform agreement instead when the relationship warrants it.

---

## 5. Seller Central access and the §19 read — solo paths (no partner required)

Fixtures cover milestones M-1→M-5 without any live account; live access blocks only the M-6 live-QA gate, and the BSA §19 full-text read (behind seller login) gates the extension's DOM-harvest feature. The access ladder, in order:

1. **Design partners** (ask Week 4, access by Week 6 — `../04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md`): written read-only consent via an Amazon User Permissions secondary-user invite — never a shared login. Any design partner can also screenshot the §19 text.
2. **Founder's own fresh Amazon Individual seller account** (free tier, no monthly fee, ~1–2 weeks to usable): shows Account Health / Performance Notifications page structure and the §19 text firsthand — a clean page only, which is enough for the §19 read and page-structure work. [source: The Second Opinion.md, amendment 4]

Appeals expertise never depends on any collaborator: the consultant retainer (~$1–2k, Week 3, `../08-TEAM/02-RECRUITMENT-KIT.md` §2) is the independent quality floor regardless of who else is engaged.

---

## 6. Action items (triggered by the first engagement — nothing due at Phase 0)

- [ ] **Step 1 — Resolve the ⚠ FOUNDER-DECISION on compensation** (§2 clause 2) for the specific role before sending any draft.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** before the draft goes out · **Blocks:** Step 2

- [ ] **Step 2 — Assemble the draft** from a free template + the ten clauses in §2; run the §2 table as a checklist against the finished draft.
  **Owner:** Founder (AI assistant may draft language; a template is not legal advice) · **Cost:** $0 · **Deadline:** 1–2 days after Step 1 · **Blocks:** Step 3

- [ ] **Step 3 — Buy a fixed-price review** of the draft (Upwork/Fiverr, fixed scope: "review contractor/advisor agreement, Pakistan governing law"). Skip only if going the full lawyer route instead.
  **Owner:** Founder · **Cost:** $50–200 · **Deadline:** 2–3 days after Step 2 · **Blocks:** Step 4

- [ ] **Step 4 — Both parties sign; archive the executed PDF.** Only now may items on the §1 list start moving, and only per the credential protocol (§2 clause 5).
  **Owner:** Founder + collaborator · **Cost:** $0 · **Deadline:** before any access · **Blocks:** all credential/IP sharing

- [ ] **Step 5 — Vet before relying.** Every appeals expert — regardless of how they were sourced — passes the paid fixture audition (a test Section 3 notice with 2 traps: an ambiguous deadline window and a missing invoice; fabricating the invoice = instant fail). $15–50 per candidate on-platform. Details: `../08-TEAM/02-RECRUITMENT-KIT.md`.
  **Owner:** Founder · **Cost:** $15–50/candidate · **Deadline:** before any template/QC work by that person · **Blocks:** any collaborator-produced appeals content

---

## Definition of done

- [ ] No credential, prompt, template, fixture, or roadmap internal has ever been shared with anyone without a signed agreement containing all 10 §2 clauses.
- [ ] Credential protocol in force: founder holds all primary accounts; any Seller Central access is via revocable read-only invite, not shared login.
- [ ] Every engaged appeals expert passed the paid audition before their work was relied on.
- [ ] Each executed agreement is archived as a signed PDF outside any repo, and the engagement is noted in `../00-DECISION/02-DECISION-LOG.md` §4.
