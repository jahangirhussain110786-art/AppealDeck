# AppealDeck premium case service implementation plan

Design decisions approved by the founder on 9 November 2026. Implementation remains on hold by explicit instruction.

This plan translates the [reliability and premium case service blueprint](2026-11-09-evidence-intake-and-case-reliability.md) into changes to the existing application. The objective is a dependable case journey: understand the request, investigate relevant history, obtain and check evidence, prepare the strongest truthful response supported by the facts, record what was sent, and guide the next step. Governing sources are the [parked register](../PARKED-ITEMS.md), [go-live register](../GO-LIVE-REGISTER.md), [decision log](../../Planning/00-DECISION/02-DECISION-LOG.md), [reasoning ledger](../DECISIONS.md) and [build amendments](../../Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md).

The founder approved C01–C16 on 9 November 2026, including the future design changes to collection, storage, analysis and service policy. These approvals govern later implementation and need not be requested again as general design decisions. The founder explicitly said not to implement now. Product changes, seller-data transfers, remote migrations, service activation, spending and deployment are not authorized by this approval. Future sellers must still authorize the applicable processing. Parked features retain their individual release requirements.

### Founder approval and timing

| Decisions | Recorded approval                                                                           | Timing                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01–C08   | Approved as described in Section 3, including the staged, task-specific reassessment in C04 | Implementation on hold; execute through the planned packages only after a later implementation instruction.                                                                                                                         |
| C09       | Approved in direction; Amazon API connection is for later, after a few sellers              | Deferred. No integration work, onboarding or spend now; not a prerequisite for the first expanded service. No exact seller count was set. Confirm later readiness with the founder and verify actual access/cost requirements then. |
| C10–C16   | Approved as described in Section 3                                                          | Implementation on hold; retain the scoped/later-service conditions and parked boundaries. C12 is clarified below.                                                                                                                   |

**C12 in plain language:** keep asking "Are sellers buying?" as a business question, and also measure "Are we helping them well?" through response quality, reliability, seller effort/completion, satisfaction and observed Amazon outcomes. Approval is to add that balanced scorecard, not remove sales tracking, invent approval probabilities or create a single unexplained success score. Detailed measures and pilot targets are settled in W00/W12; the direction is approved.

**C09 cost assumption:** the founder cited API cost as a reason to wait. This records the timing decision, not a verified claim that every Amazon API call has a fee. Check then-current API/access terms, hosting/queue costs and maintenance before any later commitment. No price or charge is assumed here.

## 1. Baseline and recommended delivery scope

The inspected checkout was at commit `515d4f1`, with the research blueprint and an unrelated wording-proposal HTML file untracked. The baseline below comes from focused source inspection, not a full audit or runtime test. No production configuration, live database, provider account or deployment was inspected.

**Recommended first complete journey:** an ordinary authenticity/sourcing document request, covering multiple products and suppliers and at least one prior response, without a fraud/forgery/child-safety allegation. This is a proposed pilot scope, subject to current target-market requirements and practitioner review. It exercises the most important gaps without requiring an Amazon integration or expert-sharing service. Existing routes outside the pilot continue to work and must not regress.

Build a complete journey for that scope, not a collection of isolated fields. Managed storage is an early architectural decision. Manual intake, document acquisition assistance and seller-controlled submission remain usable without an integration. Other case families are expanded after their requirements and evaluation cases are ready.

### Definition of done for the first expanded service

- A seller can choose the explained local or managed mode and continue without silent uploads, lost work or mixed-case data.
- The case connects each request, relevant incident, earlier submission, actual attachment version and reply; unknown links stay unknown.
- Relevant questions adapt to the facts already known and resolve material gaps without forcing admissions or treating unknown history as clean.
- Evidence coverage is checked per product and applicable period, with units, duplicate transactions and requested inventory reconciled.
- Missing evidence has a practical acquisition task and an honest unavailable-record path.
- The response uses supported facts, correct issue-specific positions and actual action states; review can trace consequential claims to their sources.
- Submission and follow-up preserve the seller's actual record and distinguish a pending response from a refusal.
- Access, processing, recovery, deletion, provider use and disclosures match the selected service.
- A realistic evaluation demonstrates the promised behaviour, and a consented pilot measures quality, seller effort and actual outcomes separately.

These conditions apply to enabling the expanded service. They do not retrospectively create new launch blockers for the current build.

## 2. What exists and what to reuse

Paths in this section exist in the inspected repository. New paths proposed later are explicitly marked proposed. Local implementation is not proof of production activation.

