# SEO Content Plan — Free-Tool Pages for Panic Queries

**Why this file exists / when to use it:** Suspended sellers search in panic ("amazon account suspended appeal", "plan of action template") and today's results are dominated by attorney lead-gen pages and agency blogs. A free, working tool page beats a 2,000-word editorial for those queries: it answers the search instantly and converts on the spot. This file defines the keyword work, the page architecture, the content rules, the cadence, and — just as important — what we deliberately do NOT spend on yet. SEO is the compounding channel behind the community engine in `./01-FIRST-100-USERS.md`, not a launch channel.

**Terms used here:** POA = Plan of Action, the structured appeal document Amazon requires. Section 3 = the fraud/illegality clause of Amazon's Business Solutions Agreement (BSA). ODR = Order Defect Rate. AHR = Account Health Rating. SERP = search engine results page. KD = keyword difficulty (Ahrefs 0–100 scale). GSC = Google Search Console. CTA = call to action.

---

## 1. FIRST TASK — one hour in Google Keyword Planner, before writing anything

**No search-volume figure for these queries has ever been verified.** Every volume number in the older research documents is a SERP-derived guess, and the synthesis brief explicitly bans quoting volumes until real data exists (correction 7). Google Keyword Planner is free (requires a Google Ads account; no ad spend needed) and returns real volume ranges and CPCs.

- [ ] **1.** Spend one hour in Google Keyword Planner: pull monthly volume ranges + CPC for every query in the Section 2 table (plus close variants Planner suggests); record results in a `keyword-data` sheet with the pull date — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 2, before any SEO page is written · **Blocks:** page prioritization (Section 3), any future paid-ads decision (`./01-FIRST-100-USERS.md` Section 6)

Until that sheet exists, the only honest volume statement is "unverified". After it exists, re-rank the target list below by (volume × intent match) and build in that order.

---

## 2. Target query list

Volumes: **UNVERIFIED — fill from the Keyword Planner sheet (action 1).** Difficulty and SERP composition are estimates from SERP observation, not live tool pulls. [source: APPEALDECK_DISTRIBUTION_CHANNEL_MECHANICS.md §1.4]

| Query | Intent | Serving page (Section 3) | Difficulty (estimate) | Who owns the SERP today |
|---|---|---|---|---|
| amazon account suspended appeal | Panic, immediate | Decoder tool page | Hard (65–75) | Law firms (Rosenbaum, DAM), agencies (eStore Factory, My Amazon Guy), authority blogs |
| amazon plan of action template | Solution-seeking | POA-format explainer + decoder CTA | Hard (60–70) | Attorney/agency layer + template farms incl. SellerForge |
| amazon plan of action generator | Tool-seeking | Decoder → composer funnel page | Medium-Hard | SellerForge free generator, AppealsPro |
| section 3 suspension | Panic, specific | Section 3 explainer | Medium-Hard (55–65) | Law-firm blogs; fewer dedicated pages — real opening |
| amazon seller account deactivated what to do | Panic, informational | "First 24 hours" explainer | Medium (50–60) | Mixed SERP; beatable with a free-tool page |
| amazon funds hold appeal / amazon disbursement appeal | Panic, money-focused | Funds-hold explainer | Medium (estimate) | Thin coverage; must reflect the corrected deadline model (funds appeal eligible +60 days, per policy since Oct 2024; holds never auto-release) |
| free amazon suspension notice decoder | Tool-seeking, long-tail | Decoder tool page | Low-Medium (30–45) | Barely contested — highest intent match |
| what type of amazon suspension do i have | Diagnostic, long-tail | Decoder tool page | Low-Medium (30–45) | Barely contested |
| amazon POA format requirements | Solution-seeking, long-tail | POA-format explainer | Low-Medium (30–45) | Template blogs |
| amazon account health rating explained | Preventive, informational | AHR explainer | Medium | Tool blogs (Helium 10 etc.) — lower priority, top-of-funnel |
| amazon related account suspension / amazon identity verification appeal | Panic, specific | Per-type explainers (post-launch wave) | Medium (estimate) | Law-firm blogs |

