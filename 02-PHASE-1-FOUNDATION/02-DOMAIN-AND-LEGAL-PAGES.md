# Domain & Legal Pages — the live site that must exist BEFORE the Paddle application

**Why this file exists / when to use it:** Paddle (our primary Merchant-of-Record candidate) reviews your live website before approving you, and it rejects thin or incomplete sites — especially from pre-revenue solo founders. This file specifies the minimum real site: domain, landing content, privacy policy, terms of service, refund/withdrawal mechanics, and the not-legal-advice disclaimer block reused across every surface. Execute it in Week 1–2, before submitting the Paddle application in `./03-PAYMENTS-SETUP.md`.

Glossary: **POA** = Plan of Action (the appeal document Amazon requires from a suspended seller). **MoR** = Merchant of Record.

---

## 1. Domain selection

Target: **`appealdeck.app`** (or the closest available equivalent — `appealdeck.com`, `getappealdeck.com`, `appealdeck.io`). Criteria: short, matches the product name, credible to a panicking Amazon seller. Notes:

- `.app` is a Google-run TLD with HSTS preloading — HTTPS is mandatory, which every host on our list auto-provisions. Typical price ~$11–18/yr depending on registrar and first-year promos.
- Registrar: Porkbun, Cloudflare Registrar (at-cost), or Namecheap — all in the ~$10–30/yr band.
- Optionally also register the `.com` if cheaply available, redirecting to the primary — protects the brand for a few dollars. Optional, not blocking.

- [ ] **1.** Check availability and register the primary domain. — **Owner:** Founder · **Cost:** ~$10–30/yr · **Deadline:** Week 1, Day 1–3 · **Blocks:** everything else in this file
- [ ] **2.** Point DNS at Cloudflare; confirm HTTPS works. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** site deploy

---

## 2. Minimal landing page content (the Paddle-reviewable site)

The Week-1 site does not need the decoder (that ships Week 4–5). It needs to be a **real, navigable, honest site** that a payments-risk reviewer can read and understand. Required pages and content:

| Page | Must contain |
|------|--------------|
| **Home** | What AppealDeck is, in software terms: "Software that helps Amazon sellers understand enforcement notices and prepare appeal documents." Plain description of the flow: paste/decode a notice → answer a structured interview → get a draft Plan of Action you edit and submit yourself. The not-legal-advice disclaimer block (§5) in the footer. No "beta", "test", or placeholder text anywhere. |
| **Pricing** | Free notice decoder (labelled "coming soon" until Week 4–5 is acceptable); **Appeal Pass — $199 one-time, per case** with a bullet list of what it unlocks. Do NOT list Guardian ($29/mo) as purchasable — the monitoring feature doesn't exist yet (decision D7); it may be described as "planned". No success-rate claims of any kind. |
| **About / Contact** | Who runs it: the founder's real name (Jhangir Hussain), brand name (AppealDeck by Hawlton), contact email on the domain. Matches the identity on the Paddle application and the CWS listing exactly — identity mismatches are a documented Paddle rejection trigger (unverified — third-party rejection analyses). |
| **Refund policy** | The 7-day voluntary refund + EU withdrawal mechanics (§4.3), stated plainly with no qualifiers that contradict it. |
| **Privacy policy** | §3 below. |
| **Terms of service** | §4 below. |

Copy rules (binding, from decision D6): the word "guarantee" appears **nowhere** (grep gate = 0 hits); no win-rate or success-rate numbers anywhere (we have no opt-in outcome data yet — and invented ones are banned); no "first/only tool" claims (the category is occupied — SellerForge et al.); anchor value against verified consultant fees ($1,495–$5,000 published by named firms) only with care and no disparagement.

- [ ] **3.** AI assistant drafts all six pages per this spec; founder reviews every line and publishes. — **Owner:** AI assistant (draft), Founder (review + publish) · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** Paddle application

---

## 3. Privacy policy — required contents

The policy must describe what the product ACTUALLY does — the data flows below are the real architecture. Free generators (TermsFeed/Termly free tiers) may provide the skeleton, but the output must be self-hosted on our own domain and manually extended with the items below; generator boilerplate alone is wrong for this product.

### 3.1 The four real data flows (enumerate all of them, honestly)