| Capability                                                    | Existing owner                                                                                                                                                                                                                                 | Reuse and required change                                                                                                                                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Case workspace and request/evidence/response/history surfaces | [CaseWorkspace](../../src/components/workspace/CaseWorkspace.tsx), `RequestReview.tsx`, `EvidenceReview.tsx`, `ResponseReview.tsx`, `PriorAttempts.tsx`, `ReplyDeltaReview.tsx` in the same directory                                          | Extend these surfaces. Extract storage and orchestration responsibilities incrementally; do not rebuild the whole interface or add a competing case page.                                                           |
| Response routing and specialist boundaries                    | [workspace core](../../src/core/workspace.ts), [response types](../../src/core/responseType.ts), [notice issues](../../src/core/noticeIssues.ts)                                                                                               | Preserve current protocols and explicit uncertainty. Add issue-specific positions and richer context without forcing all cases into a POA.                                                                          |
| Case requirements with source quote/revision                  | `Requirement` in `src/core/workspace.ts`                                                                                                                                                                                                       | Extend with stable request/product/period links and a distinction between file review and requirement satisfaction.                                                                                                 |
| Case types and validation                                     | [case file](../../src/core/caseFile.ts), [case schema](../../src/lib/caseSchema.ts), [workspace schema](../../src/lib/workspaceSchema.ts)                                                                                                      | Add a versioned migration and update types, schemas, serializers and fixtures together. Existing optional fields are not a substitute for a migration strategy.                                                     |
| Local case storage and active-case continuity                 | [caseStore](../../src/lib/caseStore.ts), [local vault](../../src/core/vault/vault.ts), [scoped vaults](../../src/lib/vault/scoped.ts)                                                                                                          | Keep guest/account isolation, explicit case IDs and atomic saves. Introduce a repository interface around these capabilities rather than dual-writing local and managed cases.                                      |
| Autosaved working fields                                      | [workspace drafts](../../src/lib/workspaceDraft.ts)                                                                                                                                                                                            | Preserve unsaved answers through navigation and auth. Extend draft keys for new question IDs; do not store a new plaintext copy.                                                                                    |
| Portable backup and restore                                   | [browser vault backup](../../src/lib/vault/browser.ts), `src/core/vault/envelope.ts`, `src/core/vault/crypto.ts`                                                                                                                               | Keep portable encrypted backup separate from the new managed store. Current cloud upload is a snapshot, not managed synchronization.                                                                                |
| Third-party waiting and reminders                             | `CaseLog.waitingOn`, `reminderAt`, `emailReminder` in `src/lib/caseStore.ts`; [reminder sync](../../src/lib/reminderSync.ts), `/api/reminders`                                                                                                 | Extend existing waiting semantics into tasks. Several emailed reminders per case remain P-07, not an implicit part of task creation.                                                                                |
| Business facts and facts ledger                               | `CaseFacts` in `workspace.ts`; [factsLedger](../../src/core/factsLedger.ts); `CaseFactsCard.tsx`                                                                                                                                               | Reuse the existing provenance and contradiction presentation. Add subjects, effective dates, versions and explicit resolution; matching strings or repeated readings do not establish independent corroboration.    |
| Document reading and comparison                               | [documentCheck](../../src/core/documentCheck.ts), [document context](../../src/lib/documentChecks/context.ts), [reader orchestration](../../src/lib/documentChecks/runCheck.ts), [read-document API](../../src/app/api/read-document/route.ts) | Extend source references and task-specific rules. Preserve readable/missing/unclear/conflicting distinctions and the prohibition on authenticity verdicts.                                                          |
| Quantity and date arithmetic                                  | [invoiceCoverage](../../src/core/invoiceCoverage.ts), [invoiceSums](../../src/core/invoiceSums.ts), `documentDate.ts`, `documentNoticeAnchor.test.ts`                                                                                          | Replace pooled coverage as a completeness indicator. Parameterize date requirements; separate issue-date eligibility, sales periods, stock coverage and deadlines.                                                  |
| Earlier submissions and actual sent wording                   | `Workspace.submissions`; [submission record builder](../../src/lib/submissionRecord.ts); `PriorAttempts.tsx`                                                                                                                                   | Reuse exact sent text, prepared-versus-sent distinction and attachment hashes. Add explicit reply links, evidence availability and source certainty.                                                                |
| Changes and duplicate warnings                                | [changeReport](../../src/core/changeReport.ts), [submissionNovelty](../../src/core/submissionNovelty.ts), [escalation](../../src/core/escalation.ts)                                                                                           | Extend to fact/promise consistency. Replace a fixed attempt threshold as the main trigger with reply-specific next-step assessment; unchanged requested resubmissions remain possible.                              |
| Compose boundary and model input                              | [composeRequest](../../src/lib/composeRequest.ts), `composePayloadWorkspace` in `workspace.ts`; [draftRequest](../../src/lib/draftRequest.ts), [compose API](../../src/app/api/compose/route.ts)                                               | Replace spread-and-exclude payload construction with explicit purpose-specific contracts. Add authorized relevant history; preserve route and entitlement parity.                                                   |
| Drafting, wording and checks                                  | [draftResponse](../../src/lib/llm/draftResponse.ts), [draftOther](../../src/lib/llm/draftOther.ts), `improveWording.ts`, [draftVerification](../../src/core/draftVerification.ts), `wordingLock.ts`                                            | Keep current supported drafting/fallback paths. Add response planning and source-aware review; do not replace checks with a more elaborate prompt alone.                                                            |
| Provider selection and budgets                                | [AI adapter](../../src/lib/llm/ai.ts), [provider registry](../../src/content/aiProviders.ts), `src/lib/ratelimit.ts`                                                                                                                           | Extend permission checks, task capability and evaluation versioning. Gemini/Groq code availability is not proof that either is enabled in production.                                                               |
| Draft cache                                                   | [draftCache](../../src/lib/draftCache.ts)                                                                                                                                                                                                      | Existing Redis draft results have a 24-hour TTL and user-scoped request hash. Add model/prompt/rule/snapshot/permission versions and case-scoped deletion. Do not mistake a hashed cache key for anonymous content. |
| Evidence manifest and ZIP                                     | [evidence manifest](../../src/lib/evidencePack.ts), [pack file](../../src/lib/evidencePackFile.ts)                                                                                                                                             | P-10 is already released and built. Extend its actual-version checks and the handling of permitted submission copies; do not build another pack generator.                                                          |
| Anonymous outcomes and linked rebate reports                  | [anonymous outcome route](../../src/app/api/outcome/route.ts), [rebate report route](../../src/app/api/outcome/report/route.ts), `src/core/outcomeModel.ts`                                                                                    | Keep both existing purposes separate. A consented research journey requires a new record/purpose; neither existing endpoint is that dataset.                                                                        |
| Auth, case entitlements and payment processing                | `src/lib/auth.ts`, `license.ts`, `caseRounds.ts`; existing checkout/Paddle routes                                                                                                                                                              | Reuse account ownership, case IDs and entitlement lifecycle. Cloud migration must not create a new paid case or consume another response round.                                                                     |
| Legal/product copy                                            | [legal content](../../src/content/legal.ts), `aiProviders.ts`, `workspace.ts`, `support.ts`, `surfaces.ts`                                                                                                                                     | Update the actual data-handling and service claims with each capability activation, including cache/provider handling.                                                                                              |
| Operational verification                                      | [CI](../../.github/workflows/ci.yml), [backup workflow](../../.github/workflows/backup.yml), policy-watch/review scripts, existing jobs and `/api/health`                                                                                      | Extend existing CI and operational checks. Backing up database rows alone will not restore a new managed document store.                                                                                            |

### Concrete baseline limitations

`CaseFacts` currently holds business name/address, supplier names and a single units-sold figure. Replies have no explicit submission ID in the inspected type. Coverage pools readable invoice quantities and excludes dates marked conflicting, but an absent/unassessed date is not itself excluded by that aggregation. `invoiceSums` still has a fixed 365-day constant. These are specific implementation targets, not evidence that every existing case assessment is wrong.

The local facts ledger already compares recorded values. Its limitation is the absence of a connected, versioned account-history model and rich claim/action relationships; the plan must not describe contradiction detection as entirely missing.

## 3. Approved decisions to amend or retain

The following decision IDs are plan-local identifiers, not PARKED release codes. All sixteen are approved design decisions dated 9 November 2026. Their effects remain unbuilt; implementation is on hold. The detailed technical contracts and operational policy values still require the planned verification, but the approved direction must not be treated as undecided.

