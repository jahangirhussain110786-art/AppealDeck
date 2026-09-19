# AppealDeck: from writing flow to case workspace

18 September 2026 • Proposed direction • Read with the [launch strategy](2026-09-18-launch-strategy.md), [70-feature decisions](2026-09-18-feature-decisions.md) and [research ledger](2026-09-18-research.md).

## 1. Product decision

Build a guided case workspace for English-language Amazon US notices. Its job is to help a seller understand the actual request, resolve relevant gaps, organize supporting evidence, prepare the appropriate response and handle what arrives next. The user should always know the next useful action, its reason and what changes after completing it.

The commercial promise is **a clear route and a coherent, evidence-linked response package**. Reinstatement is an outcome Amazon controls. A high-quality workspace may correctly conclude that no letter is needed, the form requires a different action, an allegation is disputed, more information is needed, or a specialist is appropriate.

The founder's exoskeleton analogy is a good design constraint: assistance should appear where the user encounters difficulty. Translate it into conditional tasks and focused tools, not eight visible modules, a permanent chat box or eight independently deployed services. Simplicity means fewer decisions and less repetition, not a promise that a complex case takes three clicks.

## 2. What the conversation gets at

The valuable ideas are protocol-aware intake; documents that actively inform the case; actions that produce evidence; helpful supplier/third-party drafts; generated wording grounded in actual events; reply-driven follow-up; and continuity across the whole case. The conversation's later emphasis on orchestration is more valuable than its raw feature count.

The current code already contains much of the skeleton. The previous September 2 review proposed evidence-first workflows, alternative actions and a case state machine. Another broad specification alone will not solve the problem. This revision names the missing decision model, gives concrete acceptance tests and sets a narrow first vertical slice.

### Translate the proposed eight modules into one experience

| Conversation module      | Useful responsibility                                                     | Boundary                                                                |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Forensic intake          | Extract observable requests, entities and contradictions                  | No inferred secret Amazon code or interrogation framed as lie detection |
| Seller psychology/triage | Calm explanation, urgent source-based next steps and honest expectations  | No fear, fabricated odds or guaranteed timelines                        |
| Evidence lab             | Read, organize and cross-check records                                    | No authenticity certificate or synthetic evidence                       |
| Action orchestration     | Dependencies, alternatives, waiting states and factual completion records | No forced irreversible actions                                          |
| External agents          | Relevant editable supplier/third-party drafts                             | Seller controls sending and actual actions                              |
| Generator and critic     | Protocol-specific, evidence-linked response and quality checks            | No imagined Amazon-bot score                                            |
| Human expertise          | Reviewed playbooks and qualified handoff                                  | No unvetted marketplace or invented expertise                           |
| Learning/retention       | Consented outcomes, issue analysis and maintained guidance                | No autonomous policy rewriting or premature monitoring subscription     |

Existing Amazon assistance is part of the competitive baseline (research A8). The pilot must establish incremental value in evidence coordination and case continuity; a nicer explanation of the notice alone is insufficient.

### Code-grounded diagnosis

