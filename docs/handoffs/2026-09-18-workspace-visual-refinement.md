# Workspace visual refinement — 18 September 2026

The founder requested a more visual, concise product experience: less repeated explanation, stronger structure, helpful icons and clearer use of the existing design system. This follows the [workspace implementation and Decode continuity work](2026-09-18-case-workspace-implementation.md).

## Implemented

- Case workspace: compact command header, icon tabs, a clear next action, interactive record/submission counts, and a dedicated deadline panel. Imported notices appear as saved document tiles with a keyboard-accessible read/edit disclosure. Unsaved edits survive tab changes.
- Evidence: colored document/status tiles, sourced-request disclosure, compact file controls, and adjacent review notes/page reference. Detailed review guidance and file switching are available on demand.
- Response: shorter brief, compact unresolved-item summary with the complete list expandable, and a document-style response preview. Processing disclosures, factual attestations and submission controls remain visible where needed.
- History: clearer empty state, expandable replies and earlier activity, with the latest three saved events visible. Existing submission snapshots remain unchanged.
- Decode: one primary workspace action; a concise notice brief; four icon links retaining the notice; first action/precaution visible with the rest expandable; requested records linked to their source wording. Removed repeated calls to action and explanatory cards.
- Dashboard: a visual case summary using actual revision, reviewed-record and submission counts.
- Homepage: shorter headline and sections, a clearly labeled illustrative workspace, four feature tiles, and concise trust cards. Shared footer and FAQ copy now reflect the implemented workspace and actual server-side decoding. The subsequent [FAQ and expectations refinement](2026-09-18-faq-expectations-refinement.md) aligns refund copy with the existing published seven-day policy.

The implementation reuses Inter for controls/body, Newsreader for selected headings, JetBrains Mono for record counts, Lucide icons, existing Radix controls, and semantic colors. Subtle translucent surfaces and a restrained gradient add depth. No new dependencies or image assets were added; the homepage preview is HTML/SVG and explicitly illustrative.

`WorkspaceVisuals.tsx` contains shared icon tiles, view icons and native disclosures. The underlying routing, encryption, account isolation, per-case purchase gates and response generation were not changed in this presentation pass.

## Verification

- Production build, TypeScript validation, ESLint, copy lint, formatting and whitespace checks passed.
- 488 unit tests in 56 files passed.
- Full Chromium suite: 68 passed with zero retries. Includes a new keyboard test for opening an imported notice, editing it, changing tabs, saving and reloading without losing text.
- Separate presentation review covered the homepage, Decode result, imported request, confirmed overview, evidence, response, history and dashboard in light and dark modes. All 16 targeted WCAG A/AA scans passed; all 48 narrow-width checks (320/390/768px) passed, plus six desktop overflow checks for the corrected views. No browser page errors were captured.
- Screenshot inspection found and corrected a decorative homepage background extending outside the viewport, an overflowing response sign-in button at 320px, and insufficient contrast on tinted classification/review badges. The affected views were rebuilt, recaptured and rescanned after correction.

These are targeted accessibility and layout checks, not a complete accessibility certification. Authenticated submission coverage uses the existing real sign-in fixture and deterministic compose interception; no payment is taken or live entitlement consumed.

## Review artifacts

- [Workspace overview, dark](screenshots/2026-09-18-workspace-visual/overview-dark-desktop.png)
- [Imported request, light](screenshots/2026-09-18-workspace-visual/request-light-desktop.png)
- [Decode result, dark](screenshots/2026-09-18-workspace-visual/decode-dark-desktop.png)
- [Evidence, light](screenshots/2026-09-18-workspace-visual/evidence-light-desktop.png)
- [Response, mobile](screenshots/2026-09-18-workspace-visual/response-light-mobile.png)
- [Homepage, light](screenshots/2026-09-18-workspace-visual/home-light-desktop.png)
- [Dashboard, mobile](screenshots/2026-09-18-workspace-visual/dashboard-light-mobile.png)
- [Presentation check results](screenshots/2026-09-18-workspace-visual/verification.json)

Local production preview: `http://localhost:3100`. Reload the existing browser tab to load the rebuilt assets while retaining that tab's guest session. Port 3100 is also used by an unrelated IPv4 loopback service; direct automated preview checks used `http://[::1]:3100`. The unrelated service was left running.

No commit, push, deployment, infrastructure change or new external integration was performed. Legacy interview pages, billing/account flows and legal-page layouts were not redesigned in this pass. The launch checks and deferred functionality in the implementation/integrity handoffs still apply.
