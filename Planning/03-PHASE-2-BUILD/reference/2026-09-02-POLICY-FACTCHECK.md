# 2026-09-02 — Policy-currency fact-check of the 1 Sep Meta AI claims (archived research report)

> **Provenance:** produced 2 Sep 2026 by a web-research agent (WebSearch + direct fetches) during the external-AI review session; archived verbatim because the originating chat was deleted. This is the source record behind `../04-EVIDENCE-FIRST-HARDENING.md` §1/§1.1 policy verdicts. All URLs accessed 2026-09-02. Verdicts: Confirmed / Partly true / Not found / Contradicted.

**Key overall finding:** the Meta AI claims mix one real 2026 event (the March 4, 2026 BSA update), several consultancy rules-of-thumb presented as official policy, and one stale fact (the 90-day funds window, cut to 60 days in Oct 2024).

---

## C1. "March 4, 2026 BSA update added 'unauthorized AI tools, pricing bots, automation scripts' as a Section 3 termination risk"

**VERDICT: Partly true** (the update is real; the "Section 3" framing and quoted wording are not supported).

What actually happened: Amazon announced (Seller Forums post, ~Feb 17, 2026) BSA updates **effective March 4, 2026**: (a) a **new standalone Agent Policy** for automated systems/AI agents accessing Amazon services — they must "clearly identify themselves as automated systems," comply with the policy, and cease access on Amazon's request; (b) new **AI/ML restrictions** (no use of Amazon materials/services for AI model development; stronger anti-reverse-engineering terms); (c) Mexico split into its own BSA; (d) a new **Section 20** on dispute resolution; (e) new defined terms including "Agent."

- No source ties the change to **Section 3** (the termination section), and none quotes the phrase "unauthorized AI tools, pricing bots, automation scripts." Non-compliant automation is a policy violation (hence indirectly a deactivation risk), but the update is a new Agent Policy, not an amendment of Section 3.
- Secondary consultancy coverage places the Agent rules in a new **Section 19** and reports a "20% daily automated price change" threshold for repricers plus a ~90-day transition window (until ~early June 2026) — single-source details, treat with moderate confidence.

Sources:
- https://sellercentral.amazon.com/seller-forums/discussions/t/84e3f6b1-42f7-4cf3-a189-a5cc8d78d838 (official announcement thread, posted ~Feb 2026)
- https://ppc.land/amazons-new-ai-agent-rules-shake-up-sellers-before-march-4-deadline/ (Feb 17, 2026)
- https://www.digitalapplied.com/blog/amazon-ai-agent-policy-march-2026-automated-seller-rules and https://sellershorts.com/resources/ai-for-amazon-sellers/amazon-ai-agent-policy (Section 19 / 20% threshold claims)
- https://damlawfirm.com/blog/amazon-bsa-ai-agent-policy-update/ (law firm; confirms Agent Policy + Section 20, no Section 3 mention)

## C2. "Automated NLP pre-screen / '7-minute bot filter' auto-rejects generic appeals before human review"

**VERDICT: Not found** (as a named/documented mechanism or figure). No source anywhere uses "7-minute bot filter" or documents an NLP pre-screen. What exists: seller forum threads reporting rejections in ~4 minutes to ~20 minutes (e.g., thread titled "Appeal rejected in 4 minutes?!"), and consultancies asserting template/copy-paste appeals get bot-rejected — all anecdotal, never confirmed by Amazon. A seller-side attorney (Aug 5, 2026) describes the opposite framing: the *deactivation* is automated and the appeal is often the "first substantive human review."

Sources:
- https://sellercentral.amazon.com/seller-forums/discussions/t/6d44201f-0fe5-40db-9586-aea1e77b59ec (seller anecdote)
- https://sellercentral.amazon.com/seller-forums/discussions/t/af1511fc-7f75-4acf-b9b7-09da1ddf5368 (seller anecdote)
- http://www.amazonsellers.attorney/blog/amazon-enforcement-2026-what-changed-and-how-to-appeal (Aug 5, 2026)

## C3. "2025–26 policy update: reduced tolerance for template appeals; Amazon explicitly flagging AI-generated appeals"

