# 06-EDGE-PERSONAS — The five user types we knowingly lose at v1

**Why this file exists / when to use it:** AppealDeck v1 is deliberately single-user, single-account, desktop-Chrome, English-only, and local-first. Those constraints are what make it buildable by one founder in eight weeks — and they exclude five identifiable buyer types. This file names each excluded persona, why they will churn or never convert, what the market signal says about their value, and exactly what we instrument so the revisit decision is made on our own data instead of on anecdotes. Use it when a user request, a competitor move, or a refund reason maps to one of these personas: check the persona's revisit trigger before proposing to build anything.

**Terms used below:** VA = virtual assistant (outsourced account operator, often in Pakistan/Philippines). POA = Plan of Action, the appeal document Amazon requires — Amazon requires it in English. Multi-tenant = one product installation serving several separate client accounts with isolation between them. SP-API = Amazon's official Selling Partner API, the sanctioned data channel under Amazon's Business Solutions Agreement (BSA) §19. Guardian = our deferred $29/mo monitoring subscription (decision D7, `../00-DECISION/02-DECISION-LOG.md`). PWA = progressive web app (installable mobile-capable web application). P1/P2 = post-launch priority tiers defined in `07-ROADMAP-AND-EXPANSION.md`.

**Standing rule (read this before reading the personas):** losing these users at v1 is a decision, not an oversight. Serving any of them requires accounts, sync, translation, or monitoring infrastructure that would delay the launch that funds everything else.

---

## 1. Persona EP-1 — The agency / multi-VA account operator

> "I manage twelve seller accounts for clients. My VA in Lahore works in three of them. We sometimes share a device."