**Key structural insight:** the SERP for the head terms is lawyer lead-gen, not software. A page where the visitor can paste their notice and get a classification in 30 seconds has higher engagement and lower bounce than any editorial page — that behavioral signal is how a zero-authority domain can climb these SERPs at all. Long-tail tool queries (KD 30–45 estimate) are the entry wedge; head terms come later, if ever. [source: APPEALDECK_DISTRIBUTION_CHANNEL_MECHANICS.md §1.4]

---

## 3. Page architecture

```
appealdeck.app
├── /decode                        ← THE SEO asset: free decoder, no paywall, no login
├── /suspensions/                  ← cluster hub: "Amazon suspension types explained"
│   ├── /suspensions/section-3         ← explainer + embedded decoder CTA
│   ├── /suspensions/odr               ← explainer + embedded decoder CTA
│   ├── /suspensions/ip-complaint      ← explainer + routes to legal help + decoder CTA
│   ├── /suspensions/funds-hold        ← explainer (corrected +60d appeal model) + CTA
│   ├── /suspensions/related-account   ← post-launch wave
│   └── /suspensions/identity-verification ← post-launch wave
├── /poa-format                    ← "the exact structure Amazon reviewers expect" + CTA
└── /blog/                         ← supporting posts (AHR explained, lessons posts)
```

Rules of the architecture:

