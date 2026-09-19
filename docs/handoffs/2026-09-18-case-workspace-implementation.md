# Case workspace implementation — 18 September 2026

The founder approved the prototype's flow and explicitly rejected copying its appearance. This first implementation uses the existing app's semantic tokens, type scale, Radix tabs, shared cards, controls, upload component, vault and entitlement services. It is local work, not a deployment or a completed paid pilot.

## Implemented journey

- `/case` opens a workspace with Overview, Evidence, Response and History. The dashboard recognizes workspace cases. The previous interview remains available for saved legacy cases and through `?mode=classic`; conversion is additive.
- Notice and current response-form instructions produce a bounded, seller-confirmed route. Explicit document requests produce a document response; explicitly requested operational plans use operational sections. Disputes, unclear requests, unsupported marketplaces, verification processes and sensitive allegations avoid self-serve drafting. Confirmed professional-review holds survive later replies. Existing severe-kind gates remain in force.
- Explicitly requested record types suggest tasks with verbatim source sentences. Users confirm coverage, add or correct tasks, or remove obsolete requirements with a recorded reason. Uploading alone never marks evidence reviewed. Case-scoped original files, content hashes, page references and factual notes underpin each review.
- Missing information can move into a waiting state. An issuer-request draft is available to copy; the app sends no messages. Evidence review is manual and described as such.
- Response preparation retains the seller's saved wording and selected file references. Document responses do not inherit mandatory POA sections. Working drafts carry unresolved items and a watermark. Current facts and references reach the existing authenticated compose API; original files and previous submission text are excluded from that request. The legacy POA AI prompt does not rewrite these new responses.
- Final review and actual-submission attestations are separate. A recorded attempt preserves exact output, selected file versions, page references and an optional receipt note. A new reply creates a new revision while retaining earlier requests, evidence plans and submission snapshots.
- Unsaved field text survives tab switches. Saves detect stale active-case/workspace state before overwriting. Missing or changed files reopen review. New cases preserve earlier saved cases. Decode carries a new notice into a separate case rather than silently opening the previous case.
- No new dependencies, database migrations, billing products or external account settings were introduced.

## Main code

- `src/core/workspace.ts`: workspace model, request routing, requirement suggestions, readiness, deterministic response composition and reply revisions.
- `src/lib/workspaceSchema.ts`: bounded runtime validation at persistence and API boundaries.
- `src/components/workspace/`: case shell, request review, evidence review, response review and dashboard summary.
- Existing composer, case schema, case evidence reconciliation, Decode handoff and compose API integrate the new model. Ownership, per-case passes, rate limits and device enforcement remain in the API.

## Validation

Full unit suite: 478 tests across 55 files passed. The final routing/evidence/API-gate subset was rerun: 22 tests passed. Production build, TypeScript, ESLint, copy lint and formatting passed. The full Chromium suite passed 61/61 with zero retries. After extending dark-mode and screenshot checks, the five workspace scenarios passed again.

Automated WCAG A/AA scans found no violations on the reviewed evidence view in light mode and overview in dark mode. The mobile check found no horizontal overflow at 390px. Desktop (1440px), mobile, dark mode and evidence screenshots were visually inspected; these are targeted checks, not a complete accessibility certification. See [desktop](screenshots/2026-09-18-workspace/workspace-desktop.png), [mobile](screenshots/2026-09-18-workspace/workspace-mobile.png), [dark](screenshots/2026-09-18-workspace/workspace-dark.png) and [evidence](screenshots/2026-09-18-workspace/workspace-evidence.png).

A local production preview was started at `http://localhost:3100/case`. It uses the local environment configuration and remains available while that server process is running. No commit, push or deployment was performed.

The authenticated workspace browser scenario uses real fixture sign-in and vault transfer, but intercepts the compose response using the real deterministic composer and critic. It does not claim a real payment or consume a per-case entitlement. Existing API authorization tests run separately. Synthetic files exercise attachment persistence, not PDF parsing or document authenticity.

## Scope still open

This is the first implementation of the routing foundation and document-request journey in the [blueprint](../product/2026-09-18-case-workspace-blueprint.md), not completion of every proposed module. Routing uses bounded rules and a small synthetic fixture set; it needs expert-reviewed real-case fixtures and policy/playbook validation before a broad paid launch. The legacy product-authenticity/document-falsification category remains conservatively gated.

OCR, automatic document checks, protocol-specific AI rewriting, richer claim-to-source mappings, reminder delivery, case resolution/outcome flows and reviewer collaboration remain later work. Users manually confirm submitted text and file selection; AppealDeck cannot verify what was submitted to Amazon. Browser-only case records need the existing backup/recovery workflow for portability.

The [integrity handoff](2026-09-18-integrity-fixes.md) continues to govern production checks: live webhook delivery, confirmation-email configuration, provider approval and deployment verification are not established by these local tests.

## Follow-up: Decode continuity repair

The founder found that the four links on the Decode result still used the legacy journey: the build link carried only a kind and the draft/submit links opened `/compose`. None carried the notice. The main start buttons carried it, which is why the earlier start-button browser check passed. Additionally, a first-ever imported case existed only in component memory until a later save.

The Decode entry now uses the workspace's Overview/Evidence/Response/History names and destinations. Every entry link shares the same notice/deadline handoff. `importDecodedNotice` saves the full notice in the scoped encrypted vault before the workspace appears; an encrypted, per-case source hash lets a later entry resume saved edits instead of creating duplicates. It preserves older cases and rechecks linked evidence when resuming. Imported notices up to the decoder's 50,000-character limit are retained, instead of silently truncating at 12,000. Pending text remains memory-only until encrypted persistence succeeds.

The sample's phrase “claims we could not verify” incorrectly matched a generic authenticity rule. Verification now needs product/authenticity/document context; explicit authenticity fixtures remain gated. The sample classifies as POLICY, its 90-day stated window is detected, and its invoice request becomes a sourced evidence suggestion. The Decode result's static legacy checklist is replaced with records named in the actual notice. Users still confirm the current response form, which the app cannot infer from the notice alone.

Decode has no confirmed notice-receipt date, so its API returns the stated window without an invented calendar date based on today. The workspace retains these undated windows too. Decode's badge and description now disclose its actual server request instead of claiming nothing is sent.

Validation: 488 unit tests passed; the final request-suggestion subset passed again. The full Chromium suite passed 67/67 without retries. After refining imported-request wording, the six Decode continuity regressions passed again against the rebuilt app: each of the four links, immediate reload, repeated entry with saved edits, and compatibility with an older interview. Production build/type validation, ESLint, copy lint and formatting passed. The local preview on port 3100 was restarted with the new build. Screenshots of the [Decode entry](screenshots/2026-09-18-workspace/decode-workspace-entry.png) and [imported request](screenshots/2026-09-18-workspace/decode-workspace-import.png) were inspected, and the imported mobile view was checked for horizontal overflow.