| ID  | Earlier decision or behaviour                                              | Approved disposition                                                                                             | Owning records and implementation consequence                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 | D6 local-first always; AM-21 rejection of server drafts                    | Amend to explicit local and managed case modes, with managed continuity recommended for the full service         | Append a dated amendment to `Planning/00-DECISION/02-DECISION-LOG.md`, `docs/DECISIONS.md`, the build amendments and `CLAUDE.md`; update vault/service disclosures at activation. Preserve guest/local access.                                  |
| C02 | Prior full submission text never leaves the device                         | Allow seller-selected relevant history for the defined case-analysis purpose                                     | Replace payload exclusions with allowlists and source/version references; update privacy and request-capture tests. Do not upload existing cases by default.                                                                                    |
| C03 | Document reading is transient and AppealDeck keeps no copy                 | Retain transient checks for local cases; add explicit stored evidence for managed cases                          | Separate API/storage paths and disclosures. The current blanket sentence becomes mode-specific.                                                                                                                                                 |
| C04 | Identity, financial and address documents are browser-only                 | Reassess by task; keep the current boundary for the initial pilot, design protected expansion as a later package | No simple constant removal. State a real task benefit, appropriate basis, processor/access limits and evaluation before enabling a category.                                                                                                    |
| C05 | AM-17 fixed guided flow, no general chat                                   | Retain bounded case guidance; replace static question selection with a versioned adaptive question protocol      | Build relevant follow-ups, extraction confirmation and unknown answers. A general-purpose chat surface is not required.                                                                                                                         |
| C06 | Case-wide accept/dispute/unsure                                            | Extend to positions per issue; retain case-level value only as a compatibility summary                           | Update route, response planning, UI, export and tests so one admission cannot leak across allegations.                                                                                                                                          |
| C07 | Hard-coded default evidence periods and pooled sales total                 | Use sourced applicable rules and confirmed product-specific mappings                                             | Update `evidenceModel`, document context/comparison, coverage, arithmetic copy and all downstream summaries together.                                                                                                                           |
| C08 | Fixed two-attempt change-of-approach cue                                   | Make actual reply, pending state, unresolved requirements and changed evidence drive the cue                     | Keep attempt counts as context. A threshold is not a cap, outcome prediction or automatic escalation instruction.                                                                                                                               |
| C09 | D7 broad SP-API deferral; AM-27 no page access                             | Approved: authorized read-only API direction; deferred until a few sellers                                       | Do not start integration/onboarding/spending now. At the later milestone, confirm readiness and verify actual costs, terms, roles and coverage. Keep manual intake, no scraping/injection and no automatic submission.                          |
| C10 | Anonymous-only outcome learning                                            | Retain anonymous reporting; add separately authorized linked research journeys                                   | Add a separate purpose/schema and evaluator access. No default cross-client training or research retrieval. P-13 public results remains parked.                                                                                                 |
| C11 | D9 Gemini-only language, low-cost shallow context                          | State approved provider/task capability with bounded effort based on measured complexity                         | Reconcile the decision log with the existing provider adapter. Check each enabled provider's terms/settings, not just its name in a registry.                                                                                                   |
| C12 | D10 paid Passes/week as north-star                                         | Approved: retain sales tracking and add a balanced service-quality scorecard                                     | Measure whether sellers buy and whether the service helps them: response quality, reliability, effort/completion, satisfaction and observed Amazon outcomes. Set detailed targets in W00/W12; no single invented score or approval probability. |
| C13 | D5 collaborator controls; D7 deferred expert/agency service                | Retain agreements and qualification requirements; investigate human review as a separately scoped service        | Define capacity, access, terms and payment eligibility before offering it. Owner-only managed cases do not automatically authorize team sharing.                                                                                                |
| C14 | Local ZIP export and review status imply files are ready to use            | Retain the released pack; add confirmation against the destination's actual constraints and file versions        | Preserve originals. Identify any reduced/annotated copies and test that material content remains readable. No universal Amazon upload-size claim.                                                                                               |
| C15 | Support and privacy descriptions reflect current local/transient operation | Replace with mode-specific capability, access, retention and recovery descriptions at activation                 | Update `src/content/legal.ts`, support/FAQ/sales copy and operational runbooks together. No promise of support capacity not staffed.                                                                                                            |
| C16 | Retention, managed-storage entitlement and support level are undefined     | Set explicit service policy before managed activation                                                            | Founder/operator decide terms, service limits, retention, closure/reopening and support targets using actual costs and legal review. Do not silently narrow the current Pass coverage or add a new price.                                       |

### Approved scope and protections to retain

Retain truthful claims, no invented admissions/documents/actions, no authenticity certification or unsupported outcome probabilities, specialist boundaries unless explicitly revised, account/case isolation, provenance, seller review of what is submitted and existing payment/refund integrity. Preserve D8's current refund terms unless separately changed. Read-only API research does not authorize automatic Amazon submission, supplier contact or other external messages.

Do not rewrite historical decisions to conceal their former scope. The dated approval entries in the decision/reasoning logs identify this approved future direction; existing code still follows the current implementation until execution. `docs/GO-LIVE-REGISTER.md` remains the record for the current deployment; update it only when the implementation actually changes launch steps.

## 4. Target architecture and ownership

### One domain model and one authoritative mode per case

Use a versioned case aggregate, read through a storage interface with local and managed implementations. Pure routing, requirement, evidence and response logic remains in `src/core/`. Storage/auth/network orchestration remains outside it.

For a **local case**, the encrypted vault remains authoritative. Transient server/model processing occurs only under its disclosed task; selected processing does not convert the case into a managed one.

For a **managed case**, the server record is authoritative. Browser changes are tracked as a pending save against a known revision. An acknowledged server save becomes durable state; a queued local edit must not be shown as saved to the cloud. Do not implement a second full offline managed database or background service worker as part of this foundation; P-05 remains separate.

Keep the existing case ID when migrating so entitlement, reminders and existing references remain connected. The storage mode is a capability decision, not a new case identity. Do not expose service keys to the browser or treat a case ID supplied by the client as proof of ownership.

### Proposed module boundaries

Names below are proposed locations, not existing capabilities:

- `src/core/caseModelV2.ts` and `src/core/caseMigration.ts`: versioned aggregate and deterministic legacy adaptation.
- `src/core/caseRequirements.ts`, `caseConsistency.ts`, `caseQuestions.ts`, `evidenceAcquisition.ts`: pure decisions over the case model, integrated with existing core functions.
- `src/lib/cases/repository.ts`, `localRepository.ts`, `managedRepository.ts`: a shared application-facing contract backed by the existing vault or authenticated APIs.
- `src/lib/cases/permissions.ts`, `payloads.ts`, `artifacts.ts`: purpose checks, allowlists and versioned result identity.
- `src/lib/cases/jobs.ts` plus a bounded server worker: durable processing state and retries.
- `src/components/workspace/` remains the UI home; new focused components use these interfaces rather than adding more direct persistence logic to `CaseWorkspace.tsx`.

Names can be adjusted during implementation, but these responsibility boundaries should remain. Do not perform a large cosmetic refactor before the storage/contract tests exist.

### Proposed managed persistence

Use Postgres for case metadata and bounded structured content, and a new private object bucket for authorized original/derived files. Do not repurpose `appealdeck-vault`, whose contents are portable encrypted backups.

| Proposed table           | Role and key constraints                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `managed_cases`          | Account owner, stable case ID, schema version, aggregate revision, lifecycle/storage state and bounded case JSON. Unique owner/case; optimistic revision check. Initial access is owner-only. |
| `case_documents`         | Stable document identity, case owner/reference and logical transaction linkage where known. Not a second editable source of extracted facts.                                                  |
| `case_document_versions` | Immutable byte-version metadata, storage path, digest, MIME/size, original/derived relationship and processing eligibility. Every version resolves to an authorized case.                     |
| `case_processing_jobs`   | Authorized purpose, input snapshot/version, idempotency key, lease, attempts, status and content-free error classification. No model prompt in logs.                                          |
| `case_artifacts`         | Immutable analysis/draft/review result, input references, schema/model/prompt/rule versions and stale/current status. Finalized submission snapshots remain immutable.                        |
| `case_permission_events` | Versioned disclosure, purpose/data category/recipient scope, grant/revocation and actor. This records product authority; legal-basis assessment is documented separately.                     |
| `case_audit_events`      | Minimal storage/access/migration/deletion/security events with actor and references. Do not duplicate private evidence bodies into audit logs.                                                |
| `case_deletion_requests` | Idempotent purge progress covering database, objects, caches, queued work and backup-expiry accounting.                                                                                       |

Store incident, question-answer, task and claim relationships inside the versioned aggregate initially. Add normalized projections only when a verified query or workflow needs them. This avoids multiple independent authoritative copies of the same case facts. A later linked research table is separate from service storage.

RLS must scope every table/object to its owner and case. Privileged workers must additionally enforce purpose, eligibility and current version before access because administrative credentials can bypass RLS. Object paths are not permissions. Signed URLs are short-lived bearer access, not proof of permanent authorization.

For managed files, select supported platform encryption/key management and document who can decrypt them. Do not invent custom cryptography or describe server-readable storage as seller-only end-to-end encryption. Preserve the existing portable-backup cryptography for that separate purpose.

## 5. Case data contracts and compatibility

Add version 2 through an explicit read/migrate/write path. Preserve current version-1 cases and portable backups. Unknown legacy facts stay unknown; the migration cannot reconstruct missing dates, product allocations or reply relationships.