1. **Local-first case data.** Notice text, intake answers, POA drafts, evidence files live on the user's own device, and by default they are never transmitted to our servers. This is the headline privacy property — state it plainly, and state the two surfaces separately and honestly: in the **extension**, case data lives in an **encrypted IndexedDB vault**; in the **web decoder (v1)**, case data lives in **unencrypted browser-local storage (localStorage/IndexedDB)** on the user's device — still never transmitted to our servers, but the encrypted vault is extension-exclusive at v1. Never let copy imply the web surface is encrypted.
2. **License validation.** A random device identifier and license key are sent to our backend (Supabase) to check entitlement. No case content is included.
3. **Consented cloud-LLM payloads.** Only when the user explicitly enables cloud processing (off by default in the extension; inherent and disclosed in the web decoder), notice excerpts and intake answers are sent to our backend, which forwards them to Google's Gemini API on the **paid tier** (contractually not used for model training). State exactly what is sent, when, and that the consent toggle controls it.
4. **Anonymous telemetry.** Opt-in only; event names and numeric properties (e.g. "decode_completed", a confidence bucket); never notice text, never seller identity.

Also disclose: the analytics tool (Plausible or Umami — cookieless, aggregate only), and that AI assistance is used to generate draft documents.

### 3.2 GDPR duties (founder obligations behind the policy)

| Duty | What to do | Tooling/cost |
|------|-----------|--------------|
| **Article 30 ROPA** | Maintain a record of processing activities: license data, cloud-LLM payloads, telemetry, support email. A spreadsheet is legally sufficient at this scale. | A free Article 30 ROPA spreadsheet template (e.g., the EU SME template) — $0 |
| **DPAs with subprocessors** | Execute/accept the standard DPA of each processor: **Paddle** (payments), **Supabase** (backend), **Cloudflare and/or Vercel** (hosting), **Google** (Gemini API). All offer standard self-serve DPAs. Keep signed/accepted copies on file. Publish the subprocessor list on the site. | $0 |
| **72-hour breach notification** | If personal data is breached, notify the relevant supervisory authority within 72 hours of awareness, and affected users when the risk is high. Keep a one-page internal SOP: detect → contain → assess scope → notify → document. Links into `../06-OPERATIONS/` (crisis playbook). | $0 |
| **DSR SOP** | Data-subject requests come to the business email. SOP: verify identity → locate data (licenses row, telemetry by device id, support emails) → export or delete → respond within 30 days → log the request. Note honestly: case content is local to the user's device — we cannot access or delete what we never receive. | $0 |

- [ ] **4.** Draft the privacy policy covering §3.1 + a subprocessor list; founder reviews and publishes. — **Owner:** AI assistant (draft), Founder (publish) · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** Paddle application, CWS listing (privacy-policy URL is mandatory)
- [ ] **5.** Create the ROPA and sign/accept all subprocessor DPAs; store copies in `../07-REFERENCE/` or the founder's records. — **Owner:** Founder (AI assistant prepares the ROPA skeleton) · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** defensible GDPR posture before first user data
- [ ] **6.** Write the breach-notification and DSR one-pagers. — **Owner:** AI assistant (draft), Founder (approve) · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** operations readiness

---

## 4. Terms of Service — required contents

### 4.1 Core clauses

1. **What the service is:** software for document preparation and case organization. **Not a law firm, not legal advice** — see the disclaimer block (§5), which appears in the ToS verbatim.
2. **No outcome promises:** appeal decisions are made solely by Amazon; most first appeals fail even with expensive professional help; nothing in the service assures reinstatement. (Never use the banned word — phrase as "no outcome is promised or assured".)
3. **Severity gating disclosure:** certain notice types (forged-document allegations, fraud, child-safety) are not sold an Appeal Pass; the product routes them to a professional-help screen instead (decision D6).
4. **User responsibility:** the user reviews and submits their own appeal; the product never automates or submits anything on Amazon.
5. **Liability cap:** liability limited to the amount the customer paid in the preceding 12 months, to the extent permitted by law (consumer-rights carve-outs apply — EU consumer statutory rights cannot be contracted away).
6. **IP/complex cases:** intellectual-property disputes, arbitration, and legal proceedings are out of scope and referred to qualified attorneys.
7. **Governing law:** Pakistan, without prejudice to mandatory consumer protections of the customer's home country.

### 4.2 Refund policy (decision D8 — binding)

- **7-day voluntary refund, no questions asked**, for the Appeal Pass. Fast refunds beat disputes: chargeback thresholds are existential for a MoR relationship, and a MoR termination kills the business. Never argue with a refund request inside the window.
- Note the mechanics: with a MoR, the MoR is the legal seller and processes the refund — our SLA is to approve/forward the request within 24h. Configuration details in `./03-PAYMENTS-SETUP.md`.

