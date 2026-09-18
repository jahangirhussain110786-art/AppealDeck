> **Follow-up:** The implementation and live-service changes resulting from this analysis are recorded in [2026-09-18-integrity-fixes.md](2026-09-18-integrity-fixes.md). Findings below describe the pre-fix baseline.

# AppealDeck: project understanding and engineering assessment

Date: 18 September 2026. Code baseline: `ab3c5fb`, including the pre-existing working-tree AppHeader change. This is an analysis, not an implementation pass. No application code or external services were changed.

## Scope and confidence

Reviewed the project instructions and memory, package and route inventory, core decoding/interview/readiness/composition/state modules, application consumers, account and license checks, Paddle checkout/webhook, database migrations, vault storage/crypto interfaces and recovery paths, analytics, UI tokens, CI, deployment configuration, and selected planning and test files. Findings below distinguish directly observed code behavior from deployment conditions. This is not a claim to have read every planning document, visually exercised every screen, audited every dependency, or verified production accounts.

The repository has substantial historical documentation. Its top-level status and older handoffs are not reliable snapshots of HEAD: the AI composer, new navigation, real deadline persistence, and multi-case P0 have shipped after the recorded September 11 status.

## Product and business model

AppealDeck helps Amazon sellers interpret enforcement notices and prepare an evidence-backed appeal. The intended journey is notice → classification and deadlines → guided intake → corrective actions and evidence → paid drafting → manual submission → reply analysis and follow-up. The seller remains responsible for facts and submission.

The documented commercial offer is a $199 one-time Appeal Pass per case. Guardian subscriptions, expert review, and the browser extension are deferred product scope, although some subscription handling already exists in the backend. The intended distinction is credible preparation and continuity: generic AI prose alone does not establish evidence quality, remediation, or submission readiness.

The ethics decisions are architectural requirements: no promised reinstatement, no fabricated corrective actions, professional-help routing for severe cases, local-first storage, and opt-in outcome measurement. Some implementations do not yet enforce those requirements consistently; see findings.

## Architecture and responsibility map

| Layer | Responsibility | Important files |
|---|---|---|
| Web application | Next.js 14 App Router, React 18, marketing/auth/product surfaces | `src/app/`, `src/components/` |
| Domain core | Notice parsing, classification, deadlines, guided questions, evidence requirements, readiness, drafts, criticism, replies and case state | `src/core/` |
| Local persistence | Dexie/IndexedDB, encrypted record payloads, case file/log/index and active pointer | `src/core/vault/`, `src/lib/caseStore.ts` |
| Account and entitlement | Supabase authentication, email-based license checks and device activation | `src/lib/auth.ts`, `license.ts`, `devices.ts` |
| AI | Server-only Gemini REST calls, task-specific models, bounded output and deterministic fallback | `src/lib/llm/` |
| Payment | Paddle.js checkout and signed webhook-driven license writes | `CheckoutButton.tsx`, `api/webhooks/paddle/route.ts` |
| Operations | Upstash limits/breakers, Resend email, optional Plausible events, Vercel deployment | `src/lib/`, `.github/workflows/`, `vercel.json` |

The `(app)` directory is a route group, not a URL prefix. Product URLs are `/case`, `/dashboard`, `/compose`, `/vault`, and `/billing`. Middleware primarily supports optional host splitting; page and API functions enforce authentication independently.

The core/application separation is a sound foundation for another client such as an extension. However, browser flows and server endpoints sometimes duplicate contracts: the interview UI runs core functions locally while `/api/interview` has a separate schema and a paid gate. That endpoint's schema is already behind the current CaseFile shape, omitting identity and newer narrative fields.

## Actual user and data flows