| Contract             | Fields/relationships needed                                                                                                                 | Compatibility rule                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Request and rule     | Stable request ID, original wording/form, received/notified dates, market/scope, source/version; individual requirement periods and anchors | Adapt current notice and `previousRequests` into linked records without reclassifying history as a new Amazon request. |
| Issue and position   | Issue ID, allegation source, accept/dispute/unsure/partial position, supporting or conflicting claim IDs                                    | Keep current case position for legacy readers during transition; derive summaries without overwriting issue detail.    |
| Incident history     | Distinct incident ID, policy, dates, finding state, Repeat label, earlier corrections and unresolved status                                 | Several messages can concern one incident. Never infer a clean history or an admitted finding from a missing answer.   |
| Claim and source     | Subject/product, value, effective time, source/version/page or text span, seller confirmation and correction history                        | Extend existing facts-ledger semantics. A second extraction of one record is not another independent source.           |
| Document observation | Exact version and cited region/quote, extraction method, readability and field state                                                        | Preserve existing saved readings; legacy findings without richer references remain limited, not upgraded.              |
| Product coverage     | Product/ASIN mapping, line identifier, quantity/unit conversion, sales period, stock requirement and transaction identity                   | Legacy pooled `unitsSold` can be displayed as historical context; it cannot be automatically allocated to products.    |
| Action               | Actual/planned/unavailable state, owner/role, effective/completion date, support and attestation version                                    | Do not upgrade a written SOP or seller intention to completed implementation.                                          |
| Question/answer      | Stable question/version ID, applicability reason, answer and source/confirmation state                                                      | Keep text-keyed questionnaire answers readable; no destructive key replacement or silent stripping.                    |
| Acquisition task     | Requirement, recipient role/contact if needed, truthful draft, seller-reported send state, received record and follow-up                    | Adapt `CaseLog.waitingOn` as one imported waiting item; do not invent tasks or sent dates from it.                     |
| Submission/reply     | Immutable text and attachment versions; prepared-versus-sent distinction; result and explicit or uncertain link                             | Preserve existing IDs and exact wording; auto-link only when evidence supports it and allow correction.                |
| Analysis snapshot    | Aggregate revision, document versions and rule/prompt/model/purpose versions                                                                | A result for an older input is stale; final review approval cannot survive material changes.                           |
| Storage/permission   | Local/managed state, migration receipt, purpose/disclosure/version and transfer selection                                                   | Existing sign-in, purchase or backup permissions do not authorize managed migration or research.                       |

Use stable IDs rather than mutable labels for relationships. Validate cross-record references, ownership, duplicates, size/count bounds and allowed transitions. Update type definitions, Zod schemas, exports, imports and fixtures in the same package so newly added fields survive save/reload and do not leak into unrelated payloads.

### Required request boundaries

Define separate allowlisted shapes for local storage, managed save, document analysis, history analysis, draft planning/generation, research, export, metrics and logs. A schema accepting a field is not authorization to send it. Build requests from approved fields; do not copy the aggregate and delete a handful of properties.

Keep selected full history available to the investigation stage when authorized. Give drafting the supported working record and relevant passages. Preserve route-critical facts and existing entitlement checks when replacing `composePayloadWorkspace`; a trimmed payload must still produce the same permitted route as the displayed case.

## 6. Planned work packages

Every package below is unstarted. Sizes describe relative implementation and review effort, not calendar promises. The engineering owner implements; the founder approves service/decision scope; a qualified domain reviewer validates case rules; the operator owns production processes. One person may hold several roles.

### W00 Service decisions and verified baseline

**Size M. Dependencies none. Owners founder, engineering, domain reviewer.**

- Confirm the first case family and current target-market forms/rules using authenticated primary material. Capture source/version/applicability rather than promoting snippets to policy.
- Carry the approved C01–C16 direction into implementation contracts without asking for the same general approvals again. Set the remaining detailed policy values, first-release sequencing and evidence requirements. Preserve C04/C10/C13's scoped conditions and C09's explicit deferral until a few sellers; no early integration track or spend.
- Define managed/local feature availability, storage entitlement, allowed processing, support scope, retention/deletion/closure policy, hosting region, provider terms and pilot targets.
- Confirm current CI/runtime baseline when implementation begins. Reconcile migration `0027` with live history; the inspected register confirms only through `0026`. Reserve actual next migration numbers only then.
- Use the recorded 9 November approvals when completing detailed amendments and the capability/disclosure inventory. Do not mark any capability built before implementation.

**Exit:** one signed-off decision pack, current rule sources, data-flow map, selected evaluation cases and no hidden architectural assumption affecting W01–W04. Retention periods and support targets are explicit service decisions, not invented legal defaults.

### W01 Explicit payload and permission boundaries

**Size M. Depends W00. Owner engineering.**

- Replace `composePayloadWorkspace` spread/exclusion behaviour with allowlists; preserve routing, D6 and round facts.
- Introduce purpose-scoped permission evaluation and recipient/task capabilities around `composeRequest`, `draftRequest`, document checks and `ai.ts`.
- Include explicit selection for historical wording; preserve local-only operation where permission is absent.
- Update cache identity to include case/snapshot, purpose and relevant model/prompt/rule versions. Add invalidation/deletion ownership, including cached drafts containing private text.

**Exit:** request-capture tests show what reaches application server, provider, Redis and logs for every mode; an added model field cannot leak automatically. Revocation/fallback/retry behaviour matches the selected scope.

### W02 Versioned case model and legacy migration

**Size L. Depends W00, W01 contracts. Owner engineering.**

- Add the v2 contracts in Section 5, keeping current pure core logic where valid.
- Extend facts ledger, requirement sources, issue positions and explicit submission/reply relationships.
- Write deterministic migration adapters for existing case files/logs/workspaces and exports; retain original evidence and sent text.
- Make read-only projections available to existing components before switching their write paths. Avoid two writable domain models.

**Exit:** representative old vaults/imports survive read/save/export/reload; unknowns remain unknown; no schema stripping, changed case IDs, relabelled submissions or duplicate incidents.

### W03 Managed database and file storage

**Size L. Depends W00–W02. Owner engineering; production operator later.**

- Create additive migrations for the proposed tables/private bucket with RLS, indexes, ownership checks and bounded content.
- Add proposed `/api/cases` and `/api/cases/[caseId]` read/write contracts, revision-checked writes and idempotent create/migration requests.
- Add staged document upload/finalization and immutable version registration. Validate declared/actual type, size, quarantine/scan handling and authorized purpose before processing.
- Keep local portable backup paths separate. Add deletion tracking and original/derived object relationships.

**Exit:** unauthorized owner/case access, path spoofing, reused upload tokens and privileged-worker scope violations fail. Interrupted upload/finalization is recoverable without falsely showing a reviewed file. SQL checks run in isolated test infrastructure before any remote application.

### W04 Repository integration and explicit migration

**Size L. Depends W02–W03. Owner engineering.**

- Introduce local/managed repository implementations beneath `CaseWorkspace`, case summaries and dashboard operations; preserve guest-to-account flow.
- Preserve stable case IDs and current Pass association. Track pending save, saved revision, conflicts and recoverable failure.
- Implement selected-case migration: preview, permission, authorized upload, verification receipt, then authoritative-mode switch. Keep the local source until verification and seller choice.
- Support exports and cloud-to-local exit with explicit consequences. Test large/partial cases and account switching.

**Exit:** migration does not consume a round, duplicate a case or change entitlement. Two tabs/devices cannot silently overwrite each other. Failed migration leaves the original usable. Clearing browser data does not erase an acknowledged managed case.

### W05 Applicable requirements and per-product evidence

**Size L. Depends W02 and W00 rules; UI wiring after W04. Owners engineering/domain reviewer.**