### 4.3 EU 14-day withdrawal mechanics (must be built into checkout, not just written)

EU consumers have a 14-day right of withdrawal for digital content **unless** delivery begins early with their explicit prior consent. To sell a generated POA without a 14-day free-for-all:

1. **Explicit prior consent at checkout:** an unticked checkbox (or equivalent express act) stating the customer agrees that delivery of the digital content (POA generation) begins immediately, and acknowledges that they thereby lose the 14-day right of withdrawal once performance begins.
2. **Confirmation on a durable medium:** the consent + acknowledgment text is repeated in the receipt email (permanent form), together with the refund policy.
3. **Withdrawal function:** since 19 June 2026, EU Directive 2023/2673 requires a **dedicated, clearly-labelled electronic withdrawal function** (a button/form, findable, available the full 14-day window, ending in a timestamped acknowledgment on a durable medium) — a text link buried in the ToS is non-compliant. Build a simple withdrawal form page and wire it to the refund workflow.
4. Our 7-day voluntary refund is broader than the legal minimum in practice and coexists with these mechanics; the ToS states both without contradiction.

Note: the external EU consumer-law review of these mechanics is descoped per the decision log — they are AI-drafted and founder-verified now, with a scoped external review ($300–800) folded into the pre-US-marketing legal review; risk accepted because the 7-day unconditional voluntary refund exceeds the statutory remedy in practice.

- [ ] **7.** Draft the ToS per §4; founder reviews and publishes. — **Owner:** AI assistant (draft), Founder (publish) · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** Paddle application
- [ ] **8.** Build the withdrawal-function page (form → email/webhook into the refund workflow, timestamped acknowledgment). — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** before checkout goes live (Week 4–5) · **Blocks:** legally compliant EU checkout
- [ ] **9.** Ensure the checkout consent checkbox + durable-medium confirmation are configured on Paddle (verify Paddle checkout supports custom consent text; if not, place the consent step on our own pre-checkout page). — **Owner:** AI assistant (Founder verifies) · **Cost:** $0 · **Deadline:** before checkout goes live · **Blocks:** enforceable delivery-before-withdrawal

---

## 5. The not-legal-advice disclaimer block (reuse verbatim, everywhere)

This exact text appears in: the site footer, the ToS, the extension first-run screen, the POA editor footer, every exported POA, and the CWS store listing description.

> **AppealDeck prepares documents and organizes your case. It is not a law firm and does not provide legal advice.** Appeal decisions are made solely by Amazon, and no outcome is promised or assured. For intellectual-property disputes, arbitration, or any matter with legal stakes, consult a qualified attorney.

Rules: never soften it, never move it below the fold on purchase screens, never let generated documents ship without it. The grep gate from decision D6 applies to this block too — it deliberately does not contain the banned word.

---

## 6. Review workflow

**AI drafts → founder reviews & publishes** is the default for all pages above ($0). External review is **optional-but-prudent**, not a gate:

- Scoped external legal review (ToS + privacy + withdrawal mechanics): ~$500–1,500 — recommended before any paid US marketing spend, not before launch.
- Cheap sanity check alternative: fixed-price marketplace review ~$50–150 (verify the reviewer's actual qualification — a $5 gig is not a lawyer).

- [ ] **10.** ⚠ **FOUNDER-DECISION** — commission the scoped external legal review now (~$500–1,500), or defer it until before US marketing spend. Default if undecided: defer; revisit at the launch gate. — **Owner:** Founder · **Cost:** $0 now / $500–1,500 if commissioned · **Deadline:** decision by Week 3 · **Blocks:** nothing at launch; US ad spend later

---

## Definition of done

- [ ] Domain registered and serving HTTPS.
- [ ] All six pages live: home, pricing, about/contact, refund policy, privacy policy, ToS — real content, founder-reviewed, no placeholders.
- [ ] Identity on the site == identity on the Paddle application == identity on CWS trader verification.
- [ ] The disclaimer block (§5) present verbatim on every listed surface that exists so far.
- [ ] Sitewide grep for the banned word = 0 hits; no success-rate numbers anywhere.
- [ ] ROPA created; subprocessor DPAs accepted and stored; breach + DSR one-pagers written.
- [ ] Withdrawal-function page live (or scheduled before checkout); checkout consent mechanics specified.
- [ ] Paddle application unblocked → proceed to `./03-PAYMENTS-SETUP.md`.
