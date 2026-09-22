# Legal boundaries — research pass

**22 September 2026.** Closes the last open item from the paused 19 Sep second-opinion pass
(`2026-09-19-case-os-v2-second-opinion-RESUME.md` step 2), which has been owned by nobody since.
It gates outreach, because outreach means making claims about what AppealDeck does.

> **This is research, not legal advice, and I am not a lawyer.** Every finding below is sourced and
> dated so it can be checked. Where the answer depends on facts only a professional should judge,
> the document says so instead of guessing. Section 8 lists what genuinely needs a lawyer, and it
> is short — most of what follows is about not making claims we cannot support, which is a copy
> problem rather than a legal one.

---

## 1. Plain words: do, avoid, decide

**Do**

- Keep saying, everywhere, that the seller submits their own appeal and that AppealDeck never signs
  in to Seller Central. That sentence is now worth more than it was in March: Amazon's Agent Policy
  makes it the difference between a compliant tool and a prohibited one (§4).
- Put **"this is not legal advice"** into the Terms page the site actually renders. It is currently
  in `legal/terms.md`, which nothing renders (§6).
- Say plainly that AppealDeck helps with the Seller Central appeal and stops there — not
  arbitration, not a demand letter, not a court filing (§2).

**Avoid**

- Any claim that the product matches, replaces or approaches a lawyer, a consultant or an appeal
  writer. This is the exact claim the FTC fined DoNotPay for, and the order's standard is evidence,
  not sincerity (§3).
- Any efficacy claim at all — approval rates, typical outcomes, "most sellers" — unless there is
  opt-in outcome data with a denominator behind it. The `outcome_events` table exists for this and
  now holds nothing.
- Building the extension's DOM-harvest mode as planned in D3. Browser automation and Seller Central
  scraping are prohibited as of 4 March 2026 (§4).

**Decide (founder)**

1. Whether to add the "not legal advice" line to the rendered Terms — I have drafted it but have
   not touched legal copy, because that is your call (§7, item 1).
2. Whether to sell to EU sellers. "Flat, worldwide" pricing means GDPR applies to AppealDeck with
   no size exemption; declining EU sellers is a legitimate alternative to complying (§5).
3. Whether the extension's DOM-harvest mode is retired now or left as a decision for later (§4).

---

## 2. Unauthorized practice of law: where the line actually is

**The short answer: writing an Amazon appeal is not practising law, because an Amazon appeal is not
a legal proceeding.** It is a private commercial dispute governed by a contract — the Business
Solutions Agreement — between a seller and a company. UPL rules bite on representation in
litigation and before administrative agencies, and on giving legal advice about someone's rights.
Helping a business write a business document to a counterparty is none of those.

That is also how the market behaves: appeal services that are not law firms operate openly, and the
ones that are careful state their non-legal status plainly. Firms in this space describe the line
the same way — non-attorneys **cannot file arbitration demands on a seller's behalf, cannot appear
at a hearing as counsel, and cannot assert attorney-client privilege** over what the seller tells
them.

**Where it would become a problem for AppealDeck.** The BSA's own escalation path ends in AAA
arbitration, and the ladder before it (demand letter to Amazon Legal, pre-arbitration notice) is
legal work. A product that started drafting those would be on the wrong side of the line, and the
third item above matters to sellers who do not know it: what they tell AppealDeck is **not
privileged**, and would be discoverable in a way a lawyer's file would not.

Two things follow, and both are cheap:

- The product should say where it stops. It already refuses the hardest categories (D6 routes
  forged documents, fraud and child safety to professional help), but it says nothing about
  arbitration or legal escalation, which is where a frustrated seller goes next.
- No privilege claim, and ideally an explicit note that conversations here are not privileged.

The caveat worth keeping: UPL definitions are **state-by-state and the tests courts use are
famously vague**. The reasoning above is sound for the category, not a clearance for any particular
sentence of copy.

*Confidence: high on the category (an Amazon appeal is not a legal proceeding); medium on the
edges, which vary by state.*

## 3. The DoNotPay order: what it forbids, and what it means for our copy

The FTC finalised its order on **16 January 2025**, announced **11 February 2025**: **$193,000** in
monetary relief, notice to 2021–2023 subscribers, and a prohibition on advertising that the service
performs like a real lawyer **unless it holds evidence to substantiate that**. The complaint's
substance is the part to internalise: DoNotPay had not tested whether its output reached a lawyer's
standard, and had not retained attorneys to check the quality of its law-related features.

**The standard is substantiation, not honesty.** Believing a claim is not a defence; you need
evidence before making it. That has three consequences here:

1. **Never claim equivalence** to a lawyer, a consultant or an experienced appeal writer. Not "as
   good as", not "like having a specialist", not "professional-grade".
2. **Never claim efficacy** without data. Approval rates, "most sellers get back on", typical
   timelines — all of these need a denominator from opt-in outcomes, which does not exist yet.
3. **Recruiting appeal writers does not change this.** If a professional reviews the output, the
   claim becomes "reviewed by X", which is a fact about process and is substantiable — not a claim
   about results, which still would not be.