- Add source-qualified requirement rules and separate invoice issue-date window, sales coverage, stock request and submission deadlines.
- Extend document context, `documentCheck`, `invoiceCoverage`, `invoiceSums` and `CaseFactsCard` with product/line/period and unit mappings.
- Reconcile seller/Amazon quantities separately; identify exact duplicate files and reissues of the same transaction.
- Do not count unknown eligibility dates, unreadable amounts or unrelated product lines as established coverage. Require confirmation for conversions/bundles.
- Keep fingerprints and visible arithmetic aligned across evidence view, response review and export.

**Exit:** the blueprint's A/B product example identifies B's shortfall even when pooled totals are sufficient. Conflicting/unknown periods are visible, and no output claims authenticity or Amazon acceptance.

### W06 Connected history and consistency

**Size L. Depends W02, W05 source relationships. Owner engineering/domain reviewer.**

- Extend `PriorAttempts`, history/reply views and existing facts ledger with incidents, earlier promises, effective dates and actual evidence versions.
- Ask about relevant repeated incidents, their accepted/disputed/unknown status, Repeat labels and whether earlier corrections happened.
- Show contradictions with both sources; allow supported explanations, corrections and unresolved states. Preserve allegations separately from findings.
- Replace automatic assumptions about denial/escalation with explicit reply status and association. Keep pending and requested resubmission paths.

**Exit:** delayed billing/reissued records do not establish deception; a disputed finding does not become an admission; out-of-order replies can be corrected; earlier unavailable attachments remain visibly unavailable.

### W07 Adaptive intake and case progress

**Size L. Depends W02, W05–W06. Owner engineering with seller/domain review.**

- Implement a question protocol with stable IDs, applicability, decision changed, answer options, source and revalidation rules.
- Reuse confirmed facts and suggest extracted answers for confirmation. Ask focused follow-ups instead of requiring the seller to write a final root cause before investigation.
- Add issue-specific positions, unknown/unavailable states and action-completion questions. Preserve original wording and allow edits.
- Integrate into existing workspace surfaces with accessible labels/errors, draft preservation and clear next actions. Use work-completion language rather than approval percentages.

**Exit:** paired cases with relevant history get different questions; irrelevant age/revenue changes do not invent new requirements. The seller can pause, return and correct the record without repeating the whole intake.

### W08 Missing-evidence assistance

**Size M. Depends W05–W07. Owner engineering/domain reviewer.**

- Extend requirements and `waitingOn` into acquisition tasks with recipient role, precise missing item, reason, truthful request draft and received result.
- Reuse the blueprint's supplier/authorization/clarification patterns with case-specific confirmed values. Mark unknown values for completion rather than fabricating them.
- Support seller-reported sent/waiting/received/cannot-obtain states and in-app follow-up dates. Do not infer an email was sent from copying a draft.
- Recheck received evidence against the requirement; show honest alternatives where allowed. No supplier outreach or automated chase is performed by this package.

**Exit:** a missing document becomes an actionable task, a request cannot backdate or invent authority, and receiving an irrelevant record cannot complete the requirement. Several emailed reminders require P-07 separately.

### W09 Durable analysis and response review

**Size L. Depends W01–W08. Owner engineering/domain reviewer.**

- Introduce versioned stages for request analysis, history/evidence investigation, response plan, drafting and independent challenge; reuse existing drafting/verification functions.
- Add durable jobs for managed cases, scoped purpose/version checks, idempotency, bounded attempts, cancellation and stale-input handling.
- Select context and review depth by case requirements and evaluated failure modes; log versions and content-free operational signals.
- Keep local-case synchronous/transient paths where appropriate. Use existing provider adapter, breakers and rate controls; do not add a provider merely for perceived prestige.
- Allow seller-reviewed final content only after relevant checks; keep limitations visible and useful deterministic fallback work available.

**Exit:** fabricated dates/actions/admissions and wrong-route drafting are rejected by the evaluation. A stale or cancelled job cannot replace current content. A processing retry cannot create another paid round or duplicate a submission.

### W10 Submission package and connected follow-up

**Size M. Depends W06, W08–W09. Owner engineering/domain reviewer.**

- Extend `ResponseReview`, `buildSubmission`, evidence ZIP/manifest and history to confirm actual content and attachment versions.
- Record prepared/copied/seller-reported sent and externally evidenced status separately. Preserve seller edits and the available receipt.
- Link replies to submissions, extract explicit new requests and present uncertain interpretations as such.
- Generate next actions from actual gaps/available routes; modify `escalation.ts` so attempt count is context rather than a universal trigger.

**Exit:** final review is invalidated by material edits; a Copy action never becomes Sent; an unchanged requested resubmission is allowed; final/unclear replies remain correctable.

### W11 Service policy, billing compatibility and recovery

**Size L. Starts with W00; activation depends W03–W10. Owners founder/operator/engineering.**

- Implement the selected retention, closure/reopening, data access, export, research separation and deletion policies, including caches and derived content.
- Extend backup/restore to cover new database content and private objects consistently, plus required keys/secrets. A dump of object metadata does not recover object bytes.
- Update mode-specific privacy/Terms, point-of-use explanations, FAQ/support/sales copy and provider disclosures. Resolve Groq's null terms metadata before expanded routing relies on it.
- Preserve purchase/refund/round semantics and case IDs. Define managed retention/support availability for refunded/expired access without conflating payment cancellation with deletion.
- Define staffed support responsibilities, response expectations and incident recovery. No founder/admin UI or expert-access surface is silently introduced.

**Exit:** disclosures match captured requests and storage, deletion is demonstrable, restore drill recovers a case and its exact evidence, and all payment/refund regression checks pass.

### W12 Whole-journey evaluation and staged activation

**Size L and ongoing. Fixture design begins W00; release depends W01–W11. Owners engineering, independent domain reviewer, founder/operator.**

- Implement the blueprint's 24 scenarios plus the contracts and failure cases in Section 10 below.
- Compare current and expanded journeys on seller-disjoint cases with expert review, including rejected, pending, incomplete and disputed cases.
- Establish actual baseline/targets before the pilot. Measure quality, effort, operational reliability, satisfaction and observed Amazon results separately.
- Run migration/restore/revocation/failure drills, accessibility and signed-in cross-browser journeys.
- Enable only the verified scope for explicitly enrolled sellers. Define correction/rollback handling and monitoring before activation.

**Exit:** no unresolved critical factual/access/permission failures in the release set, documented residual limitations, real support coverage and a founder-reviewed pilot record. Software correctness is not an approval-rate claim.

### W13 Later capabilities and parked boundaries

**Approved design directions retain their stated scope and timing; implementation remains on hold. These capabilities are not required for the first journey. Separately parked features still require their own releases.**

- **Read-only SP-API:** R-9/C09 is approved in direction but explicitly deferred until a few sellers. No implementation, onboarding or spending now. At the later founder-confirmed milestone, verify actual access/cost requirements, authorized support/Account Health coverage, expired content, roles, revocation and marketplace association. Import into the same provenance model. No scraping or automatic submission.
- **Email forwarding:** P-04; sender authenticity, malware/abuse, aliases, deduplication, attachments and permission require their own design/release.
- **Sensitive-document content processing:** C04; task-specific necessity, legal/processor review, protected routing, minimum excerpts and independent evaluation.
- **Human expert review/sharing:** C13/P-03; contracts, qualifications, payment scope, expiring permission and access records. P-02 governs a founder admin view.
- **Linked case research:** C10; separate consent/authority, dataset access/deletion, purpose and evaluation split. Do not retrofit raw case text into anonymous or rebate endpoints.
- **Additional reminders, offline shell, automatic encrypted backup, verification taxonomy and public results:** their respective P codes and conditions, listed in Section 13.

