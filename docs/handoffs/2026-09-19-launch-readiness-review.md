# AppealDeck: remaining improvements and resume handoff

Saved 19 September 2026 at the founder's request before deleting the review conversation.

## Founder intent

Continue the improvements across every page: less text, purposeful and uniform font styles, a consistent layout system, and a complete journey that makes users confident from their first visit through the final outcome. The immediate request was inspection and a remaining-work report, not implementation. The founder subsequently asked to preserve this review and add a memory pointer so a later request to "check memory and implement" can resume from this file.

When that later request arrives, read this handoff, the current AGENTS.md and relevant implementation files; recheck the findings against the current working tree, then implement the remaining work. Preserve existing local changes. Do not treat this report as evidence that production services have been verified or that deployment is authorized. Resolve routine implementation choices autonomously within the requested scope.

## Assessment

The app has a coherent visual foundation across the workspace and supporting pages. Existing Inter, Newsreader, monospace, semantic colors, Lucide icons, cards and expandable guidance provide a shared direction. The remaining work is a final flow-and-confidence pass plus production validation, rather than an entirely new visual design.

The review inspected current source, walked the local homepage → sample Decode → imported case → sign-in navigation, inspected pricing in the local preview, and viewed existing mobile screenshots from 18 September. Authenticated paid checkout and production services were not exercised. No application code was changed during the review.

## Implementation priorities

### 1. Make saving trustworthy — reproduced issue

- In an imported sample case, typing into Current response instructions left the global status showing "Changes saved."
- Clicking Sign in and then returning with browser Back lost that unsaved text. The saved imported notice survived.
- Form edits are held in local component state; the global `saved` flag tracks earlier commits, not current dirty fields. Tab force-mounting helps tab changes but not route transitions/reloads.
- Implement accurate unsaved/saving/saved/error states and preserve unfinished edits across navigation, including sign-in. Protect sensitive draft text using the existing vault architecture; do not introduce plaintext browser persistence casually.
- Cover response facts, notice edits, evidence-review notes and reply text, not just the reproduced field.
- Main files: `src/components/workspace/CaseWorkspace.tsx`, `RequestReview.tsx`, `ResponseReview.tsx`, `EvidenceReview.tsx` and relevant vault/case storage helpers.
- Acceptance: the status never falsely claims dirty fields are saved; navigation, reload and sign-in preserve the intended draft; failed saves remain visible and recoverable; existing isolation and stale-write protection remain intact.

### 2. Finish the journey after submission

- The new workspace records exact submissions and further replies, but lacks a clear resolved/reinstated/closed/archive ending.
- `DashboardClient.tsx` returns `WorkspaceSummary` for workspace cases before the legacy reminder and outcome controls. Those older capabilities are therefore not available through the new workspace summary.
- Add a clear post-submission next step, user-selected follow-up date, and explicit outcome/closure flow. Do not invent Amazon deadlines or promise reminder delivery that is not implemented.
- Keep earlier submissions immutable and distinguish seller-recorded outcomes from independently verified outcomes.
- Main files: `src/components/workspace/CaseWorkspace.tsx`, `WorkspaceSummary.tsx`, `src/components/DashboardClient.tsx`, `src/core/workspace.ts`, workspace schemas and existing case/outcome models.

### 3. Align purchase eligibility with workspace eligibility

- Code-level finding, not a completed payment reproduction: `src/app/api/checkout/intent/route.ts` accepts case ID, legacy violation kind and consent, and checks `isSeverityGated(kind)`.
- Workspace composition additionally requires a confirmed supported route via `workspaceCanCompose`, incorporating marketplace, professional-review holds and response route. Pricing can reach CheckoutButton independently of the workspace's disabled drafting surface.
- Apply consistent, server-validated eligibility before purchase so someone cannot buy a pass for a route the product cannot draft. Identify the selected case clearly before payment. Preserve authenticated ownership, exact consent, allowlisted prices and per-case entitlements.
- Main files: checkout intent route, `src/components/CheckoutButton.tsx`, `src/components/pricing/PurchasePanel.tsx`, `src/components/ComposeGate.tsx`, `src/core/workspace.ts`, compose API and associated tests.
- Recheck design against the browser-only case architecture; do not assume the server already stores full case content.

### 4. Preserve the exact place through account creation

- Login's Create an account link uses `/signup` and Signup's return link uses `/login`, dropping `next`.
- Workspace sign-in links generally use `/login?next=/case`, dropping the active workspace tab. Workspace tab selection uses local state without updating the URL.
- Preserve the same case and step through login/signup/recovery as appropriate. Retain safe redirect validation and encrypted guest-to-account transfer. Pair this with priority 1 so preserving a URL does not conceal lost unsaved work.
- Main files: `src/app/(app)/login/page.tsx`, `signup/page.tsx`, shared AuthCard, AppHeader, workspace components and `src/lib/safeNext.ts`.

### 5. Focused typography, spacing and text-density pass