Checked against the current product: **no lawyer-equivalence claim exists anywhere in `src/content`.**
The existing `lint-copy` gate already bans `guarantee`, `trusted by`, win/success rates and bare
percentages. The copy discipline here is genuinely ahead of the risk.

*Confidence: high. Primary source is the FTC's own release.*

## 4. Amazon's Agent Policy: AppealDeck is compliant by construction

The updated BSA and the new **Agent Policy took effect 4 March 2026** (announced 17 February 2026 on
the Seller Central forums). Continuing to sell after that date accepted it. Reporting on it is
consistent on the substance:

- An automated tool must **identify itself as automated** in all interactions with Amazon Services.
- **Browser automation, Seller Central scraping and unauthorised access methods are prohibited.**
- Tools acting on an account are expected to register through SP-API, keep audit trails, and stop
  on request.

**AppealDeck never interacts with Amazon Services at all.** The seller pastes text in; the seller
submits the response themselves. It does not log in, does not scrape, holds no credentials and
makes no call to Amazon. On the plain reading it is not an "Agent" under this policy, because it
never acts on the account. The Terms already say so in the site's own words: *"We do not log in to
Seller Central. We do not submit on your behalf."*

Two things follow.

**This is an outreach asset, not just a compliance box.** Since 4 March, an appeal writer choosing
tools has a real question to answer about every one of them. AppealDeck's answer is the strongest
available — it cannot put a client's account at risk through automated access, because it has no
access. That is worth saying plainly to the professionals AM-26 exists to recruit.

**It costs the extension plan.** D3 sequences an MV3 extension as "paste-mode primary; DOM-harvest
gated on a BSA §19 read; injector last-or-never". Paste-mode is unaffected. **DOM-harvest is reading
Seller Central's page content programmatically, which is what "Seller Central scraping" describes,
and an injector is browser automation.** The "gated on a read" condition has now been answered by
the policy itself, and the answer looks like no. This does not block anything today — the extension
has not been started — but the plan should stop carrying a mode that policy appears to prohibit.

*Confidence: high on the effective date and on the prohibition existing; **medium on the exact
scope**, because I could not retrieve Amazon's own policy text — the reporting is consistent but it
is reporting. Before the extension is built, someone should read the policy itself in Seller
Central. A previous session recorded the same limitation (B-08).*

## 5. Privacy: which regimes actually apply

**CCPA / CPRA — does not apply at current scale.** A business is covered only if it does business
in California and meets one of three thresholds: annual gross revenue over **$26,625,000**
(2025–2026 inflation-adjusted figure), processing personal information of **100,000+** California
consumers or households a year, or deriving **50%+** of revenue from selling or sharing personal
information. AppealDeck meets none and will not soon.

Worth knowing for when it might: **government-issued identification numbers — passport, driver's
licence, state ID — are "sensitive personal information" under CPRA**, which carries extra duties.
The product now reads identity documents (AA-41), so this is the threshold to watch rather than one
to ignore.

**GDPR — applies now, if EU sellers are served.** Article 3(2) covers a controller outside the EU
processing the data of people in the EU where the processing relates to offering goods or services
to them. **There is no revenue or size threshold**, and it applies irrespective of whether payment
is required. Pricing is "flat, worldwide, no country tiering", a marketplace seller base is global,
and the free decoder is open to anyone — that is offering services to people in the EU.

This is the one genuinely open exposure. It needs a lawful basis, a processor agreement with Google,
a transfer mechanism, and the data-subject rights the privacy policy already promises. The policy
does already disclose international transfers and a 30-day rights response, which is the right
instinct; what is missing is whether the underlying arrangements exist.

**The alternative is to decline EU sellers** — a marketplace check at intake — which is a
legitimate choice rather than a failure, and cheaper than compliance at this stage. The workspace
already has a `marketplace` field and routes non-US to `clarification`, so the mechanism exists.

*Confidence: high on both thresholds and on Article 3(2) having no size exemption.*

## 6. What the current product gets wrong

Three concrete findings, each verified in the code rather than assumed.

**1. "Not legal advice" does not appear on the rendered Terms page.** It is in `legal/terms.md`
(*"It is not legal advice and not a guarantee of reinstatement"*) and in
`legal/withdrawal-consent.md`. But `/terms` renders from `src/content/legal.ts`, and that file
contains the string "advice" **zero times**. The disclaimer the founder wrote exists in a file
nothing renders. Given §3, this is the single highest-value copy fix available.

**2. The privacy policy describes features that were deleted today.** `src/content/legal.ts` says
*"Optional AI suggestions and the older interview drafting flow can send relevant notice text and
answers to Google Gemini."* Both were removed this morning — `FieldSuggester` and
`/api/extract-field` with them. A privacy policy that overstates what is sent is not dangerous in
the way understating would be, but it is inaccurate, and accuracy is the whole basis on which this
product asks to be trusted.

**3. The Gemini disclosure can now be specific instead of vague.** The policy currently says AI
handling "depends on the provider's applicable terms and service configuration". Verified: on paid
services Google **does not use prompts or responses to improve its products**, and logs prompts and
responses for **55 days** solely for detecting Prohibited Use Policy violations. Both facts can be
stated plainly — the first is reassuring and true, and the second is a real retention window a
seller uploading an invoice deserves to know about.