Each later capability requires its own deliverable, source verification, tests, policy/disclosure update and activation decision. None should become a hidden prerequisite for delivering the main service.

## 7. Dependency order and reviewable batches

| Batch | Packages                               | Reviewable result                                                                                                                      |
| ----- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | W00 and W12 fixture/baseline design    | Approved C01–C16 carried into detailed contracts (C09 deferred), source-qualified first-case rules, data flow and baseline evaluation. |
| 2     | W01–W02                                | Safe request contracts and a backward-compatible case model, without enabling managed collection.                                      |
| 3     | W03–W04 plus W11 infrastructure design | Isolated managed storage, recoverable case saves and opt-in migration in test infrastructure.                                          |
| 4     | W05–W08                                | End-to-end investigation: applicable requirements, evidence coverage, history, adaptive questions and acquisition tasks.               |
| 5     | W09–W10                                | Source-aware response planning/review, final package and connected follow-up.                                                          |
| 6     | W11–W12 release work                   | Disclosure parity, support, restore/deletion drills, evaluation and controlled pilot.                                                  |
| Later | Individually selected W13 tracks       | Verified convenience or deeper-service capabilities without losing the core case record.                                               |

Use small cohesive changes within each batch. Every state/schema change must include compatibility and persistence checks; every data-transfer change includes its disclosure and capture tests. Do not postpone security, migration or copy parity to the end because the UI appears finished.

## 8. API and processing contracts to specify before coding

These are proposed contracts; exact endpoint naming can follow repository conventions.

| Operation                       | Required server checks and behaviour                                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create/read/update managed case | Authenticated owner; allowed mode; valid bounded schema; expected aggregate revision; stable case ID; idempotency; no payment claim derived solely from request data.       |
| Upload/finalize a document      | Case ownership and selected purpose; MIME/signature/size checks; private staging; version hash; scan/quarantine status; finalization receipt; cleanup of abandoned objects. |
| Start analysis                  | Current case/snapshot/document version; permitted task/provider; applicable entitlement and budget; disclosure/permission state; deduplicated job.                          |
| Poll/cancel job                 | Owner/case authorization; content-free pending/error state; cancellation prevents further optional transfer where still possible.                                           |
| Prepare response                | Existing route and D6 checks; trusted case ownership in managed mode; supported inputs; current review artifacts; existing license/round contract.                          |
| Record submission/reply         | Explicit actor statement/evidence; stable case/version; actual text/files; uncertain association allowed; no inferred Sent state.                                           |
| Export/delete/downgrade mode    | Owner reauthorization as appropriate; relevant file versions; purge/cancellation progress; explicit local export and managed-exit consequences.                             |
| Research share                  | Separate purpose and record; minimum approved selection; no accidental case-text transfer to anonymous metrics.                                                             |

Do not let a server API accept a caller-selected storage path, owner ID, privileged role or provider as authority. Validate referential integrity and use server-resolved identities. Existing auth/ratelimit helpers are starting points, not complete authorization for these new operations.

Long-running work must use a durable lease and resumable job state. Choose one supported worker/queue arrangement against actual hosting limits during W00; do not hold an HTTP request open and assume completion. Preserve a job's snapshot so a later input edit cannot silently change what a retry analyzes. A scheduled wake-up can use existing job conventions if it satisfies measured latency and recovery needs.

### State transitions and invalidation

| Record            | Proposed states and transition rules                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed migration | Selected, permission confirmed, uploading, verifying, acknowledged, mode switched; failed/cancelled paths preserve the local source. Only acknowledgement permits the switch.             |
| Document version  | Staged, quarantined/checking, eligible, rejected or deleted. Reviewed/sufficient are separate case judgments; receiving bytes is not successful validation.                               |
| Processing job    | Queued, running with lease, succeeded, retryable failure, terminal failure, cancel requested/cancelled or stale. Only a matching input/permission version can produce a current artifact. |
| Acquisition task  | Needed, draft prepared, seller-reported sent, waiting, record received, requirement resolved, cannot obtain or cancelled. A received record must be checked before resolution.            |
| Response          | Working, checked against snapshot, seller confirmed, then actual submission status. Material changes invalidate the affected check/confirmation; copying does not submit.                 |
| Deletion          | Requested, future processing stopped, active purge, verified active-store deletion, backup expiry pending, complete under the disclosed policy. Partial failure is retryable and visible. |

Before an artifact updates the case, compare aggregate revision, referenced document versions, applicable rule version and permission epoch. Record stale results without presenting them as current. A payment reversal can remove a paid processing entitlement, but must not accidentally prevent the owner's applicable export/deletion rights; cancelled jobs and data lifecycle must be handled explicitly.

### Limits and operating budgets

Define and test file size/type/page limits, per-case storage limits, bounded aggregate/question/history sizes, per-task context/output limits, retry caps and daily processing budgets. Start from the existing reader/API limits and measured representative cases; do not bypass them by posting an entire vault or increasing a request cap without testing host/provider capacity. Select actual limits in W00 and expose a useful alternative when a file or case exceeds one.

Keep bulk document bytes outside case JSON and send only the approved task inputs. Track cost/latency with identifiers and aggregate technical metrics, not evidence content. Worker leases, concurrency limits and per-account fairness must prevent a large case from starving another seller. Price or quota changes require their own service decision and accurate point-of-sale copy.

## 9. Migration, rollback and destructive actions

### Local model upgrade

Read the legacy record, validate it, build v2 deterministically and verify preservation before committing the new local representation atomically. Retain recoverable original data until the migration is verified. Preserve IDs, created dates, actual submissions, hashes and unanswered questions. A missing attachment is a limitation, not a fabricated file reference.

### Selected local to managed migration

Preview selected records and purposes; get the seller's specific migration choice; upload privately; verify hashes and complete metadata; create the managed aggregate; receive an acknowledgement; then switch that case's authoritative mode. Make retry idempotent. A failed or partially authorized migration keeps the original local case usable. Explain how any retained local copy will be handled and avoid leaving two writable copies.

### Managed revision/conflict recovery

Require the last acknowledged revision for writes. On conflict, keep the unsaved edit, load the newer case and offer a clear merge/correction path; do not use last-writer-wins for submissions or evidence. Multi-device convergence means no silent loss, not full real-time collaboration.

### Rollback

Use additive database changes and capability flags scoped to the expanded service. Proposed flags include managed mode, history transfer, adaptive intake, deeper analysis and linked research; all start off. Keep v2 readers available if v2 records have been written. Turning off managed writes should leave authenticated read/export/recovery available; disabling a feature must not strand seller data.

Disable a faulty model stage/provider and preserve inputs for the permitted correction process. Revert generation behaviour without replaying sent submissions or restoring revoked permission. Destructive schema removal, purging and remote deployment each require the relevant explicit implementation/release authorization.

### Delete and revoke

Make deletion idempotent across source/derived objects, structured case content, search projections, artifacts, draft caches and queued jobs. Record a minimal purge receipt and backup-expiry accounting without retaining the deleted evidence in an audit body. Permission withdrawal stops future optional processing; it cannot recall content already sent to Amazon or erase provider logs outside the available controls. Billing records follow their own applicable retention, not case evidence retention.

## 10. Validation and release evidence

The blueprint's 24 scenarios are required inputs to the evaluation, not tests already present. Existing test files cover parts of the old behaviour; they must be extended meaningfully rather than counted as proof of new capabilities.