| Existing area                                                     | What exists                                                         | What prevents the intended experience                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/classifier.ts`, `noticeParser.ts`, `index.ts`           | Deterministic notice classification, entities and severe-case gates | One violation label carries too much meaning. Product authenticity and allegations of inauthentic documents can share `INAUTHENTIC_DOCUMENTS`; broad matching can over-route to the severe gate. Section 3 wording alone cannot explain the underlying issue. |
| `src/core/readiness.ts`, `composer.ts`                            | Document-type labels, gap drafts, action evidence and critic        | `composePoa()` always constructs Root Cause, Corrective Actions and Preventive Measures even when its document label is a dispute or funds appeal. A label is not a different response protocol.                                                              |
| `src/core/evidenceModel.ts`                                       | Requirements and guidance per violation kind                        | Static universal requirements do not capture the actual notice, alternatives, source versions or form constraints. Existing invoice disqualifiers and related-account guidance need contextual revision.                                                      |
| `src/core/interviewEngine.ts`, `src/components/InterviewFlow.tsx` | Guided questions, task status, objections, resume/save              | A generic interview can ask for narrative before the appropriate route is established. The user lacks a concise map of questions, evidence, actions and blocked dependencies.                                                                                 |
| `src/core/responseAnalyzer.ts`, case state and dashboard          | Reply categories, status and outcome tracking                       | Needs a precise delta between the new request, existing evidence and the exact last submission. Rejection does not establish a new root cause by itself.                                                                                                      |
| Vault, scoped case store, auth, billing, recovery                 | Valuable security and continuity foundations                        | A securely stored file is not automatically reviewed evidence for a particular claim. Keep the foundation and add provenance, review state and document-to-requirement links.                                                                                 |

Passing tests establishes implementation behavior, not the correctness of policy assumptions or market value. Preserve existing integrity tests while adding representative workflow evaluations.

## 3. The decision model

Separate six dimensions instead of multiplying violation labels:

1. **Scope:** account, listing/ASIN, payment/funds, verification, general communication.
2. **Issue family:** operational performance, authenticity, IP, listing content, related account, identity, product safety, document-integrity allegation, restricted product or unknown.
3. **Requested protocol:** document response, operational POA, dispute, questionnaire/acknowledgment, correction and confirmation, status follow-up, information only, clarification or specialist review.
4. **Context:** marketplace, language, notice date, response form, previous submissions and deadlines with exact source.
5. **Seller position:** accepts, disputes, partly accepts or unsure about each allegation. Never infer admission from uploading a notice.
6. **Certainty:** observed in source, seller-confirmed, inferred candidate, contradicted or unknown. A regex hit is not a calibrated confidence percentage.

The router produces a proposed protocol plus reasons and unresolved questions. It asks the smallest discriminating question, such as “Does the current response page ask for invoices, a written explanation, or both?” A screenshot can support the answer. Ambiguous inputs abstain rather than quietly choose POA. The seller can correct a route; record the change and rerun requirements without losing earlier work.

### Protocol matrix

These are product behaviors to validate, not universal Amazon instructions. Sources A1–A4 in the research ledger establish why a single appeal template is inadequate.

| Situation                                                | Next step                                                                            | Response shape                                                              | Initial release                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| Explicit document request; no fraud/safety allegation    | Confirm requested items and form, inspect documents                                  | Short document cover response only if requested, plus mapped attachments    | Narrow, reviewed pilot                                |
| Operational performance notice explicitly requesting POA | Inspect metric period, identify actual process failure and completed/planned changes | Specific root cause, corrective actions, prevention with supporting records | One reviewed operational playbook                     |
| Seller disputes an allegation                            | Record allegation, seller position and supporting facts separately                   | Claim/reason/evidence/request; no compulsory apology or admission           | Triage and package; paid disputed-IP support deferred |
| Listing correction request                               | Identify exact listing issue and record correction                                   | Correction confirmation and requested proof                                 | Later reviewed playbook                               |
| Questionnaire, quiz or acknowledgment                    | Guide to the actual Seller Central form                                              | Form preparation; no artificial letter                                      | Identify and guide free                               |
| Identity/video verification                              | Identify official channel and requested steps                                        | Preparation checklist; minimize identity-document handling                  | Triage only                                           |
| Related-account issue                                    | Distinguish recognized ownership, former relationship and disputed relation          | Organize timeline and requested records for specialist review               | Triage only; no hidden-link scanner                   |
| Funds request alongside account issue                    | Maintain separate linked tracks and source-specific dates                            | Requested verification/documents/follow-up                                  | Triage; no universal release promise                  |
| Safety, fraud or document-falsification allegation       | Preserve notice and evidence; route to qualified assistance                          | Exportable factual case summary                                             | No self-serve appeal sale                             |
| General update or already resolved issue                 | Confirm no outstanding action in actual notice/form                                  | Save/update status; no response by default                                  | Supported free                                        |
| Multiple issues in one notice                            | Separate issue requirements, preserve shared submission context                      | One or multiple packages according to actual form                           | Identify; unsupported combinations triaged            |
| Unknown/truncated/contradictory notice                   | Ask for missing notice or form context                                               | No confident route yet                                                      | Supported free                                        |

## 4. The user experience

### Before purchase

Use a sample without signup. Paste a notice or, when implemented, add a PDF/image. Explain local storage, cloud processing choices and unsupported scope before asking for sensitive material. Show a short interpretation, the proposed route, relevant requests and unanswered questions. Unsupported cases receive a useful summary and referral guidance without a paywall. An incomplete notice must not produce a persuasive checkout for an uncertain service.

### One workspace

Primary product navigation: **Cases**; inside a case use **Overview, Evidence, Response, History**. Billing and account settings live in the account menu. The vault becomes a secure storage capability accessible from Evidence, rather than another place the seller must learn to visit. Retain existing URL compatibility during migration.

The overview has a compact case identity, current state, notice-derived deadline if known, one prominent next action, and an expandable full plan. Stages are **Understand → Resolve → Respond**, followed by **Awaiting response** and **Review update**. Stages can reopen; show why. “No deadline found” is an honest state, not a fabricated timer.

The next-action card contains a plain instruction, the source/reason, a short input or document action, and alternatives: “I have this,” “I need to request it,” “I cannot obtain this,” and “This does not apply.” Avoid hiding the entire plan or trapping users in a rigid wizard. A supplier wait should allow independent work and preserve its follow-up date.

Contextual assistance appears in a drawer: draft a supplier request, inspect the requested fields, clarify a term, or record a factual process change. No general chat and no automatic outbound messages. The seller reviews and sends correspondence themselves.

### Four representative journeys

**Document request:** notice/form confirmed → requested invoice added → extracted supplier contact unclear → seller checks source or drafts supplier request → waiting state → genuine replacement added as a new version → facts confirmed → requested response and attachment checklist → seller records submission.

**Operational POA:** metric window confirmed → seller records the actual failure and affected orders → task records corrective action and evidence → prevention has owner/frequency/adoption state → response separates completed changes from plans → seller reviews against form limits.

**Disputed IP notice:** allegation and seller disagreement preserved → complaint identifier and claimed rights extracted → documentation gap identified → factual case packet and, if suitable, rights-owner request drafted → specialist handoff when legal interpretation is required. No generated confession.

**Informational update:** notice indicates review continues and asks for nothing new → case moves to awaiting response → user can set their own reminder or add a later request. No resubmission sequence manufactured to keep the user busy.

### Visual direction

Keep the existing warm neutral/green palette and readable typography. Use a calm workspace with generous spacing, concise dense evidence rows, a document preview and a visually distinct next action. Use serif emphasis sparingly in welcome/summary moments; functional text remains sans serif. Status is conveyed by words and icons as well as color. No success/confidence dial, constant celebration or alarm-red dashboard.

On mobile the document/source preview becomes a full-width panel, the plan becomes a disclosure and the next action stays prominent. All controls need keyboard focus, accessible names, 200% zoom support and reduced-motion behavior. Empty, loading, locked, unavailable, conflict, offline and partial-processing states are designed alongside the happy path. The attached prototype explores this structure with fictional cases.

## 5. Evidence that actually helps

Each original file has a stable ID, content hash, case scope, document type, uploaded timestamp and version relationship. Keep the original immutable. Normalized fields retain source page/region, extracted text, extraction confidence and user correction history. An invoice-product code is not automatically an ASIN: require an explicit mapping and preserve its basis.

Requirements are versioned objects with applicability conditions, accepted alternatives, evidence links, source URL/notice excerpt, marketplace and review date. Classify each check as satisfied, missing, unclear, conflicting or not applicable. Distinguish readability, completeness, consistency and authenticity: the product can assist the first three; it must not certify the fourth.

For invoice checks, anchor dates and quantities to the applicable notice requirements. Do not reject a document solely for being an image or for lacking a printed ASIN; do not claim an invoice simply “expires” every day. Source A2 supports this more contextual treatment. Proposed OCR work uses field locations and review controls; T1 demonstrates technical feasibility, not supplier legitimacy.

Evidence can support multiple requirements within the same case, with explicit mapping. Cross-case reuse requires seller choice and a fresh applicability review. The UI explains gaps concretely: “Supplier contact cannot be read on page 1,” rather than “Invoice strength 42%.” Supplier requests ask the issuer for genuine missing/corrected records; the app never reconstructs a financial document.

## 6. Actions, readiness and output

Action states: proposed, planned, in progress, completed as reported, completed with linked evidence, blocked/waiting, declined with reason and not applicable. Record who supplied the information and when. A checkbox, uploaded photo or generated SOP is not independent proof that an event occurred. Training records describe sessions actually held; an SOP has draft/adopted states and an owner.

Readiness is protocol-specific. A missing required document blocks a “ready for submission” claim and identifies the affected assertions. It must not block reading, editing, asking a supplier, exporting a clearly labeled work-in-progress or handing the case to an expert. Provide an explicit unresolved-items summary when the seller chooses to work with incomplete material. Never turn a skipped requirement into a factual assertion.

Generate from confirmed facts and reviewed evidence links. Each material statement has internal provenance; dates, quantities and filenames must match the selected versions. Proposed actions use future tense; reported completed actions are labeled appropriately during review. A critic checks contradictions, unsupported claims, unanswered requests, stale attachments and form limits. It evaluates the package, not an imagined Amazon bot.

Output schemas differ by protocol. A document response lists the request, the provided item and any accurate explanation. A dispute lists the allegation, grounds, records and requested correction. A POA uses the relevant operational structure. A questionnaire preserves the real questions. Keep internal task IDs and status labels out of final seller-facing prose unless useful to the recipient.

Export plain text, optional PDF and an evidence manifest with exact filenames/pages. ZIP is a convenient download for the seller, not an assumed Seller Central upload format. Renaming creates export copies with an original-to-export map. Submission constraints come from the actual form, including allowed types, size, field lengths and attachment count.

Submission stays manual. Save the exact text, selected file versions, submission channel/date and optional receipt as an immutable attempt. A new reply generates a proposed delta: what Amazon requested, what is already covered, what conflicts and what task reopens. Confirm before applying the new plan; retain the old one. Do not repeatedly resubmit identical text on an arbitrary schedule.

## 7. Architecture and migration

Keep Next.js, the TypeScript core, Supabase account/entitlement infrastructure and scoped encrypted vault. Add domain modules inside the existing application; a new framework or microservice fleet is not needed.

```text
Notice + actual form + seller position
    → bounded extraction, with source spans
    → protocol decision + unresolved questions
    → reviewed playbook + case-specific requirements
    → task dependencies ↔ evidence review ↔ confirmed facts
    → protocol-specific response + consistency critic
    → immutable submission attempt
    → reply delta → revised plan
