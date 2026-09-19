# All 70 conversation suggestions: decisions

18 September 2026. Numbers match the user's pasted conversation. **Keep** means useful direction, not necessarily already implemented. **Adapt** retains the underlying need with a different behavior. **Defer** requires validated demand or prerequisites. **Reject** means do not build the proposed mechanism. A deferred or rejected feature can still have a simpler replacement.

Baseline codes: **E** existing capability; **P** partial/adjacent capability; **N** new capability. These are inspection-based product assessments, not claims that every edge case is complete. Phases: **0** routing foundation; **1** workspace pilot; **2** assisted evidence; **L** later gated expansion. See the [blueprint](2026-09-18-case-workspace-blueprint.md) for actual dependencies.

## A. Understand the request

| #   | Suggested feature                                   | Decision / baseline / phase | Concrete product behavior                                                                                                                                                      |
| --- | --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Paste, forwarded email, PDF/image and SP-API intake | Adapt / P / 1→2; API L      | Paste and manual form confirmation first; PDF/image next. Forwarding needs sender verification, malware handling and retention controls. API sync is separately scoped.        |
| 2   | Screenshot OCR                                      | Keep / N / 2                | Read text, preserve source image and highlight uncertain regions for correction; allow manual transcription.                                                                   |
| 3   | Language detection and translation                  | Defer / N / L               | Detect unsupported language early. Preserve original plus translation with provenance; a translated notice does not establish marketplace policy competence. English US first. |
| 4   | Fifteen-plus violation labels                       | Adapt / P / 0               | Separate issue family, scope and requested protocol. Distinguish authenticity complaints from falsified-document allegations; allow multiple issues and unknown.               |
| 5   | Intent classifier                                   | Keep / P / 0                | Route among document response, POA, dispute, form/acknowledgment, correction, follow-up, information, clarification and specialist review. Confirm source evidence.            |
| 6   | Entity extraction                                   | Keep / P / 1                | Dates, ASINs, case IDs, names and policy references with source spans and correction. Never silently invent an identifier.                                                     |
| 7   | Severity score and resolution estimate              | Adapt / P / 0               | Explain concrete urgency, scope and reasons for specialist help. No unsupported 1–5 risk precision or reinstatement timeline.                                                  |
| 8   | Account Health historical cross-check               | Defer / N / L               | Begin with user-provided history. A5 confirms useful performance-report metrics; prove issue-level reconciliation before promising all open violations.                        |
| 9   | Deadline calculator                                 | Adapt / E / 1               | Explicit notice/form date plus anchor/timezone and certainty. Distinguish deadline, eligibility date and user reminder. Ask when ambiguous.                                    |
| 10  | Related-account notice detector                     | Adapt / P / 0               | Recognize the alleged relationship and route carefully. Detection of wording does not establish an actual relationship.                                                        |
| 11  | Complaint source identifier                         | Adapt / P / 1               | Record who the notice explicitly names; otherwise unknown. Do not infer competitor abuse or a bot from writing style.                                                          |
| 12  | Evidence requirements                               | Keep / E / 0→1              | Instantiate requirements from the reviewed protocol and actual request, with source, alternatives and applicability. Replace universal lists.                                  |
| 13  | BSA/policy retrieval                                | Adapt / P / 0→L             | Small reviewed source registry first, scoped by marketplace and date. Retrieval may locate guidance; it cannot silently author mandatory policy.                               |
| 14  | Case memory; Amazon “stricter now”                  | Adapt / P / 1               | Show prior attempts and facts with seller permission. Do not infer a hidden penalty from previous cases.                                                                       |
| 15  | Fake-notice detector                                | Adapt / N / 1 basic         | Encourage checking the corresponding notice directly in Seller Central; flag suspicious links. Do not certify authenticity from pasted text.                                   |
| 16  | Split multiple violations                           | Keep / N / 0→L              | Detect multiple issues now; share facts while keeping requirements separate. Respect one-versus-many submission context. Full mixed-case support later.                        |
| 17  | Concise summary card                                | Keep / E / 1                | Show what is alleged, requested, known and unresolved in plain language; link back to the actual notice.                                                                       |
| 18  | Approval odds                                       | Reject / N / —              | Replace percentages with visible required items and unresolved questions. A future research model would need appropriate data/calibration; do not promise it now.              |