| Test group                      | Required evidence                                                                                                          | Existing homes to extend                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Model/schema compatibility      | Legacy import/save/export round-trip, preserved unknowns, references and schema parity                                     | `src/lib/caseSchema.test.ts`, `workspaceSchema.parity.test.ts`, existing vault migration/backup tests.                                       |
| Access and transfer             | Cross-account/case denial, privileged worker scope, revoked/absent permission, fallback/retry, local-only capture          | Compose/read-document API tests, scoped vault tests, provider tests; new managed API/SQL tests.                                              |
| Rules and evidence              | Product coverage, units, transaction reissues, independent periods, ambiguous dates and inventory requirements             | `invoiceCoverage.test.ts`, `invoiceSums.test.ts`, document-context/date/check tests.                                                         |
| History and questions           | Repeat incidents, partial disputes, promised-versus-done actions, source contradictions and irrelevant paired-case changes | Workspace/facts-ledger/change-report/novelty tests; proposed question/consistency tests.                                                     |
| Persistence and jobs            | Interrupted migration, stale results, duplicate job/retry, revision conflicts, navigation and account switches             | Case-store atomicity tests, new repository/job tests, signed-in journeys.                                                                    |
| Draft and final review          | Invented fact/admission rejection, actual request coverage, correct versions and invalidation after material changes       | `draftVerification.test.ts`, draft model tests, compose-gate/AI tests, response continuity E2E.                                              |
| Billing compatibility           | Stable case IDs, unchanged entitlements/refunds, no extra round on retry/migration, deletion versus cancellation           | Existing payment SQL, case-round, entitlement lifecycle and checkout tests.                                                                  |
| Whole journey and accessibility | Notice to acquisition to response to reply; save failures, mobile, keyboard/screen-reader semantics and error recovery     | `e2e/workspace.spec.ts`, `journey.spec.ts`, `check-invoice.spec.ts`, `response-continuity.spec.ts`, backup/restore and accessibility suites. |
| Operations                      | Restorable DB plus objects, purge proof, quarantine failures, task budgets and recovery                                    | Existing backup/job patterns plus isolated restore and retention drills.                                                                     |
| Pilot quality                   | Independent review, seller-disjoint data, full denominators, dropouts, effort/satisfaction and separate Amazon outcomes    | A new consented evaluation process, not the anonymous endpoint or a public success page.                                                     |

Release gate commands should follow current `package.json` and CI: typecheck, lint, copy/reachability/source lint, formatting, tests and build, then relevant Chromium and signed-in/cross-browser E2E. Record actual outputs and skipped tests at the time; historical pass totals in AGENTS/hand-offs are not a current baseline. Run live paid-provider evaluations only against authorized test material and the verified account settings.

At the expanded-service release boundary, require no unresolved critical disclosure/access failure, invented admission/action/document claim, loss of acknowledged work or billing regression in the fixed release set. Document moderate issues and explicit operating limits; a passing test set cannot establish general approval odds.

## 11. Service policy and operational decisions still to settle

These decisions have a recommended direction and an explicit owner. They are part of W00, not questions requiring the founder to answer during this planning-only task.

| Decision                        | Recommended direction                                                                                                                                                 | Owner and dependency                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Managed storage availability    | Opt-in managed cases for the selected guided service; retain explained local access                                                                                   | Founder; blocks capability/entitlement copy and W03 activation.               |
| Retention and closure/reopening | A published lifecycle based on active/closed/inactive status, export and notice before expiry; no invented permanent retention or unannounced loss of Pass continuity | Founder with legal/ops review; blocks W11 activation.                         |
| Sensitive files                 | Keep initial pilot limits, then assess protected financial/identity tasks individually                                                                                | Founder/domain/privacy review; blocks only that W13 expansion.                |
| Supported markets/languages     | First verified target-market journey; existing other routes stay functional; no automatic opening of blocked sales markets                                            | Founder/domain reviewer; blocks scope-specific promises.                      |
| Provider order and effort       | Verified provider/task terms/settings and tested latency/cost budgets; no silent new recipient                                                                        | Operator/engineering; blocks W09 activation.                                  |
| Support promise                 | Named responsibility and response expectations supported by real capacity; explicit error recovery                                                                    | Founder/operator; blocks selling an expanded support level.                   |
| Human expert role               | Separate qualified engagement, contract and protected access; keep the useful specialist-preparation boundary                                                         | Founder; blocks expert access/sale only.                                      |
| Read-only Amazon access         | Direction approved; defer work until a few sellers, then confirm readiness and verify actual costs, terms, roles and coverage; manual intake retained                 | Founder/engineering; blocks integration only, not the first expanded service. |
| Linked research                 | Separate opt-in/authority, dataset, access and retention; no raw-case training by default                                                                             | Founder/privacy/evaluator; blocks research only.                              |
| Pilot thresholds                | Baseline and severity-based targets agreed before evaluation; include incomplete and unsuccessful cases                                                               | Founder/domain reviewer; blocks pilot graduation.                             |

The service should have a documented processing/access inventory, supported source/rule register, evaluation/version log, incident procedure, restore procedure and deletion record. Use existing operational tools where adequate. Do not build P-02 or P-11 as an unrequested convenience while setting up these processes.

## 12. Traceability to the research blueprint

| Blueprint section                                   | Implementation owner                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| Direction, revisable decisions and success criteria | W00; C01–C16; Sections 3 and 11 of this plan.                            |
| Primary evidence and unsupported Meta AI claims     | W00 sourced rules; W05 logic; W09 output evaluation; W11 copy.           |
| Current implementation                              | Section 2 baseline; repository/schema adapters in W01–W04.               |
| Whole seller journey and premium experience         | W04, W07–W12, complete first-journey release.                            |
| Conditional intake and account history              | W06–W07 with issue-specific positions and unknown states.                |
| Connected evidence/case record                      | W02–W06; stable IDs, versioned files and relationships.                  |
| Missing-record assistance                           | W08 with existing waiting-state reuse.                                   |
| Checks before sending                               | W05–W06, W09–W10 and release scenarios.                                  |
| Cloud and permissions                               | W00–W04, W11, C01–C04; optional protected-document expansion.            |
| Model context and operating responsibilities        | W01, W09, W11; evaluated providers and job recovery.                     |
| Evaluation and satisfaction/outcome measurement     | W12; optional linked research track remains distinct.                    |
| Delivery and remaining verification                 | Dependency batches, release evidence and decision/parked appendix below. |

## 13. Existing register items and their relationship to this plan

This is a complete compact inventory of the rows in the inspected PARKED-ITEMS register, including released items, founder actions and recorded unfinished verification. It is a documentary snapshot, not a live status audit. None is silently released, closed or activated by this plan.

### Parked and released product items