**VERDICT: Partly true** — the *advice trend* is real; the *policy update* is not. No Amazon policy/announcement says it flags AI-generated appeals. 2026 consultancy pieces do advise that generic/AI-polished appeals fail, but self-identify as anecdote — the Ecommerce Fastlane author (June 29, 2026) concedes: "Amazon won't confirm this, but in my experience..." Treat "explicitly flagging AI appeals" as unverified consultant folklore, not policy.

Sources:
- https://ecommercefastlane.com/amazon-seller-suspensions-stricter-ai-appeals/ (June 29, 2026; no sources cited)
- http://www.amazonsellers.attorney/blog/amazon-enforcement-2026-what-changed-and-how-to-appeal (Aug 5, 2026; describes stricter automated *enforcement*, says nothing about appeal-side NLP flagging)

## C4. "Funds appeal ~90 days after deactivation, via disbursement-appeals@amazon.com"

**VERDICT: Partly true — the 90-day figure is STALE.** The email channel is real and still cited, but on **October 9, 2024** Amazon renamed the Funds Withholding Policy to the **"Funds Disbursement Eligibility Policy"** and cut the window: sellers can request withheld funds **60 days** (not 90) after deactivation, via disbursement-appeals@amazon.com; Amazon then runs a separate review for fraud/abuse and identity before releasing the remainder. A deadlines tool using 90 days would be wrong by a month.

Sources:
- https://sellercentral.amazon.com/seller-forums/discussions/t/e5457317-25d9-4562-9207-86a19b3d38e9 ("Update to the Fund Withholding Policy page" announcement thread, Oct 2024)
- https://damlawfirm.com/blog/amazon-withholding-funds-lawyer-guide/ (2025) — confirms rename, 90→60 days, and the email address
- https://www.channelmax.net/article/amazon-updates-fund-withholding-policy-to-enhance-transparency (Oct 2024)
- Forum corroboration of the address: sellercentral.amazon.com "Anyone know what the disbursement appeals email is?" thread (partial URL captured: …/discussions/t/bc2b23f9-eafe-41f5-a5ad-7cc2…)

## C5. "Standard response 48–72h; follow up after 7 days; Section 3 takes weeks"

**VERDICT: Partly true** — consultancy rules of thumb, not official Amazon SLAs. An Amazon forum moderator says to expect a response "within two days" for the standard reactivation flow; consultancies converge on 48–72h typical, escalate after ~7 days, weeks-to-months for Section 3/fraud. Usable as guidance if labeled "typical, not guaranteed"; do not cite as Amazon policy.

Sources:
- https://sellercentral.amazon.com/seller-forums/discussions/t/1548523b-96be-4bcc-a7da-fc97953bdc2a (Amazon moderator post: ~2-day response expectation)
- https://amazonappealpro.com/how-long-does-it-take-for-amazon-to-respond-to-an-appeal/ ; https://www.appeal.tools/en/articles/amazon-account-suspension-appeal-timeline ; https://myamazonguy.com/suspensions/amazon-suspension-what-amazon-sellers-need-to-know-for-2024/ (48–72h + 7-day follow-up figures)

## C6. "Flow: Account Health → 'Reactivate your account'; ASIN appeals from listing/Account Health; Section 3/IP via email in notice"

**VERDICT: Partly true (main path Confirmed).** Amazon moderator-confirmed path: **Seller Central > Performance > Account Health > "Reactivate your account"** button, then follow on-page steps (questionnaire, violation acknowledgment, quiz, or documents). ASIN-level/listing-removal appeals via the Account Health violations list is standard per practitioner guides. The third leg — Section 3 / IP responses going via the email address in the deactivation notice — was **not confirmed** by any current source; forum evidence shows Section 3 sellers often get no response at all through any channel. Verify that leg against real 2026 notices before hard-coding it.

Sources:
- https://sellercentral.amazon.com/seller-forums/discussions/t/1548523b-96be-4bcc-a7da-fc97953bdc2a (Amazon moderator "How to appeal an account deactivation")
- https://vasogroup.com/amazon-seller-account-deactivated/ (2025 guide) ; https://theappealguru.com/amazon-appeal-for-seller-account-deactivation-or-listing-removal/ (corroboration)