- Retain the existing font families and design direction. Define consistent roles for sans body/controls, serif headings or accent phrases, and monospace counts.
- Current heading treatments vary: homepage uses a serif phrase inside a sans headline; several pages use whole serif headings; PageIntro uses text-h2 while the workspace uses text-3xl/sm:text-4xl. Newsreader is loaded only as italic weight 500, while some consumers request other weights. Standardize intentionally rather than adding more fonts.
- Compact mobile workspace headers and reduce prominence of secondary actions such as New case. Bring the current next action and save status near the active form.
- Reduce repeated headings, explanatory text and reassurance cards. Pricing repeats benefits across the intro, comparison, trust and expectations sections. Keep necessary scope, data-use and purchase disclosures visible at the right action.
- Preserve keyboard navigation, contrast, light/dark themes, touch targets and responsive layouts. Review 320/390/768/1440 widths after meaningful changes.
- Main files: `src/lib/fonts.ts`, global CSS/tokens, PageIntro, AuthCard, workspace header/summary, marketing/pricing pages and shared content.

### 6. Improve case management and recovery confidence

- All cases currently leads principally to a summary and selector rather than a useful case overview.
- Add recognizable case names, current status, next required action and visible backup status where relevant. Coordinate archive/closed states with priority 2.
- Current Export case notes in workspace History includes notice, instructions, explanation and unresolved items. It is not a complete readable export of evidence reviews, all response facts, submissions and replies.
- Offer a complete, accurately labeled readable case export/handoff alongside encrypted backup. Avoid implying either export submits anything to Amazon.
- Existing cloud backup and portable crypto recovery need a real cross-browser Storage drill before claiming full service recovery.

### 7. Finish trust, scope and purchase clarity

- Add an easily found About/Support surface with the actual operator and a realistic support window. Operator identity already appears in legal copy; do not invent credentials, affiliations, testimonials or coverage.
- State English-language Amazon US scope and supported case routes earlier in the journey.
- Pricing still says to sign in with the email used at checkout to activate the pass, while the implemented checkout requires sign-in before purchase. Align wording with actual flow.
- Clarify pass duration and what later replies on the same case include. Do not silently alter existing entitlements; identify any genuinely unresolved commercial decision before implementing it.
- Reconcile remaining legacy Plan of Action/license-key/sync wording with the current document-response workspace and backup model. This review did not certify legal compliance.

### 8. Production launch verification and metadata

Locally verified on 19 September (presence checks only; no secrets printed):

- `NEXT_PUBLIC_PADDLE_ENV` is `sandbox`.
- Paddle price ID and client token are present.
- `PADDLE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` and `CRON_SECRET` are absent from the inspected local environment.
- Upstash URL and token are present.

These facts describe local configuration, not independently inspected production settings.

Remaining release evidence:

- Correct deployed app host, provider approval/configuration and deployment smoke checks.
- Provider-connected sandbox payment → webhook → exact case entitlement → activation → confirmation email, plus replay/failure/refund handling. Local signature/SQL tests do not replace this.
- Real cloud backup and restore on another browser, with preserved records and isolation.
- Expert-reviewed representative real-case routing fixtures and observed user trials. The current rules and synthetic tests do not prove broad appeal-domain correctness.
- Page-specific titles and canonical URLs, and intentional indexing rules for account/app pages. The root currently declares canonical `/` and index/follow; several pages inherit those defaults. The pricing title visibly repeats AppealDeck.
- Verify production AI data handling before real sensitive case text uses optional AI features.

Do not deploy, change production settings, make real payments or send external messages solely because this document lists them. Follow the scope of the later user request and obtain any required concrete authorization.

## Suggested execution order

1. Protect progress and account continuity (priorities 1 and 4).
2. Complete case lifecycle, dashboard and exports (2 and 6).
3. Align checkout eligibility and purchase communication (3 and 7).
4. Apply the final shared visual consistency/density pass (5).
5. Run focused regressions, full required checks and provider-connected launch verification (8).

Write regression tests for the reproduced data-loss and purchase-eligibility defects. Use the existing test infrastructure and avoid unnecessary dependencies. Keep copy concise and preserve the existing founder-approved workspace design.

## Verification performed in the review

- `npm run typecheck`: passed.
- `npm run lint`: passed, zero warnings/errors.
- `npm test`: 488/488 tests passed across 56 files.
- Browser checks used the existing production build from 18 September, served by a new local `next start` process at `http://127.0.0.1:3100`. Availability is transient; verify before reuse. No rebuild or full browser suite was run in this inspection.
- Existing supporting/mobile screenshots and prior verification reports were inspected, not regenerated.
- No application-code edits, commit, push, deployment, external messages or payment occurred. This handoff was added afterward at the founder's explicit request.

## Workspace state and background references

The working tree already contained substantial modified and untracked work from the prior workspace and supporting-surface improvements. Preserve it; do not reset or overwrite it. Current source and the newest handoffs supersede older historical claims in AGENTS.md.

Read as needed:

- `docs/handoffs/2026-09-18-case-workspace-implementation.md`
- `docs/handoffs/2026-09-18-workspace-visual-refinement.md`
- `docs/handoffs/2026-09-18-faq-expectations-refinement.md`
- `docs/handoffs/2026-09-18-supporting-surfaces-refinement.md`
- `docs/handoffs/2026-09-18-integrity-fixes.md`
- `docs/product/2026-09-18-case-workspace-blueprint.md`
- `docs/product/2026-09-18-launch-strategy.md`

OCR, automatic document authentication/checks, reviewer collaboration and other blueprint expansions are not automatically prerequisites for this finishing pass. Keep the launch scope narrow and truthful.