| Row                                 | Recorded status                                | Relationship and exact release where still parked                                                                     |
| ----------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P-01 Changelog                      | Released/built 12 Oct                          | Reuse existing page; record actual future shipped changes only.                                                       |
| P-02 Founder admin view             | Parked                                         | Optional privileged UI; `EXECUTE PARKED P-02 admin view`.                                                             |
| P-03 Expert handoff                 | Parked/on hold                                 | Optional W13; `EXECUTE PARKED P-03 expert handoff` or the register's earlier exact alternative sentence.              |
| P-04 Email forwarding               | Parked                                         | Optional W13; `EXECUTE PARKED P-04 email forwarding intake`.                                                          |
| P-05 Offline shell                  | Parked                                         | Not part of managed continuity; `EXECUTE PARKED P-05 offline shell`.                                                  |
| P-06 Automatic encrypted backup     | Parked                                         | Distinct from managed server storage; `EXECUTE PARKED P-06 automatic backup`.                                         |
| P-07 Multiple reminders             | Parked                                         | More than one emailed reminder remains separate; `EXECUTE PARKED P-07 multiple reminders`.                            |
| P-08 Enforce CSP                    | Parked pending clean live reports              | Do not change Report-Only through this plan; `EXECUTE PARKED P-08 enforce CSP`.                                       |
| P-09 Mobile performance             | Parked pending field evidence                  | Maintain mobile usability; separate performance project uses `EXECUTE PARKED P-09 mobile performance`.                |
| P-10 Evidence pack                  | Released/built 10 Oct                          | Reuse and extend existing ZIP/manifest under W10; no second release needed for the already built item.                |
| P-11 Sentry                         | Parked                                         | Existing operational checks remain available; `EXECUTE PARKED P-11 error monitoring`.                                 |
| P-12 Policy split/verification kind | Parked pending case evidence                   | Existing verification protocol is not this taxonomy change; `EXECUTE PARKED P-12 policy split and verification kind`. |
| P-13 Public outcomes                | Parked pending sufficient outcomes/denominator | Pilot research does not publish it; `EXECUTE PARKED P-13 outcomes page` when its condition is met.                    |

### Review rows

| Row                                      | Recorded status                                                  | Relationship                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| R-1 Paid Gemini live check               | Waiting on billing in row; paid tier assumed in go-live register | Verify actual account and run relevant evaluation before expanded AI activation.                   |
| R-2 Second-reading measurement           | Built 10 Oct                                                     | Reuse; broader case metrics are additional.                                                        |
| R-3 Check-this-reading cue               | Built 10 Oct                                                     | Preserve correction/uncertainty.                                                                   |
| R-4 Stop AI-off requests                 | Built 10 Oct                                                     | Preserve graceful availability handling.                                                           |
| R-5 Second-reading cache                 | Built 10 Oct                                                     | Preserve and review cache permissions/versioning.                                                  |
| R-6 Wording retry feedback               | Built 10 Oct                                                     | Reuse current drafting checks.                                                                     |
| R-7 Seller-research direction            | Waiting on founder                                               | This case-service plan is not a new free-tool campaign.                                            |
| R-8 Fresh wording routine                | Recurring monthly/new policy                                     | Feed verified changes into rules/evaluation.                                                       |
| R-9 SP-API decision                      | Direction approved 9 Nov; deferred until a few sellers           | C09/W13 stays out of current implementation; later readiness/cost check required.                  |
| R-10 Success assessment/A-to-Z decisions | Waiting on founder                                               | Reconcile overlapping choices; no bulk release.                                                    |
| R-11 Growth plan                         | Built; founder sentence and P-13 still open                      | Preserve existing growth scope and parked boundary.                                                |
| R-12 Disclosure placement                | On hold pending its six decisions                                | W11 needs accurate new-service disclosures; it does not approve the entire older copy plan.        |
| R-13 Community/support/reach             | Waiting on founder                                               | Relevant support-capacity ideas remain individually selectable.                                    |
| R-14 Master launch report                | Waiting on founder GO                                            | Current launch and expanded-service activation are distinct.                                       |
| R-15 Pricing/growth stage 1              | Built; later founder steps remain                                | Preserve pricing and payment semantics.                                                            |
| R-16 Later pricing stages                | Built inert; remaining stages/activation conditional             | No automatic activation or new cloud price.                                                        |
| R-17 Referral system                     | Built locally; configuration/sandbox verification pending        | Preserve attribution/refund isolation; unrelated activation remains pending.                       |
| R-18 Account history                     | C01–C16 approved 9 Nov; implementation explicitly on hold        | W02/W05–W07 incorporate history into the broader approved direction; no product work is completed. |

### Founder rows

| Row                                    | Recorded status                                            | Relationship                                                              |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| F-01 Paddle default payment link       | Pending configuration                                      | Existing purchase launch prerequisite.                                    |
| F-02 Live Paddle catalog/token/webhook | Approval assumed; wiring pending                           | Existing launch work; plan does not run live setup.                       |
| F-03 Paid Gemini                       | Assumed done, confirmation required                        | Verify before live expanded processing.                                   |
| F-04 Hosting secrets                   | Pending configuration                                      | Existing and future job/storage secrets need deliberate deployment.       |
| F-05 Domain mailboxes                  | Pending creation/operation                                 | Needed for real support and privacy handling.                             |
| F-06 Nightly backup secrets/restore    | Pending founder setup/drill                                | W11 extends the restore scope for managed documents.                      |
| F-07 Migrations 0016–0026              | Recorded applied 26 Oct                                    | Do not reapply as missing; reconcile repository 0027 separately.          |
| F-08 EU/EEA/UK                         | Purchases blocked; comply/decline decision                 | Richer consent does not itself open these markets.                        |
| F-09 Domain                            | Assumed done; hosting not assumed                          | Verify at actual launch, not inferred here.                               |
| F-10 Founder story                     | Unwritten                                                  | Never invent it for premium positioning.                                  |
| F-11 Walkthrough/sample recording      | Pending                                                    | A later walkthrough should reflect the real implemented journey.          |
| F-12 Device-local sign-out             | Closed in code since 7 Oct                                 | Preserve; no new sign-out project.                                        |
| F-13 Stale worktrees                   | Founder deletion decision                                  | Unrelated; no deletion in this task.                                      |
| F-14 Repository visibility             | Decision to make private; action pending in register       | No current visibility claim verified here; owner action remains separate. |
| F-15 Refund period                     | 14 days decided/built                                      | Preserve current terms unless explicitly changed.                         |
| F-16 Partner steps                     | Pending catalog/testing/payout operations                  | No activation by this plan.                                               |
| F-17 Account Pass                      | Built off; optional activation                             | Preserve product conditions; no activation by this plan.                  |
| F-18 Other ways to pay/rebate          | Built off; optional activation/setup                       | Research/managed service must not silently enable these products.         |
| F-19 Decode email reminder             | Migration applied; email/Redis/config verification pending | Do not present infrastructure as live solely because code exists.         |
| F-20 One Response                      | Built off; optional activation                             | Preserve round/credit/payment lifecycle throughout migration.             |

### Recorded unfinished verification

| Register row                                           | Recorded status                                               | Treatment                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Session fresh-notice/reply/deadline/wording/save fixes | Committed/pushed; CI green as checked 10 Oct                  | Historical verification; establish a current baseline before implementation.                             |
| WebKit full suite                                      | Last total 168 passed/2 failed; fixes individually reverified | Full current cross-browser run required when relevant changes are implemented.                           |
| Audit file L-039                                       | Final WebKit/Firefox results still need recording             | Update with actual new results, not old totals.                                                          |
| Flaky keyboard CI tests                                | Known intermittent failures; traces needed                    | Inspect existing CI traces and fix meaningful regressions; do not claim that a retry proves reliability. |

## 14. Planning handoff and next authorization

The research blueprint supplies the rationale and external citations. This plan supplies repository mapping, the founder-approved C01–C16 direction, proposed technical architecture, work packages, dependencies and release evidence. The dated approval is also recorded in the decision/reasoning logs and register. No product work is marked built.

When implementation is explicitly commissioned, start with W00 and the evaluation baseline, then execute the batches in order. Carry out the approved directions without re-litigating them; settle the remaining concrete policy/technical details as planned. Keep C09 deferred until a few sellers and later founder confirmation that the milestone/budget is ready. Resolve each selected parked item through its own required instruction. Keep current launch work, expanded-service activation and later capabilities distinct so the records accurately describe what exists. Until that implementation instruction, perform no product implementation or activation.