## B. Resolve the case

| #   | Suggested feature                                | Decision / baseline / phase | Concrete product behavior                                                                                                                                    |
| --- | ------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 19  | Dynamic task builder                             | Keep / P / 1                | Dependency-aware relevant tasks, one next action, complete plan available. A case may require more than four tasks.                                          |
| 20  | Single-task focus                                | Adapt / P / 1               | Focus the next useful action while allowing inspection, independent work, going back and save/resume.                                                        |
| 21  | Lock output until all green                      | Adapt / P / 1               | Prevent false ready-to-submit claims, but allow labeled drafts, supplier requests and handoff. Surface unresolved requirements without holding work hostage. |
| 22  | Why this matters                                 | Keep / P / 1                | Source-backed reason, what the document/action supports, and what remains unresolved if absent. No invented loss/odds penalty.                               |
| 23  | Micro-videos                                     | Defer / N / L               | Prefer concise maintained text/screenshots initially. Videos need dates, captions, transcript and updates as Seller Central changes.                         |
| 24  | Timer and revenue-loss nudge                     | Adapt / P / 1               | Opt-in reminder tied to a real deadline or seller-selected follow-up. Never invent revenue lost per day.                                                     |
| 25  | Invoice extraction                               | Keep / N / 2                | Fields and line items with page positions and uncertainty. Minimize fields sent to cloud; price may not be needed.                                           |
| 26  | Twelve invoice checks, PDF preference, blacklist | Adapt / P / 2               | Check readable fields, consistency and notice-specific requirements. No secret supplier blacklist, blanket image rejection or authenticity certification.    |
| 27  | Invoice strength/rejection score                 | Reject / N / —              | Use individual findings: missing, unclear, conflicting, reviewed. OCR confidence stays attached to text extraction.                                          |
| 28  | Invoice “fixer”                                  | Adapt / P / 1               | Draft a request to the issuer for genuine missing information/corrected records. Preserve original and new version. Never synthesize or backdate invoices.   |
| 29  | Destruction proof validation                     | Defer / P / L               | Only within a professionally reviewed applicable workflow. Metadata cannot prove destruction; never prescribe disposal as a generic cure.                    |
| 30  | Screenshot validation                            | Adapt / N / 2               | Check readable requested context/date/identity when necessary. Do not demand unnecessary merchant tokens or certify a screenshot as genuine.                 |
| 31  | Amazon-standard file renaming                    | Adapt / N / 2               | Suggest clear, collision-safe export names with an original-name map. Describe them as our organization convention, not an Amazon standard.                  |
| 32  | ZIP and evidence index                           | Keep / P / 2                | Export package for seller organization; the actual Amazon form may require individual files. Distinct from encrypted backup export.                          |
| 33  | Duplicate files                                  | Keep / N / 2                | Content hashes identify exact duplicates; similar versions remain separately reviewable. Never silently delete evidence.                                     |
| 34  | Invoice “expiry”                                 | Adapt / P / 2               | Evaluate the relevant date window and anchor for this request. Do not assign universal daily expiry to a document.                                           |
| 35  | Supplier correspondence                          | Keep / P / 1                | Bounded drafts from missing requirements and confirmed facts. Seller reviews and sends; no autonomous email.                                                 |
| 36  | 3PL/FBA removal agent                            | Defer / P / L               | Draft only when a reviewed path and seller decision establish the need. No inventory action from an AI classifier.                                           |
| 37  | Buyer apology/refund messages                    | Defer / P / L               | Only permitted, necessary case-specific communications after messaging-policy review. No bulk apologies, review pressure or automated refunds.               |
| 38  | SOP generator                                    | Adapt / P / 1 narrow        | Draft practical steps, responsible person and frequency. Track adoption separately; a generated PDF is not implemented prevention.                           |
| 39  | Fake training attendance                         | Reject / N / —              | Offer a blank record or guided log for a session that actually happened, with truthful participants/date/materials.                                          |
| 40  | Rights-owner retraction request                  | Adapt / P / L               | Factual editable draft where appropriate; no automatic legal position, threats or admission. Include only verified complaint details.                        |
| 41  | Compliance-officer title/org chart               | Adapt / N / L               | Record real responsibility and actual organization. Avoid invented staff, retroactive appointments or cosmetic evidence.                                     |
| 42  | “Lie detector” prompts                           | Adapt / P / 1               | Neutral contradiction review: show both sources and ask the seller to resolve them. A different business name may have an innocent explanation.              |
| 43  | Fear/loss calculator                             | Reject / N / —              | Optional private planning calculation only if later wanted, with seller-supplied assumptions. No coercive loss framing in core workflow.                     |
| 44  | Coach claiming approval lift                     | Adapt / P / 1               | Contextual explanation and next-step help within the task. No open-ended chat or invented percentage benefit.                                                |
| 45  | Skip modal with poor odds                        | Reject / P / —              | Offer reasoned alternatives, not-applicable review, waiting state and unresolved-items export. Never manipulate urgency with fake statistics.                |