1. **Decode:** The web decoder runs deterministic parsing/classification in the browser. Classification selects one of seven kinds by regex priority; unknown results carry `llm-needed`, which is a label rather than proof of automatic AI classification. Parsed deadlines can now be serialized into case storage.
2. **Intake:** Visitors can answer initial questions. Upload/save progression introduces sign-in. Questions collect root cause, timeline, prior appeals, preventive measures, action status, and evidence. Explicit planned actions remain labelled planned.
3. **Storage:** Cases and evidence share an origin-wide encrypted vault. Default device mode stores a browser CryptoKey and automatically unlocks; passphrase protection is optional. Case IDs are now UUIDs with a legacy-ID adoption path, an index, and an active-case pointer. This is groundwork for multi-case management, not a complete case-switching product.
4. **Compose:** The server checks the user, rate limit, active email-based license, and device cap. It builds a deterministic draft first. Gemini can rewrite Root Cause and Preventive Measures when source narrative is sufficient; Corrective Actions and evidence gaps remain deterministic. The critic runs afterward and re-runs against browser edits. AI provenance is exposed through section sources and metadata.
5. **Follow-up:** Dashboard combines case/log state, reply classification, deadlines, evidence, and suggested next actions. Submission is recorded locally rather than sent to Amazon. Outcome sharing sends a limited structured record to Supabase.
6. **Payment:** Browser checkout precedes webhook processing and license polling. The webhook is the authority for access; a checkout-completed browser event alone is not the license grant.

Local-first does not mean all processing remains local: compose sends case narratives and structured evidence/action information to the backend, and selected text then goes to Gemini. Uploaded document bytes are not included in the reviewed AI prompt builder. Snapshot sync sends encrypted payloads plus metadata to Supabase Storage.

## Strengths

- Deterministic drafting remains usable when Gemini is absent or rejects a completion.
- AI is scoped to prose, while corrective actions and evidence claims have structured origins.
- The core expresses evidence gaps and narrative insufficiency explicitly rather than treating fluent text as readiness.
- Design tokens, centralized content, accessible primitives, light/dark themes, and copy linting provide a coherent UI foundation. Typography uses Inter, Newsreader italic accents, and JetBrains Mono.
- The repository includes unit tests, browser tests, accessibility checks, and deployment smoke guidance. Their existence is useful, but passing them does not prove payment/database/storage boundaries.
- Explicit provenance, no-guarantee language, and opt-in outcomes support the intended product positioning.

## Priority findings

### 1. License owners can update entitlement fields — high, deployment-dependent

`supabase/migrations/0002_rls.sql` creates an authenticated UPDATE policy based only on matching email. No later checked migration removes it or restricts columns. Under authenticated UPDATE table privileges, an owner can modify status/plan on an existing license, including reactivating a canceled license. This does not grant arbitrary users INSERT access. Confirm live grants and remove direct client entitlement writes; keep such writes server-owned.

Email is also the entitlement identity, while project notes say signup email confirmation was disabled. Current deployment settings were not inspected. If still disabled, the assumption that checkout proves account email ownership needs explicit revalidation; it should not substitute for an authenticated, verified purchaser binding.

### 2. Guest cleanup can delete a signed-in user's local vault — high

`guestSession.ts` purges an initialized vault whenever a signed-out tab lacks its sessionStorage flag. The database has one fixed name, with no guest/user ownership partition. A previously signed-in seller who signs out and enters `/case` or `/dashboard` in a fresh tab can therefore hit cleanup of the same database containing persistent work. Another guest tab can also collide with origin-shared data. Account switching has the complementary risk: default device-mode unlock does not establish which account owns the local records.

Resolve guest storage and account ownership explicitly before changing cleanup logic. Preserve existing data through any migration.

### 3. Payment handling can acknowledge unsuccessful provisioning — high

The Paddle handler ignores Supabase result errors from license inserts/updates and event writes. Its outer catch only helps for thrown exceptions. It may return success, record an event, or send confirmation despite a failed license write. Dedupe checks and writes are not transactional, provider IDs are not unique in the reviewed license schema, and event keys are derived from resource IDs instead of the webhook's top-level event identity.

Other concrete limitations: unknown prices default to Appeal Pass; email must be embedded in the incoming payload or the handler silently skips processing; there is no reviewed refund/reversal branch. A real sandbox payload and lifecycle replay are needed before claiming payment correctness. The exact provider payload contract was not externally verified in this pass.

### 4. Evidence crosses case boundaries — high