```

Proposed additive schema:

```ts
type SourceRef = {
  artifactId: string;
  page?: number;
  textSpan?: [number, number];
};
type Fact = {
  id: string;
  field: string;
  value: string | number | boolean;
  state: "extracted" | "confirmed" | "disputed" | "unknown";
  sources: SourceRef[];
};
type ProtocolDecision = {
  protocol: string;
  playbookVersion: string;
  reasons: SourceRef[];
  unresolvedQuestionIds: string[];
  confirmedAt?: string;
};
// Case vNext also has issues[], requirements[], tasks[], artifacts[],
// planRevisions[], submissionAttempts[] and replyEvents[].
// Runtime schemas must validate IDs, bounds, references and ownership.
```

Implementation mapping:

| Work             | Existing seam                                                        | Proposed change                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intake/protocol  | `noticeParser`, `classifier`, `index`, decode API/UI                 | Add a separate protocol decision module and schema; retain existing severe gates until explicit regression fixtures support a narrower classification.                   |
| Requirements     | `evidenceModel`, `readiness`                                         | Add reviewed playbook registry and requirement instances; distinguish recommendation from mandatory notice request.                                                      |
| Case persistence | `interviewEngine`, `caseSchema`, `caseStore`, vault                  | Versioned additive migration, provenance and attempt snapshots; old cases remain readable and require confirmation before a new route is applied.                        |
| Workspace        | `InterviewFlow`, `DashboardClient`, `EvidenceSlotPanel`, `VaultView` | Reuse components underneath a coherent case page; do not scatter another menu of AI tools.                                                                               |
| Response         | `composer`, `composePoaLlm`, `ComposeView`, compose API              | Dispatch to protocol-specific composers; entitlement and sensitive-case checks remain server-enforced.                                                                   |
| Replies          | `responseAnalyzer`, analyze-reply API                                | Produce a typed diff and proposed tasks, with unknown categories and user confirmation.                                                                                  |
| Documents        | New extraction adapter + existing vault                              | Manual first, bounded cloud processing only after consent; no long OCR task inside a short webhook/request budget. Add durable jobs only when measurements require them. |

Treat documents, emails and retrieved content as untrusted data. They cannot instruct the model to bypass rules, call tools, reveal another case or rewrite policy. Do not fetch arbitrary document links server-side without strict controls. Validate MIME/signatures, size/page limits, decompression limits and extracted-field bounds. Avoid raw case text in telemetry. Retain deterministic/manual fallback when OCR/model capacity fails.

Cloud AI sees plaintext selected for that operation even when storage is encrypted. Explain this and obtain the appropriate consent; do not market it as processing encrypted data. Verify active billing-backed Gemini handling and current retention terms before real confidential cases (T2). Never send case material to live web search by default.

Migration must preserve original data, submission history, case IDs, entitlements, guest/account isolation and backup portability. Migrate copies transactionally and support restoration. An unavailable playbook version must remain inspectable for past attempts. Feature-flag new routing and workspace; rollback to the previous reader without silently discarding new fields.

## 8. Delivery sequence with completion gates

Effort bands are planning ranges, not a 30-day launch promise. One implementation owner plus a qualified playbook reviewer is assumed; founder acceptance and access can extend elapsed time.

**Slice 0 — routing foundation (roughly 1–2 engineering weeks).** Define orthogonal schemas, source hierarchy, unsupported states and a small reviewed fixture set. Split product-authenticity intake from explicit document-falsification allegations without weakening severe-case protections. Prove document response, operational POA, dispute/clarification and information-only decisions. No broad paid launch.

**Slice 1 — useful end-to-end workspace (roughly 2–4 engineering weeks).** One narrow document-request playbook and one operational playbook, source/form confirmation, manual evidence review, task alternatives, supplier draft, protocol-specific output, submission snapshot and reply delta. Keep extraction manual initially if OCR quality or privacy onboarding blocks it. This slice must solve a full case workflow, not merely expose more fields.

**Slice 2 — assisted evidence (roughly 1–3 engineering weeks).** PDF/image text extraction, field/source preview, uncertainty handling, duplicates, per-requirement checks and export mapping. Benchmark a single provider against manual ground truth before choosing it. OCR must save time without increasing uncorrected errors.

**Slice 3 — small paid pilot and refinement (at least several weeks of observation).** Launch gates in the companion strategy must pass. Review real usage with permission. Fix bottlenecks before expanding case families. Marketing promises stay within supported workflows.

**Later:** validated listing/IP playbooks, reviewed UK then selected marketplace variants, specific read-only SP-API capabilities, invited reviewer access and recurring monitoring if customers demonstrate recurring demand. Each is separately scoped, priced and reviewed; no automatic 60/90-day feature rollout.

### Definition of ready for a pilot

- Fixture coverage includes document-only, actual POA, disputed allegations, no-action notices, partial input, multi-issue input, negation, date ambiguity, wrong marketplace, explicit falsification and new replies.
- Every severe fixture remains correctly gated; every ambiguous fixture can abstain. Report routing precision and coverage separately. A headline “95% accuracy” can hide dangerous false confidence.
- All release-fixture material claims trace to confirmed facts; known missing facts do not appear as completed actions. All references resolve to the selected attachment version/page.
- Reviewer agrees that each supported playbook addresses the actual form and applicable source. A second review is needed for policy changes or substantive disputes, not every copy edit.
- File extraction failure, no cloud consent, offline interruption, locked vault, changed account, duplicate import and canceled payment all preserve usable case state.
- Existing integrity gates plus new workflow tests pass; a browser test exercises intake → blocker → alternative → output → submission → reply → revised plan.
- Five observed usability sessions: sellers can explain the next action, distinguish “planned” from “done,” identify what leaves their device and resume without assistance. These are proposed research tasks, not completed studies.
- Track time to correct next action, unresolved evidence issues, revision effort, support minutes and refunds. Record submitted/resolved outcomes with consent and denominators; do not attribute causality to the tool from a few successful cases.

## 9. Scope discipline

The moat, if earned, is a reliable, reviewed relationship between requests, facts, actions, evidence and follow-up—not a large prompt, a pile of templates or an undocumented success dataset. No invented approval odds, supplier blacklists, fake training logs, Amazon affiliation, legal expertise or hidden account-link intelligence. No autonomous account closure, destruction, buyer messaging, submission or policy changes learned from a single outcome.

The first concrete build should be Slice 0 plus the document-request journey through a supplier wait and a new reply. It will demonstrate the founder's intended product much more convincingly than another visual refresh or a larger generic text generator.