## C. Respond and follow through

| #   | Suggested feature                   | Decision / baseline / phase    | Concrete product behavior                                                                                                                              |
| --- | ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 46  | Inject real facts into response     | Keep / P / 1                   | Confirmed facts and source-linked evidence only; track planned versus completed actions. Revalidate server-side before composing.                      |
| 47  | Tone switcher                       | Adapt / P / 1                  | Correct protocol and factual structure matter first. Use clear professional language; do not infer a legal strategy from “Section 3.”                  |
| 48  | Retrieval from 10,000 approved POAs | Defer / N / L                  | No such corpus established. Start with licensed, permissioned, reviewed fixtures; protect private data and avoid copying another seller's facts.       |
| 49  | Universal 800–1100 words            | Adapt / P / 1                  | Respect actual form constraints and answer only the request. Show counts; no universal essay length or readiness score from readability.               |
| 50  | Fluff remover                       | Adapt / E / 1                  | Flag vague/unsubstantiated language and suggest specific facts. An apology is not categorically banned and must not be forced in a dispute.            |
| 51  | Amazon-bot critic                   | Adapt / E / 1                  | Consistency, request coverage, unsupported claims, missing references and form checks. Never market insider bot knowledge or acceptance scores.        |
| 52  | Exact evidence references           | Keep / P / 1→2                 | Reference selected document version, export filename and valid page. Recheck after file replacement or renaming.                                       |
| 53  | Text/PDF/index output               | Keep / P / 1→2                 | Match the actual channel. Preview exactly what will be copied/exported. Keep internal planning notes out of submission text.                           |
| 54  | Force edits to evade AI detection   | Reject / N / —                 | Require substantive fact review and confirmation; no arbitrary edits to game detectors.                                                                |
| 55  | Day 3/7/14 escalations              | Adapt / P / 1                  | Reminders are user-controlled and tied to actual instructions. Follow-up can be appropriate, but automated repetitive resubmission is not the default. |
| 56  | Submission checklist                | Adapt / E / 1                  | Checklist comes from the case protocol and form; do not universally require account closure, removal or destruction.                                   |
| 57  | Copy plus download                  | Keep / P / 1→2                 | Separate clearly labeled copy text and download evidence controls, confirmed versions and visible success/failure.                                     |
| 58  | Submission/outcome tracking         | Keep / E / 1                   | Preserve exact submitted attempt, receipt, reply and seller-reported outcome. “Submitted” requires seller confirmation, not clicking Copy.             |
| 59  | Reply-driven roadmap changes        | Keep / P / 1                   | Show new requests and proposed changes with citations to reply; seller confirms a plan revision. Old submissions remain immutable.                     |
| 60  | Outcome learning                    | Adapt / P / 1 data; L analysis | Consent, minimization, provenance and denominators first. Human-reviewed improvements, not live autonomous policy changes or success predictions.      |