- **Profile:** third-party agencies, VA teams, multi-account portfolio owners, buyers of existing Amazon businesses. Related-account enforcement is a major suspension category, and Amazon links accounts through shared owners, VAs, devices, IPs, bank accounts, and suppliers — so this persona is disproportionately *likely* to need us.
- **Why they churn:** AppealDeck v1 is one user, one device, one case vault, no roles, no shared state. An agency cannot represent per-client workspaces, cannot hand a case between team members, and loses the vault when switching devices. They will try the free decoder, hit the wall at collaboration, and leave.
- **Market signal:** competitors ship dedicated agency plans — SellerVault agency tier ~$499/mo with per-client isolation, SentryKit agency workspaces for 5–200+ accounts, SellerView flat agency pricing (all (unverified) — vendor pages cited in the Stream 10 research were not independently re-fetched; SellerForge's agency tier at ~$4,999/yr is the most likely-real anchor since its core pricing WAS live-verified 25 Aug 2026). Direction of the signal is solid even if the numbers are not: agencies pay hundreds per month for multi-tenant tooling.
- **What we instrument:** intake answers containing multiple distinct company/legal-entity names per device; the words "client", "VA", "agency", "my seller" in intake free-text; the same license key active from >2 device fingerprints; support tickets asking about seats or account switching.
- **Revisit trigger / priority:** **P2** (opt-in sync + roles). Trigger: agency-signal telemetry in ≥10% of paid intakes over 4 weeks, OR 5+ direct requests with a stated willingness to pay. Multi-tenant needs an accounts/auth backend — it is a different product tier, priced accordingly, never a free retrofit.

## 2. Persona EP-2 — The non-English seller

> "I'm in Vietnam. My English is basic. The notice is in English. The POA must be in English."

- **Profile:** the largest slice of new-seller growth is non-English-first. The often-quoted figure — 60%+ of new Amazon seller registrations are Chinese — is **(unverified)**: it traces to a single aggregator ("Navos 2025") that could not be independently confirmed. Treat the direction (very large non-English cohort) as real and every specific percentage as unusable in planning or copy.
- **Why they churn:** the entire product — UI, intake, drafts — is English. A seller who cannot verify what the POA says will not pay $199 for it, and a mistranslated appeal burns their scarcest resource (appeal attempts). Amazon compounds the pain: supporting documents outside its supported-language list need notarized translation.
- **Market signal:** Chinese-market seller tooling and service agencies exist at scale (direction verified by the size of the Chinese seller ecosystem; specific vendors/pricing (unverified)). Nobody in the appeals niche does high-quality localized POA workflows — which is a signal both of opportunity and of difficulty.
- **What we instrument:** browser `Accept-Language`/UI-locale of decoder sessions; decode inputs whose notice text is Amazon-standard English but whose intake free-text answers are in another language; drop-off rate between decode-complete and intake-start segmented by locale; explicit "do you have this in [language]?" support tickets.
- **Revisit trigger / priority:** **P2** (DE/FR locales first, then translation-with-disclaimer — see `07-ROADMAP-AND-EXPANSION.md` §2). Trigger: ≥15% of decoder sessions from a single non-English locale, OR conversion for a locale lagging the English baseline by more than half. The v1 rule stands: never auto-submit or sell a non-English POA; any future translation ships as *understanding aid only*, with the disclaimer "Amazon requires English submission; this translation is for your understanding only."

## 3. Persona EP-3 — The mobile-only seller

> "I don't own a computer. Seller Central, orders, everything — it's all on my phone."

- **Profile:** emerging-market sellers, side-hustlers, travelers. Android dominates global mobile share; Amazon's own Seller app is the primary mobile interface and has **no** notice decoding or POA drafting.
- **Why they churn:** **Chrome for Android does not support extensions** (verified structural fact — this is a platform limit, not a design choice). The panic moment frequently arrives on a phone. For this persona the extension does not merely underperform — it cannot be installed at all.
- **The one path we DO have:** the web decoder (`../04-PHASE-3-LAUNCH/01-WEB-DECODER-LAUNCH.md`) is deliberately the first shipped surface (decision D3) partly *because* it catches mobile panic-searchers. A mobile-usable decode → intake → purchase flow means this persona is lost to the *extension*, not to the business. Mobile web must therefore never be broken: responsive layout is a launch requirement, not a nice-to-have.
- **Market signal:** no competitor serves POA drafting natively on mobile either (Amazon Seller app verified to lack it; competitor mobile apps (unverified)). The web is everyone's only mobile lane — being best at it is cheap differentiation.
- **What we instrument:** mobile user-agents on the web decoder (sessions, decode completions, purchases — the single most important segment split in analytics, D10 funnel); scroll/abandon points on mobile viewports; "can I use this on my phone" tickets.
- **Revisit trigger / priority:** **P1 for web-decoder mobile parity of the paid composer flow; P2 for PWA/full parity (vault, deadlines)**. Trigger for the P2 build: mobile sessions ≥30% of decoder traffic AND mobile purchase conversion at least half of desktop (proving mobile buyers exist before building for them).

## 4. Persona EP-4 — The agency bulk user

> "A suspension wave hit. I need to triage fifty client accounts and draft POAs for the ones at risk — today."

- **Profile:** account-recovery agencies and large portfolio managers. Distinct from EP-1: EP-1 wants *collaboration* on individual cases; EP-4 wants *volume operations* — bulk import, batch triage, client-facing reports.
- **Why they churn:** v1 has no bulk anything. Fifty cases means fifty manual decode-intake cycles on one device. They will not attempt it twice. Per-case $199 pricing also inverts for them: at volume they want per-seat or per-account pricing.
- **Market signal:** the bulk segment is served by SP-API-connected platforms (SellerForge's higher tiers — pricing live-verified 25 Aug 2026; SellerVault/SentryKit agency plans (unverified)). Their common denominator is official SP-API access — exactly the integration we defer until legal clarity + proven demand (decision D7). This persona is structurally out of reach until that decision reopens.
- **What we instrument:** repeat purchases of multiple Appeal Passes under one email/license within 30 days; intake company-name field differing across cases from the same device; direct "bulk pricing?" inquiries (tag them in the support sheet — each is a data point with a name attached, i.e., a future design partner).
- **Revisit trigger / priority:** **P2**, and strictly behind the SP-API legal read. Trigger: ≥3 organic bulk-pricing inquiries per month, sustained for two months, AND the §19/Agent Policy read (Phase 2 gate) concluding SP-API integration is safe. Until then the honest answer to bulk inquiries is a polite no plus the consultant referral list.

## 5. Persona EP-5 — The recurring-protection buyer

> "I pay a consultancy about $500 a month to watch my account. Can I get monitoring plus drafting for $29?"

- **Profile:** high-anxiety, high-volume sellers who buy prevention, not cure. They compare us against human monitoring services — Riverbend-style offerings run at roughly ~$500/mo (current price (unverified, quote-gated) — Riverbend is quote-only today; the figure is user-reported/historical, see `01-MARKET-EVIDENCE.md` §1.2) — and against automated SP-API monitors at $19–199/mo ((unverified) except SellerForge's verified tiers).
- **Why they churn (or worse, refund):** **Guardian has no monitoring backend at launch.** A local-first extension only "monitors" while the user is on Seller Central — that is not monitoring in this buyer's sense. Selling the $29/mo SKU before real alerting exists would collect subscriptions for vapor, generating churn, refunds, and exactly the trust damage the whole strategy exists to avoid. This is why decision D7 defers the Guardian SKU until the monitoring feature actually ships.
- **Market signal:** the willingness to pay recurring for protection is the best-evidenced of all five personas (verified: real firms sell monitoring retainers; the panic-prevention budget exists). The gap between ~$29 automated and ~$500 human is a real slot — later.
- **What we instrument:** decoder users returning ≥3 times without a purchase (prevention-minded browsers); email-capture opt-ins for "alert me about account-health changes" (a zero-build waitlist that directly measures Guardian demand); post-purchase survey answers naming monitoring as the desired next feature; tickets asking "will you watch my account?".
- **Revisit trigger / priority:** **P1 to build the monitoring backend, gated as in `07-ROADMAP-AND-EXPANSION.md` §1 item 4; the SKU goes on sale only after the feature ships.** Trigger to start the build: Guardian waitlist ≥100 emails OR ≥10% of paid customers requesting monitoring — combined with a compliant data path (email/notice-forwarding based, or SP-API after the legal read; never scraping).

---

## 6. Summary table

| # | Persona | Core blocker in v1 | Priority | Revisit trigger (data, not anecdote) |
|---|---|---|---|---|
| EP-1 | Agency / multi-VA | No accounts, roles, or sync | P2 | Agency signals in ≥10% of paid intakes / 5+ paying requests |
| EP-2 | Non-English seller | English-only UI + output | P2 | ≥15% sessions one non-English locale, or conversion gap >50% |
| EP-3 | Mobile-only seller | Chrome Android has no extensions — web decoder is their only path | P1 (web parity) / P2 (PWA) | Mobile ≥30% of sessions AND mobile conversion ≥50% of desktop |
| EP-4 | Agency bulk user | No bulk ops; needs SP-API | P2 | 3+ bulk inquiries/mo for 2 months AND §19 legal clarity |
| EP-5 | Recurring-protection buyer | Guardian has no monitoring backend at launch | P1 (feature build, gated) | Waitlist ≥100 OR ≥10% of customers requesting monitoring |

---

## 7. The closing rule

**Do NOT build multi-tenant, mobile-native, or translation features in v1. Instrument first; decide on data.** Every instrumentation signal above is cheap (an analytics event, a regex on intake text, a spreadsheet tag); every premature build is weeks of solo-founder time taken from the product that pays. The revisit triggers in §6 are the only sanctioned way a persona re-enters scope — and each re-entry lands as a roadmap item in `07-ROADMAP-AND-EXPANSION.md`, not as an ad-hoc build.

---

## 8. Actions

- [ ] **1.** Implement the persona telemetry pack: locale + user-agent segmentation on the web decoder, agency-keyword flag on intake free-text (client/VA/agency/multiple company names), multi-device license counter, repeat-decoder-visit counter. All opt-in-compliant and aggregate-only, per the privacy posture in `../02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md`. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with analytics setup (M-4) · **Blocks:** every revisit trigger in §6.
- [ ] **2.** Add a "notify me when account monitoring ships" email capture (Guardian waitlist) to the post-purchase screen and the decoder. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** web decoder launch (week 4–5) · **Blocks:** EP-5 trigger measurement.
- [ ] **3.** Create the support-sheet tags `agency-inquiry`, `bulk-inquiry`, `language-request`, `mobile-request`, `monitoring-request` and log every matching ticket. **Owner:** Founder (a future vetted VA may triage per `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` §4) · **Cost:** $0 · **Deadline:** before launch (M-7) · **Blocks:** demand evidence for all five personas.
- [ ] **4.** Verify the mobile web decoder flow end-to-end on a real Android phone (decode → intake → checkout) before launch. **Owner:** Founder (AI assistant fixes findings) · **Cost:** $0 · **Deadline:** week 4–5 · **Blocks:** EP-3's only path.
- [ ] **5.** Review persona telemetry at the weekly founder review (D10 cadence); when any §6 trigger fires, log the decision in `../00-DECISION/02-DECISION-LOG.md` and move the item into `07-ROADMAP-AND-EXPANSION.md`. **Owner:** Founder · **Cost:** $0 · **Deadline:** weekly, from M-4 · **Blocks:** data-driven scope decisions.

---

## Definition of done

- [ ] All five personas' telemetry signals are live and producing weekly numbers by M-4 (locale split, mobile split, agency flags, waitlist count, tagged tickets).
- [ ] The mobile web decoder path works on Android at launch (verified by a real-device run-through).
- [ ] No v1 code implements multi-tenant, translation, mobile-native, or monitoring features; any exception is logged as a decision with a fired §6 trigger attached.
- [ ] Every "can you do X?" inquiry matching a persona is tagged and counted, and the counts appear in the weekly review.
- [ ] A newcomer can read §6 alone and correctly answer which requests we decline today, and what evidence would change each answer.
