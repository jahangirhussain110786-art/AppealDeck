# FAQ and expectations refinement — 18 September 2026

The founder requested a less text-heavy FAQ and expectations card, consistent with the new workspace design, plus simpler language that explains the value before asking for payment.

## Implemented

- Pricing and the standalone FAQ now share four icon-led topic tabs. Each topic shows a short accordion list, one answer at a time, with direct links to relevant actions or policy details. Radix preserves keyboard navigation and expanded/selected state announcements.
- The expectations card now has two color-coded columns and six concise icon-led items: understanding the request, organizing evidence, preparing a factual response, reviewing, submitting, and understanding data sharing. The outcome limitation and privacy link remain visible.
- Existing Inter, Newsreader, Lucide icons, semantic colors and translucent surfaces provide hierarchy without new dependencies or decorative stock images.
- Pricing leads with the free notice brief and workspace. The pass card keeps the $199 one-time price and one-case limit visible. The comparison table is reduced to seven implemented capabilities. Mobile purchase buttons wrap safely.
- Copy uses concrete actions, shorter explanations and clear user control. Checkout consent remains unchecked, and the expectations card remains before the purchase controls.
- Privacy wording now matches the current server-side decoder and optional AI paths. Unsupported claims about browser-only decoding, guaranteed paid AI processing and provider retention were removed. The workspace response uses saved wording; optional suggestions and the older interview flow can send text to Gemini. Original files are not sent with those text-processing requests.
- FAQ and trust-card refund text now matches the existing published seven-day refund policy. The earlier unredeemed-only condition was unsupported and removed. Refund terms and statutory consent wording were not changed.

## Verification

- Production build, TypeScript, ESLint, copy lint, formatting and whitespace checks passed.
- 21 targeted unit tests passed (core and NextStepsView).
- 32 Chromium browser tests passed with zero retries (FAQ, marketing and accessibility specs). The new FAQ coverage checks topic switching by keyboard, accordion behavior, free-decoder navigation and visible disclosures before unchecked consent.
- Additional presentation checks: 16 WCAG A/AA scans across both routes, themes and all four active topics; 16 page-overflow checks at 320, 390, 768 and 1440px. No violations, overflow or browser page errors were recorded. These are targeted checks, not complete accessibility certification.
- Desktop and mobile screenshots reviewed in light and dark modes.

## Review artifacts

- [FAQ, light desktop](screenshots/2026-09-18-faq-expectations/faq-light-desktop.png)
- [FAQ, dark mobile](screenshots/2026-09-18-faq-expectations/faq-dark-mobile.png)
- [Expectations, dark desktop](screenshots/2026-09-18-faq-expectations/expectations-dark-desktop.png)
- [Expectations, light mobile](screenshots/2026-09-18-faq-expectations/expectations-light-mobile.png)
- [Pricing, light desktop](screenshots/2026-09-18-faq-expectations/pricing-light-desktop.png)
- [Presentation verification](screenshots/2026-09-18-faq-expectations/verification.json)

The rebuilt local preview is at `http://localhost:3100`; reload the existing tab for the new assets. Automated preview checks used IPv6 loopback because an unrelated service also uses IPv4 port 3100. No payment, commit, push or deployment was performed. Existing launch checks and deferred features remain in the implementation/integrity handoffs.