## 7. Recommended changes, ranked

| # | Change | Why | Who decides |
|---|---|---|---|
| 1 | Add "not legal advice" to the rendered Terms | §3 + §6.1. Written already; it renders nowhere | Founder — I have not touched legal copy |
| 2 | State where the product stops: Seller Central appeals, not arbitration or legal escalation; and that nothing here is privileged | §2 | Founder |
| 3 | Correct the privacy policy's description of what is sent to Gemini, and name the 55-day abuse-log window | §6.2, §6.3 | Founder (legal copy) |
| 4 | Decide EU: comply or decline | §5 | Founder |
| 5 | Strike DOM-harvest and injector modes from the extension plan | §4 | Founder; nothing blocked today |
| 6 | Use the no-access position in appeal-writer outreach | §4 | Founder |

Nothing here is urgent in the sense of ongoing exposure — the product is not deployed and has no
users. All of it is cheap now and awkward later.

## 8. What still needs an actual lawyer

Short list, and none of it blocks building:

- The Terms and Privacy pages read once by someone qualified, before real sellers arrive. Everything
  above is about not overclaiming; a professional read is about what happens when something goes
  wrong.
- Whether a Pakistan-based sole proprietor selling to US and EU consumers needs anything structural
  — the liability cap, the governing-law clause, and whether a Pakistani individual can rely on
  them.
- The GDPR position, if EU sellers are served.

## 9. Sources

| Source | Date | Used for | Confidence |
|---|---|---|---|
| [FTC, "FTC Finalizes Order with DoNotPay"](https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-finalizes-order-donotpay-prohibits-deceptive-ai-lawyer-claims-imposes-monetary-relief-requires) | 11 Feb 2025 (order 16 Jan 2025) | §3 in full | High — primary |
| [FTC case page, DoNotPay](https://www.ftc.gov/legal-library/browse/cases-proceedings/donotpay) | — | §3 | High — primary |
| [State Bar of California, Unauthorized Practice of Law](https://www.calbar.ca.gov/public/concerns-about-attorney/avoid-legal-services-fraud/unauthorized-practice-law) | retrieved 22 Sep 2026 | §2 definition | High |
| [Washington AG opinion, non-attorney appearance in administrative proceedings](https://www.atg.wa.gov/ago-opinions/appearance-non-attorney-nonattorneyin-administrative-proceedings-constituting) | retrieved 22 Sep 2026 | §2 — the administrative-proceeding boundary an Amazon appeal falls outside | High |
| [Fordham L. Rev., "Nonlawyers and the Unauthorized Practice of Law"](https://ir.lawnet.fordham.edu/cgi/viewcontent.cgi?article=3572&context=flr) | retrieved 22 Sep 2026 | §2 — courts' tests are vague and vary by state | Medium |
| [AMZ Sellers Attorney, Section 3 appeals](https://www.amazonsellers.attorney/blog/appealing-deactivation-of-amazon-seller-accounts-under-section-3-of-amazons-business-solutions-agreement) | retrieved 22 Sep 2026 | §2 — what non-attorneys cannot do (arbitration, counsel, privilege) | Medium — interested party |
| [PPC Land, Amazon AI agent rules](https://ppc.land/amazons-new-ai-agent-rules-shake-up-sellers-before-march-4-deadline/) | Feb 2026 | §4 — effective date, self-identification | Medium — reporting |
| [SellerSprite, BSA Agent Policy 2026](https://www.sellersprite.com/en/blog/amazon-bsa-agent-policy-2026) | 2026 | §4 — scraping and browser-automation prohibition | Medium — reporting |
| [Clym, CCPA applicability](https://www.clym.io/blog/ccpa-applicability-guide) | 2026 | §5 — $26,625,000 / 100k / 50% thresholds | Medium-high |
| [Clym, sensitive personal information under CPRA](https://www.clym.io/blog/what-is-sensitive-personal-information-under-the-cpra) | 2026 | §5 — government IDs are SPI | Medium-high |
| [EDPB Guidelines 3/2018 on territorial scope](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf) | 2019 | §5 — Article 3(2) | High — primary |
| [GDPR.eu, companies outside Europe](https://gdpr.eu/companies-outside-of-europe/) | retrieved 22 Sep 2026 | §5 — no size threshold | Medium-high |
| [Google, Zero data retention in the Gemini Developer API](https://ai.google.dev/gemini-api/docs/zdr) | retrieved 22 Sep 2026 | §6.3 | High — primary |
| [Google, Gemini API abuse monitoring](https://ai.google.dev/gemini-api/docs/usage-policies) | retrieved 22 Sep 2026 | §6.3 — 55-day window | High — primary |

**Not retrieved, and it matters:** Amazon's own Agent Policy text and the current BSA disputes
clause. Both sit behind Seller Central. The 19 Sep salvage recorded the same failure (the help-page
fetch returned only the shell), and it remains the one place where this document relies on
reporting rather than the source. The founder's own seller account, once open, is the way to close
it — see B-08.