`ComposeView.tsx:79` uses `vault.list()` without `caseId` and marks every encountered evidence kind present. An invoice from an older case can therefore satisfy the current case. Dashboard likewise lists files across the vault. New case IDs do not yet establish end-to-end case isolation. Scope evidence reads and define intentional reuse explicitly.

### 5. Default-mode cloud snapshots are not restorable by the implemented importer — high

Cloud push JSON-serializes vault metadata. Device mode uses a CryptoKey and device-wrapped DEK; JSON does not preserve that key as a portable key. `importAll()` instead requires passphrase `wrappedDek`. Thus a successful upload in default device mode is not proof of a recoverable backup. Import also replaces global key metadata while retaining unrelated existing records, which can strand records encrypted under the prior key. A restore-to-another-profile drill is essential.

Record names, tags, case IDs, MIME types, and plaintext hashes remain outside encrypted payloads and are included in export. Privacy descriptions should distinguish encrypted content from exposed metadata.

### 6. Parser can turn any day count into an appeal deadline — high product-correctness risk

`noticeParser.ts` takes the first number followed by “day/days”; `deadlinesModel.ts` labels it an appeal window. Text about a funds hold or document age can therefore become an unrelated appeal deadline. Anchor parsing to the relevant clause and retain ambiguous status when multiple windows exist. This is a code observation, not validation of current Amazon policy.

### 7. Compose validation is too permissive — medium/high

The request schema permits any non-empty kind, optional evidence/action collections, arbitrary action objects, and unbounded narratives. Core functions immediately index evidence slots and iterate action arrays. A malformed request that passes Zod can still crash composition. Validate the complete domain shape and bound input sizes before calling the core or Gemini.

Severity rules also differ: the classifier gates all `INAUTHENTIC_DOCUMENTS`, while the composer critic only emits its severity error when an invoice is absent. The compose endpoint itself still generates and returns a draft. Choose one explicit authoritative policy and apply it at the server boundary.

### 8. Commercial and operational contracts lag implementation — medium

- The offer is per case, but server access currently checks only whether an email has any active license. No case entitlement is bound to the compose request. Multiple purchases can also produce multiple rows where `maybeSingle()` expects one.
- Case file, pointer, and index updates delete then insert through separate calls. Failure or concurrent tabs can lose records or desynchronize the index; transactional storage updates would close this boundary.
- Missing Upstash configuration bypasses rate limits and breakers. Configured Redis errors can propagate before deterministic fallback, so fallback is not universal infrastructure-failure protection.
- `AWAITING` has a higher-priority guard that subsumes `NO_RESPONSE`; automatic `NO_RESPONSE` transition is unreachable with the current predicates.
- Preview deployment never writes `DEPLOYMENT_URL` to GitHub outputs, so its conditional PR comment cannot work as written.
- CI starts a server, but Playwright has `reuseExistingServer: false` in CI and tries to own the same port. Align server ownership.
- The API interview schema and historical status files need reconciliation with the actual shipped domain model.

## Suggested work order

1. Protect existing data and entitlements: account/guest vault boundaries, owner-write license policy, purchaser identity, restorable backups.
2. Prove the purchase lifecycle using real sandbox payloads, transactional provisioning, retry behavior, refunds, and multiple purchases.
3. Finish case isolation and define how the per-case Pass maps to a local case.
4. Fix deadline extraction, compose schemas, and consistent severe-case enforcement.
5. Add focused integration coverage at those boundaries; reconcile CI and current-state documentation.
6. Resume broader multi-case UX and visual refinement after these foundations are demonstrated.

## Validation limits

Typecheck, ESLint, and copy lint passed during this analysis. The first Vitest attempt was blocked by sandbox process spawning (`EPERM`); the approved retry outside the sandbox passed **434 tests across 47 files** in 60.48 seconds.

No production build, browser walkthrough, live database policy probe, Paddle checkout, cloud restore, external policy review, or dependency vulnerability audit was performed. Existing AppHeader edits and the untracked visual-direction HTML were preserved. Historical screenshots and previous gate counts were not presented as fresh verification.
