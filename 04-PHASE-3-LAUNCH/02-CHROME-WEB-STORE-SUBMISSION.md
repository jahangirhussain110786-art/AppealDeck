# Chrome Web Store Submission — passing review under the Aug-2026 rules

**Why this file exists / when to use it:** The Chrome Web Store (CWS) tightened its Limited-Use and disclosure rules with enforcement from 1 Aug 2026, and AppealDeck's 16 Seller Central host permissions make a manual human review the planning assumption. This file contains every asset, form answer, justification, and fallback needed to submit the MV3 extension (MV3 = Manifest V3, Chrome's current extension platform) and survive review — without ever letting store timing block revenue, because the web decoder (`./01-WEB-DECODER-LAUNCH.md`) is already live and selling. Use it from week 6 (asset prep) through approval.

**Terms:** POA = Plan of Action (the Amazon appeal document). CWS = Chrome Web Store. DSA = the EU Digital Services Act, which forces marketplaces (including CWS) to verify and display "trader" contact details for developers selling to EU users. Limited Use = Google's policy restricting what user data an extension may collect and why.

---

## 1. Prerequisites (verify before preparing the listing)

| Item | Status source | Notes |
|---|---|---|
| CWS developer account, $5 one-time fee paid | Phase 0/1 work (`../02-PHASE-1-FOUNDATION/`) | Registered under the clean business identity (Hawlton Alliance). |
| EU-DSA trader verification **started week 1** | CWS dashboard → account | Verification (business name, address, email, phone shown publicly on the listing) can take days–weeks; an unverified trader account loses EU listing visibility. Check status now; if not complete, escalate before submitting (§8). |
| Privacy policy + terms live on the domain | Web launch file | Same URLs go in the listing. |
| Extension build passes local QA | `../03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md` §13–§14 | `npm run zip` artifact, version from package.json. |
| Payment disclosure readiness | — | CWS allows paid functionality via **external checkout** if: (a) we clearly identify that we, not Google, are the seller; (b) the listing discloses that payment is required for core paid functionality; (c) terms of sale are posted. All three are covered below. [source: VERIFICATIONS.md, verifier 3] |

## 2. Listing assets

| Asset | Spec | Content |
|---|---|---|
| Name | ≤45 chars ideal | **AppealDeck — Amazon Appeal & POA Assistant** |
| Summary | **132 chars max**, written to the panic queries | Draft: *"Deactivated on Amazon? Decode your notice, draft your Plan of Action, and track appeal deadlines. Local-first and read-only."* (126 chars). Verify count at submission. |
| Description | First 2–3 lines carry the keywords buyers actually type ("account deactivated", "plan of action", "appeal", "Section 3", "performance notification") — naturally, not stuffed (keyword stuffing is a rejection cause). Then: what's free (decode, deadlines, vault) vs paid ($199 Appeal Pass per case — sold by Hawlton Alliance via external checkout, not through Google); the local-first promise; the read-only promise; paste-mode; the not-legal-advice line; no "guarantee", no win rates, no "first/only" claims (the category is occupied — never claim otherwise). |
| Category | Workflow & Planning |
| Screenshots (5, 1280×800) | 1. Decode card (notice → type/severity/deadlines) · 2. POA editor with draft quality score · 3. Deadlines view with countdowns · 4. Encrypted case vault · 5. **Honest-expectations card** (yes, in the store listing — it is the trust wedge) |
| Promo tiles | 440×280 small; 1400×560 marquee. Produced in Penpot/Figma with the free asset stack (all $0). [source: APPEALDECK_STREAM8_DESIGN_ASSETS.md] |
| Demo video | 30–90s, 16:9, YouTube **unlisted** link. Reviewers may flag listings without one — plan for it. Script: problem (5s) → **paste-mode decode** (20s — deliberately shows the extension working with zero Seller Central access) → intake + POA draft (20s) → deadlines + vault (10s) → honest-expectations + CTA (5s). Record with OBS Studio, trim in Shotcut (both $0). |

## 3. Single-purpose statement

> "AppealDeck helps Amazon sellers understand enforcement notices and prepare appeal documents."

Everything the extension collects or does must trace to this sentence. Anything that doesn't (there should be nothing) gets cut before submission.

## 4. Data-disclosure form (fill exactly this way)

