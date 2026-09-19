# AppealDeck product direction — 18 September 2026

This package turns the founder's 16–18 September Meta AI conversation into a researched product direction. It also answers the follow-up about launching internationally from Pakistan.

1. [Product blueprint](2026-09-18-case-workspace-blueprint.md): experience, decision engine, evidence model, architecture, delivery sequence and release gates.
2. [All 70 suggestions](2026-09-18-feature-decisions.md): every numbered idea retained, adapted, deferred or rejected, with implementation implications.
3. [Launch from Pakistan](2026-09-18-launch-strategy.md): recommended customer, marketplace, payments, trust, economics and expansion gates.
4. [Research ledger](2026-09-18-research.md): primary sources, evidence strength, limits and unresolved questions.
5. [Interactive workspace concept](prototypes/case-workspace.html): four sample routes, evidence review, blocked-task alternatives, response preparation and reply handling. Open in a browser. All cases are fictional; no upload, OCR, payment or Amazon integration is connected.

**Recommendation:** an English-language workspace for Amazon US notices, available to eligible sellers internationally, initially focused on narrowly supported document requests and operational responses. The product should make the correct next action clear and connect every material response claim to a fact or document. Pakistan is the founder's operating location and a useful initial distribution network, not a restriction on the seller marketplace.

**Status:** the founder approved the prototype flow and requested implementation using the existing app's design system. The [first workspace implementation](../handoffs/2026-09-18-case-workspace-implementation.md) now covers request routing, manual evidence review, waiting/request drafts, response preparation and preserved reply revisions locally. The rest of this package remains a proposal, not a shipped feature list or proof of market demand. The [integrity handoff](../handoffs/2026-09-18-integrity-fixes.md) governs live infrastructure and launch checks. No deployment, pricing change or live-account reconfiguration accompanies this workspace implementation.

Prototype verification: `node docs/product/prototypes/verify.mjs` exercises four scenario routes, supplier waiting/review, submission/history, reply change review and reminders. The run passed 22 assertions/checks, including automated accessibility scans and desktop/mobile overflow checks, with no page errors. Screenshots were visually inspected. This validates the concept artifact, not real OCR, policy correctness, backend integration or seller outcomes.