## C7. "Associates closed-account appeals: 5 business days via 'Closed Account Appeal' form"

**VERDICT: Confirmed** (primary source). Amazon Associates help page: "contact us within 5 business days of your closure using the Contact Us form," selecting "Closed Account Appeal." Nuance: full appeal only for non-customer-trust closures; customer-trust closures reviewed only with evidence Amazon's facts were wrong. (Associates program — adjacent, not our seller audience.)

Source: https://affiliate-program.amazon.com/help/node/topic/GACDBRFKVDTXSPTH (live as of 2026-09-02)

## C8. "Respond to Amazon information requests within 10 days or risk deactivation"

**VERDICT: Partly true — true only for INFORM Consumers Act verification/certification, not a general rule.** The 10-day deadline is statutory (INFORM Consumers Act, effective June 27, 2023): marketplaces must suspend sellers who don't comply within 10 days of notice; Amazon's annual certification prompt gives 10 days. Other information requests carry their own per-notice deadlines (some 72 hours, some "by the date requested"). Don't generalize.

Sources:
- https://www.fulltimefba.com/your-account-is-at-risk-of-deactivation-unless-you-comply-with-the-inform-consumers-act/ ; https://emplicit.co/amazon-inform-act-seller-compliance-guide/
- https://sellercentral.amazon.com/seller-forums/discussions/t/3f397093-fc95-478f-835b-8f80752600e8 (INFORM verification FAQs)

## C9. "Inauthentic complaints require supplier invoices (name/address, date, quantity, matching products); order confirmations/screenshots insufficient"

**VERDICT: Confirmed** (via multiple reputable secondary sources matching Amazon's Responsible Sourcing requirements; the Seller Central help page itself renders JS-only and couldn't be fetched directly). Requirements consistently documented: supplier's full business name, physical address, phone/contact; invoice dated within last 365 days; quantities consistent with sales volume; product matching the ASIN; must reflect a completed transaction — pro-forma invoices, quotes, and self-generated documents/screenshots do not pass, and Amazon independently verifies suppliers (including calling them).

Sources:
- https://goaura.com/blog/amazon-wants-your-invoices-how-to-respond-and-what-actually-passes ; https://www.ecommercechris.com/amazon-invoice-requirements/ ; https://www.appealsdoctor.com/blog/amazon-invoice-verification-how-to-prove-authenticity-without-issues-in-2026 (2026)
- https://sellercentral.amazon.com/seller-forums/discussions/t/884393ff-65c3-4cd3-9664-a49286335ff7 ("A Guide to Amazon's Invoice Requirements")

## C10. "AAA arbitration is the BSA dispute-resolution path for US sellers, current as of 2026"

**VERDICT: Confirmed.** BSA Section 18 requires binding arbitration administered by the **American Arbitration Association** (exceptions: qualifying small-claims cases; injunctive relief for IP). The March 4, 2026 BSA update *adds Section 20 codifying the existing arbitration + class-action waiver language* — seller arbitration continues. Critical distinction: Amazon's **consumer** Conditions of Use dropped arbitration in May 2021 (King County, WA courts) and reportedly reinstated it in **August 2026** — that is the consumer contract, not the seller BSA; the seller BSA kept AAA arbitration throughout.

Sources:
- https://www.traverselegal.com/blog/amazon-arbitration/ ; https://www.esqgo.com/blog/amazon-arbitration-unveiled-seller-strategies-guide-to-aaa-arbitration/ ; https://e-cabilly.com/blog/amazon-arbitration-guide-for-sellers/ (AAA, Section 18, exceptions)
- https://sellercentral.amazon.com/seller-forums/discussions/t/84e3f6b1-42f7-4cf3-a189-a5cc8d78d838 (Section 20 codification, effective Mar 4, 2026)
- https://ppc.land/amazon-forces-shoppers-into-arbitration-five-years-after-dropping-it/ ; https://novadata.io/resources/news/amazon-reinstates-arbitration-class-action-waiver-august-2026 (consumer-side timeline, for the distinction)