1. **The decoder page is the asset.** Every explainer page embeds a decoder CTA above the fold ("Not sure which type you have? Paste your notice — free, nothing stored without your say-so"). Explainers exist to catch specific queries and hand the visitor to the decoder.
2. **One page per v1 violation type**, interlinked through the `/suspensions/` hub (topical cluster). The violation taxonomy comes from the build plan's Amazon domain pack (`../03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md` §7).
3. **Community threads index first.** Good Reddit answers rank on Google within days; our pages take months. Write replies knowing they are also search results, then capture the same query with an optimized page later.
4. Static pages; they run on Vercel (single-host decision, 4 Sep 2026 — superseding this row's original Cloudflare-only assumption; see `07-REFERENCE/04-UNKNOWNS-REGISTER.md`). [source: APPEALDECK_STREAM9_DISTRIBUTION_REPORT.md]

---

## 4. Content rules (every page, no exceptions)

1. **Honest.** No invented statistics, no success-rate claims, no outcome promises. The word "guarantee" is banned everywhere (decision D6; the grep gate covers the site).
2. **Cite Amazon policy by name.** "Section 3 of the Business Solutions Agreement", "Order Defect Rate policy", "Account Health Rating", "Funds Disbursement Eligibility" — precise policy names build trust and match search phrasing.
3. **Deadlines per the corrected model only.** Funds appeal eligible +60 days (policy since Oct 2024); holds never auto-release; an acknowledgment is not a decision. Never any of the banned figures from older documents (no "17 days to submit", no "24–48h decisions", no "withdrawable after 90 days").
4. **Not-legal-advice disclaimer** on every page; IP-dispute and fraud-allegation content routes readers to professional help (severity gating, D6).
5. **Date-stamp and maintain.** Every page shows a "last verified" date; Amazon policy pages get re-checked quarterly. A stale policy page in this niche is worse than no page.
6. **Honest expectations block** on every explainer: most first appeals fail, even expensive ones; quality of the first submission matters more than speed.
7. **Privacy is a feature — say it.** The decoder page states plainly what happens to pasted text (local rules-based decode by default; cloud processing only with explicit consent), consistent with the local-first positioning in `./04-COMPETITIVE-RESPONSE.md`.
8. English only for now (non-English content is P2 backlog, decision D7).

---

## 5. Publishing cadence

| Period | Output | Notes |
|---|---|---|
| Weeks 2–3 | Keyword Planner sheet (action 1) + first explainer drafted | Publish waits for the decoder if the page depends on the CTA |
| Weeks 4–5 | Decoder page live (ships with Phase 2 build) + Section 3 explainer + "deactivated: first 24 hours" | Decoder live = the SEO clock starts |
| Weeks 6–8 | One page/week: POA format, funds hold, ODR | Matches the Week 5/8 blog slots in `./01-FIRST-100-USERS.md` |
| Weeks 9–16 | 1–2 pages/week until every v1 violation type has an explainer; then AHR explainer and lessons posts | |
| Ongoing | Quarterly re-verification of every policy-referencing page | Calendar reminder, non-negotiable |

Expectation setting: a new domain ranks for long-tail terms in roughly 3–6 months (estimate); head terms later or never. That is fine — SEO here is the compounding asset behind the community engine, not the launch channel. [source: APPEALDECK_DISTRIBUTION_CHANNEL_MECHANICS.md §8]

---

## 6. Measurement

- **GSC** (free): impressions, queries, positions — reviewed in the Friday funnel review (`./01-FIRST-100-USERS.md` Section 5).
- **Plausible/Umami:** organic-source decoder sessions and decode completions per landing page. A page is judged on decode completions it feeds, not pageviews.
- **Ahrefs Webmaster Tools** (free for owned site): backlinks + technical audit. Ubersuggest free tier (3 lookups/day) for incidental keyword checks.
- Success criterion for the phase: organic search becomes a measurable, growing source of decode completions by month 3–4 (estimate) — and at least one paid Pass attributes to organic before any paid-acquisition discussion opens.

---

## 7. What we do NOT invest in yet

| Not yet | Why | Revisit when |
|---|---|---|
| Paid search/social ads | Zero-cash-first principle; no verified volumes/CPCs yet; no proven organic conversion | Both unlock conditions in `./01-FIRST-100-USERS.md` Section 6 met. ⚠ FOUNDER-DECISION — first ad budget is a real cash commitment against thin data; founder sets the cap personally |
| Editorial link-building / guest-post outreach | Time-expensive, slow, and the SERP wedge is tool pages, not authority articles | After every violation type has a page and organic decode completions are flat for 8+ weeks |
| Paid SEO tools (Ahrefs Lite $29/mo etc.) | Free stack (GSC + Ahrefs Webmaster Tools + Ubersuggest + Keyword Planner) covers current needs | When keyword-gap analysis against competitors becomes the bottleneck, not before |
| Programmatic SEO (mass-generated pages) | Thin AI pages are a Google-penalty risk and off-brand for a trust product | Probably never in this form |
| PR agencies / sponsored placements | Product Hunt, Show HN, and podcast outreach are free and named-founder-shaped | Post first-100, if ever |
| Non-English pages | P2 backlog (decision D7); Amazon requires English POAs anyway | Per the P2 roadmap |

---

## 8. Action checklist

(Action 1 is in Section 1.)

- [ ] **2.** Re-rank the Section 2 query table using real Keyword Planner data; record the build order — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** page prioritization
- [ ] **3.** Write the reusable page skeleton: policy-name citation block, honest-expectations block, decoder CTA block, disclaimer, "last verified" stamp — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 3 · **Blocks:** every explainer page
- [ ] **4.** Draft the Section 3 explainer and the "deactivated: first 24 hours" page (publish when the decoder is live) — **Owner:** AI assistant, Founder reviews · **Cost:** $0 · **Deadline:** Week 4 · **Blocks:** first organic capture
- [ ] **5.** Verify GSC + Ahrefs Webmaster Tools + Plausible/Umami are wired to the domain with organic source attribution — **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** Week 4 (decoder launch) · **Blocks:** Section 6 measurement
- [ ] **6.** Publish per the Section 5 cadence; every page passes the Section 4 rules checklist before going live (including the "guarantee" grep) — **Owner:** AI assistant drafts, Founder approves · **Cost:** $0 · **Deadline:** Weeks 4–16 · **Blocks:** compounding organic channel
- [ ] **7.** Set the quarterly policy-page re-verification reminder — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 8 · **Blocks:** content trustworthiness over time

---

## Definition of done

- [ ] Keyword Planner sheet exists with real volume ranges + CPCs for every target query, dated
- [ ] Query table re-ranked on real data; build order recorded
- [ ] Decoder page live and indexed; GSC verified; analytics attributing organic decode completions
- [ ] Every v1 violation type has a published explainer with embedded decoder CTA
- [ ] 100% of published pages pass the Section 4 rules (spot-check: policy names cited, no "guarantee", disclaimer present, "last verified" date current)
- [ ] Organic search visible as a distinct, growing decoder-session source in the weekly funnel review
- [ ] Zero spend on the Section 7 "not yet" list without the stated revisit condition being met and documented