| Form question | Answer | Rationale |
|---|---|---|
| What user data do you collect? | **Website content** (the text of the seller's own enforcement notices, when the seller invokes decode on a Seller Central page or pastes text). | Truthful and minimal. Notice text can incidentally contain personal/financial fragments — declare "website content" and describe processing honestly rather than under-declaring. |
| Where is it processed? | **Locally in the browser by default.** Transmitted to our backend **only** when the user has explicitly enabled the cloud-drafting consent toggle (off by default), and then only for generating the decode/draft. | Matches the actual architecture; the consent toggle copy in-product states exactly what is sent. |
| Sold to third parties? | No. | |
| Used for unrelated purposes / creditworthiness? | No. | |
| Telemetry | Opt-in, anonymous device id, event names + numeric properties only; never notice content, never seller identity. | Limited-Use compliant by design. |
| Privacy policy URL | `https://<domain>/privacy` | Must enumerate these exact flows. |

Surface caveat — wherever the privacy policy or any disclosure text mentions local storage or encryption, state the two surfaces separately and honestly: the **extension** stores case data in an encrypted IndexedDB vault; the **web app (v1)** stores case data in unencrypted browser-local storage (localStorage/IndexedDB) on the user's device, never transmitted to our servers. The encrypted vault is extension-exclusive at v1.

Post-submission rule: any future change to data handling must be proactively disclosed **before** it ships (Aug-2026 requirement) — put this in the release checklist permanently.

## 5. Per-host-permission justification (the 16 Seller Central hosts)

Amazon operates Seller Central on 16 distinct hosts that wildcards cannot cover (different TLDs). The review form asks for justification per permission; use one consistent justification, repeated per host:

> "The extension's single purpose is reading the seller's own enforcement notices. Amazon serves Seller Central for {region} at this host. The content script runs read-only on this host to detect and read notice text at the seller's request. It never clicks, never submits, never automates; the only page write the codebase contains is an optional, user-triggered draft insertion which ships disabled by default. All 16 hosts are regional variants of the same Seller Central application; sellers operate in multiple regions and their notices appear on the regional host."

Host list (must match the manifest exactly): `sellercentral.amazon.com`, `.ca`, `.com.mx`, `.com.br`, `sellercentral-europe.amazon.com`, `sellercentral.amazon.nl`, `.se`, `.pl`, `.com.tr`, `.ae`, `.com.sa`, `.eg`, `.in`, `.co.jp`, `.com.au`, `.sg`.

Also true and worth stating: **no** `tabs`, **no** `scripting`, **no** `<all_urls>`; permissions are `storage, unlimitedStorage, alarms, notifications, offscreen` only.

## 6. Reviewer notes (paste into the review-notes field)

> "AppealDeck is a read-only, local-first assistant for Amazon sellers appealing account/listing enforcement.
> • **You do not need a Seller Central account to review it.** Open the extension's Decode page and paste any of the sample notices below — paste-mode exercises 100% of functionality with zero page access. Sample notices: [3 anonymized fixture notices included in the package / linked].
> • Demo video (unlisted YouTube link) shows paste-mode first, then the in-page flow.
> • The content script is read-only: it reads notice text on the enumerated Seller Central hosts at the user's request. It performs no page writes, no clicks, and no form submissions.
> • All case data is stored locally (IndexedDB, encrypted). Notice text leaves the device only under an explicit, default-off consent toggle for cloud drafting, as disclosed.
> • Paid functionality ($199 Appeal Pass) is sold by Hawlton Alliance via external checkout, disclosed in the listing; the extension never handles payment data."

(The default notes above describe the shipped build: fully read-only, no injector sentence. Add one only in a submission where the draft-insertion feature actually ships enabled — B-15 ruled it in AND the flag is on — then insert after the read-only bullet: "The single write operation — inserting the user's own drafted appeal text into the appeal form's textarea — happens only on an explicit button press and never touches any submit control." Never describe an absent or disabled feature.)

## 7. Submission strategy

**Unlisted first → 5 design partners → public listing.**

1. Submit as **unlisted** as early as the build passes QA (target week 7). Unlisted still goes through review, but lets design partners install via direct link the moment it clears (`./03-DESIGN-PARTNER-BETA.md`).
2. Expect **manual review**: 16 host permissions + website-content collection + 2026 review surge ⇒ assume the slow path. Typical is days; weeks are possible. **Do not block revenue on it** — the web decoder and composer are already selling (that is the whole point of the build order).
3. Flip to **public** at M-8 launch day (`./04-LAUNCH-DAY-CHECKLIST.md`), after the M-7 gate (3 design partners through the full flow) passes.
4. Use **staged rollout** (5% → 25% → 50% → 100%) for the public release and every subsequent update **once the install base exceeds CWS partial-rollout eligibility (~10,000 users — verify the current threshold when first eligible)**. Below that threshold every release is effectively big-bang: the substitute control is hardened pre-release QA plus the tested remote-settings kill switch — a broken release during a mass-suspension wave is a crisis-playbook scenario.

## 8. Actions

- [ ] **1.** Verify EU-DSA trader verification status in the CWS dashboard; if incomplete, chase it now — it was started week 1 and blocks EU visibility. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 6 · **Blocks:** listing visibility in the EU
- [ ] **2.** Produce the 5 screenshots + 2 promo tiles (Penpot + real product UI on fixture data — no fabricated results in screenshots). — **Owner:** Founder (AI assistant preps fixture states) · **Cost:** $0 · **Deadline:** Week 6 · **Blocks:** submission
- [ ] **3.** Record + edit + upload the demo video (unlisted YouTube), paste-mode featured first. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 6–7 · **Blocks:** submission
- [ ] **4.** Write listing copy (name, 132-char summary, description) and run the banned-language check: "guarantee" = 0 hits, no win rates, no "only/first" claims. — **Owner:** AI assistant drafts, Founder approves · **Cost:** $0 · **Deadline:** Week 6 · **Blocks:** submission
- [ ] **5.** Complete the data-disclosure form per §4 and cross-check every answer against the actual network behavior of the build (inspector session, fixture case). Any mismatch = fix the build or the form before submitting. — **Owner:** AI assistant + Founder · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** submission
- [ ] **6.** Submit **unlisted** with reviewer notes (§6) + per-host justifications (§5). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** design-partner extension QA (M-6/M-7), public listing
- [ ] **7.** While in review: continue web-surface revenue and design-partner work; check review status daily; do not resubmit or ping repeatedly (it restarts queues). — **Owner:** Founder · **Cost:** $0 · **Deadline:** ongoing · **Blocks:** nothing (by design)
- [ ] **8.** On approval: distribute the unlisted link to design partners only; hold public flip for M-8 (Gate 3 must pass first — `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`). — **Owner:** Founder · **Cost:** $0 · **Deadline:** on approval · **Blocks:** M-7 gate evidence
- [ ] **9.** On rejection: execute the rejection playbook (§9) — first response within 24h. — **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** as needed · **Blocks:** listing

## 9. Rejection playbook

**Rule zero: revenue does not stop.** The web surface sells while we fix the store. Never argue with a reviewer; fix, document, resubmit.

| Likely rejection reason | Response |
|---|---|
| Host-permission overreach ("why 16 hosts?") | Resubmit with the §5 justification expanded; offer in reviewer notes to demonstrate per-region necessity. If still refused: ship with the top-5 revenue-region hosts only (`.com`, `-europe`, `.ca`, `.co.jp`, `.com.au`) and add the rest in later versions with individual justifications. |
| Data-disclosure mismatch | Something in the build sends more than the form says (or the form over/under-declares). Re-run the network audit, align, resubmit with a change note. This is the most common Limited-Use trap — treat it as a build bug. |
| "Misleading listing" / paid-functionality disclosure | Strengthen the "requires a paid Appeal Pass sold via external checkout by Hawlton Alliance" line in the first screen of the description; check screenshots don't imply free access to paid features. |
| Remote-code suspicion | We ship no remote JS (MV3 ban); remote **data** (settings JSON) is allowed. Point the reviewer at the exact fetch sites in a code-location note. |
| Single-purpose challenge | Trim any feature the reviewer flags as out of scope; the §3 statement is the boundary. |
| Repeated/unclear rejections (>2 rounds or template answers) | Use the CWS support one-more-review channel; simultaneously prepare the **nuclear fallback**: a paste-only build variant with **zero host permissions** (no content script at all — decode via paste, everything else identical). It loses the in-page panel but passes trivially and keeps the store presence while the full build is argued. ⚠ FOUNDER-DECISION — shipping the paste-only variant publicly (it changes the store-facing product promise) vs. staying unlisted-only until the full build clears. |

Escalation intel: document every reviewer exchange verbatim in the decision log — patterns across rounds are the real signal.

## Definition of done

- [ ] All assets produced (screenshots, tiles, video, copy) and archived in the repo under `docs/store/`.
- [ ] Data-disclosure form answers verified against actual build behavior.
- [ ] Trader verification confirmed complete.
- [ ] Unlisted submission made with reviewer notes + per-host justifications.
- [ ] Review outcome recorded; if rejected, playbook executed and resubmitted within 48h.
- [ ] Approved unlisted build in design partners' hands; public flip deferred to the M-8 runbook.