---

## Major 2025–2026 changes a suspension-help tool must know

1. **BSA update + Agent Policy, effective March 4, 2026** (announced ~Feb 17, 2026). Automated tools/AI agents touching Amazon services must self-identify as automated, comply with the Agent Policy, and cease access on demand; new AI/ML-training and reverse-engineering restrictions; new "Agent" definition; Mexico separate BSA; Section 20 codifies arbitration. Reported ~90-day compliance transition (to ~early June 2026). **Direct product impact: a Seller Central browser extension (DOM-harvest, injector) plausibly falls under "Agent" — this is the B-08 "§19 read" blocker, now in-force policy.** Sources under C1.
2. **Funds Disbursement Eligibility Policy — Oct 9, 2024.** Renamed from Funds Withholding Policy; post-deactivation disbursement request window cut **90 → 60 days**; standardized fraud/identity review before release; channel = disbursement-appeals@amazon.com. `deadlinesModel.ts` already encodes 60 days. Sources under C4.
3. **AI-driven enforcement acceleration (2025–2026).** Practitioner consensus: deactivation decisions increasingly fully automated, first human review at appeal; related-account (Section 3) detection expanded beyond device/IP/address to operational overlaps (shared suppliers, infrastructure); authenticity/sourcing violations described as the top driver of full deactivations in 2026. Anecdotal/consultancy-sourced but consistent across firms. Sources: amazonsellers.attorney (Aug 5, 2026); https://mrjeffamz.com/blog/amazon-seller-news-2026 (Aug 7, 2026); ecommercefastlane (Jun 29, 2026).
4. **INFORM Consumers Act enforcement waves (2023 → ongoing 2025–26).** Statutory 10-day suspension deadline for failed verification/annual certification; verification-loop deactivations reported. Sources under C8.
5. **Account Health support/mechanics (2025, lower confidence).** Account Health Specialists rolled out for Professional sellers; AHR visibility expanded across marketplaces; one 2026 blog claims early-2026 reweighting of violation score impacts (restricted-product warning ≈ 3 late-shipment violations) — single-source, verify before use. Sources: https://feedvisor.com/university/seller-rating/ ; https://eva.guru/blog/amazon-account-health/ ; https://anatainc.com/amazon-account-health-rating-2026/
6. **Amazon v. Perplexity (agentic-AI access), Aug 2026.** Amazon's bid to block Perplexity's Comet shopping agent failed at the preliminary-injunction stage — legal context for how aggressively Amazon polices third-party automation; pairs with the Agent Policy. Sources: https://www.engadget.com/2230471/perplexity-has-successfully-overturned-amazon-injunction-on-its-ai-shopping-bot/ ; https://www.ropesgray.com/en/insights/alerts/2026/08/tool-or-intruder-what-amazon-v-perplexity-means-for-agentic-ai-and-the-cfaa (Aug 2026)
7. **Consumer arbitration reinstated (Aug 2026)** — Conditions of Use only; never conflate with the seller BSA. Sources under C10.
8. **Peripheral listing-compliance changes (July 2026, single-source):** synthetic-performer metadata required on photorealistic AI-generated people in images/A+ (July 27, 2026, risk = listing removal); reported Featured Offer eligibility-gate removal (July 8, 2026). Source: mrjeffamz roundup (Aug 7, 2026) — corroborate before relying.

## Contamination warnings for planning docs

- Do **not** import: "7-minute bot filter" (invented term); "Section 3 termination risk" framing of the Agent Policy (wrong section); the 90-day funds window (superseded by 60); "Amazon explicitly flags AI appeals" (no policy exists); 48–72h as an official SLA (folklore-grade guidance).
- Safe to import: March 4, 2026 Agent Policy existence and obligations; 60-day Funds Disbursement Eligibility Policy + disbursement-appeals@amazon.com; Account Health → "Reactivate your account" path; Associates 5-business-day appeal; INFORM 10-day rule (scoped to INFORM only); invoice requirements for inauthentic; AAA arbitration under BSA §18 (+ new §20).