## D. Business and continuity

| #   | Suggested feature               | Decision / baseline / phase | Concrete product behavior                                                                                                                                            |
| --- | ------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 61  | Full SP-API integration         | Defer / N / L               | Endpoint-level proof, seller authorization, minimal roles, secure tokens and manual fallback. Start with a measurable use case, not all orders/inventory.            |
| 62  | Related-account scanner         | Reject / N / —              | A factual relationship timeline is useful; a scanner implying visibility into Amazon's secret linkage system is not supportable.                                     |
| 63  | Weekly reinstatement prevention | Defer / N / L               | Requires useful signals, reviewed alerts, consent and demonstrated recurring value. No promise to prevent suspension.                                                |
| 64  | Invoice coverage dashboard      | Defer / N / L               | Later show which products have supporting records and known gaps. Completeness is not a guarantee that invoices are valid for a future request.                      |
| 65  | $99/$299/$799 tiers             | Defer / E billing / L       | Keep the existing per-case model as the pricing hypothesis. Validate value and support cost; expert/legal services require separate category/payment review.         |
| 66  | Expert marketplace              | Defer / N / L               | First use a qualified reviewer for playbooks. Customer handoffs need vetting, scope, credentials, consent, contracts and an approved payment arrangement.            |
| 67  | Success statistics/social proof | Adapt / P / pilot           | Publish only consented genuine cases and accurately defined metrics with denominators. No invented reinstatement counts or endorsement.                              |
| 68  | Affiliate/agency white label    | Defer / N / L               | Start with disclosed referrals if validated. Agency seats require authorization and access boundaries; white label is a separate product burden.                     |
| 69  | Audit trail                     | Keep / P / 1                | Record source, actor, time and revision. App activity proves what was recorded, not that a real-world action occurred. Separate telemetry from private case history. |
| 70  | TOS “liability shield”          | Adapt / P / prelaunch       | Accurate scope, privacy, refunds, limitations and appropriate professional review. Terms do not erase liability or compensate for misleading product behavior.       |

## Capabilities missing from the 70-item list

These are necessary supporting behaviors, not twenty more menu items:

1. Explicit unsupported/uncertain routing and free exit before checkout.
2. Capturing the current response form alongside the notice.
3. Separate allegation, seller position and confirmed fact.
4. Marketplace and policy version attached to each playbook.
5. Source conflicts and stale guidance alerts for maintainers.
6. Reversible plan revisions and immutable submitted attempts.
7. Original-file preservation and artifact-version provenance.
8. Clear processing consent, data minimization and no-cloud fallback.
9. Extracted-field correction linked to page/region.
10. Protected handling of malicious document instructions and unsafe links.
11. File/page limits, partial processing, retry and cancellation.
12. Guest-to-account continuity, account isolation and portable recovery.
13. Waiting-for-third-party state with independent tasks still available.
14. Deadline provenance, timezone and unknown-date handling.
15. Keyboard, screen-reader, mobile, zoom and low-bandwidth behavior.
16. Per-case AI spend/page budgets, abuse controls and fallback.
17. Permissioned handoff packet without sharing passwords.
18. Receipt-based submission confirmation, not inferred from export.
19. Policy reviewer ownership, regression fixtures and release/rollback gates.
20. Support capacity, refund economics and product-fit checks before expanding.

## Priority decision

Build the coherent chain **1/4/5/6/12/17 → 19/20/22/28/35 → 46/51/52/53/56/58/59**, supported by provenance, recovery and clear boundaries. Add OCR only when it improves that chain. Do not schedule by raw feature count or copy the conversation's 30/60/90-day promises.
