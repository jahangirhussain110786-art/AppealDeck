# Keyword research, 25 Sep 2026

Unblocks B-25 (the four guide pages). Done without a login, so **no absolute search volumes**:
those need Google Keyword Planner (`Planning/05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md` §1), which
stays a useful but optional founder check. Google Trends refused requests (HTTP 429) during the
session and was not used.

## Method

1. **Google autocomplete** (`suggestqueries.google.com`, English): 14 seed phrases × 11
   suffixes → 492 unique suggestions, filtered to seller-appeal intent (buyer bans, Amazon
   employee terminations, Amazon Flex and product searches removed). Autocomplete shows only
   what people actually type often, so the _depth_ of a cluster is a demand signal. It is not a volume.
2. **Search results** for the four strongest clusters, to see who ranks and how hard each is.

## What people type (seller intent only)

| Cluster                            | Depth                         | Typical phrasing                                                                                                                                                                                            |
| ---------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Section 3**                      | Deepest by far (~35 variants) | "amazon section 3 appeal template", "your amazon seller account has been deactivated in accordance with section 3", "what is amazon section 3 violation", "how to beat amazon section 3", UK/US/EU variants |
| **Plan of action / appeal letter** | Deep (~30)                    | "amazon plan of action template (pdf)", "how to write a plan of action for amazon", "amazon appeal letter sample", "successful amazon appeal letter", "amazon poa format"                                   |
| **Deactivated: what now**          | Deep (~20)                    | "why is my amazon seller account deactivated", "how to reactivate deactivated amazon seller account", "what happens if amazon seller account is deactivated"                                                |
| **IP complaint**                   | Medium (~12)                  | "amazon ip complaint", "amazon plan of action for intellectual property complaints", "what is an amazon ip complaint"                                                                                       |
| **Identity verification**          | Medium (~8)                   | "amazon seller identity verification not working", "how long does amazon seller identity verification take"                                                                                                 |
| Related accounts                   | Thin                          | "amazon related account suspension/policy"                                                                                                                                                                  |
| Funds held / disbursement          | **None surfaced**             | not in autocomplete for these seeds                                                                                                                                                                         |

**Nobody types "decoder" or "plan of action generator."** The tool-name queries in the SEO plan's
§2 table do not appear. Sellers search for _their problem_, so the decoder has to live inside
problem pages, not rank as a named tool.

## Who ranks

- Every cluster is dominated by **law firms and agencies** (amazonsellerslawyer, DAM Law, Traverse
  Legal, Riverbend) plus generic templates (Scribd, Pinterest, Quora). They sell hand-written services.
  None offers a working tool on the page, which matches the SEO plan's premise.
- **Identity verification is the weakest result set:** mostly Seller Central forum threads with
  titles like "system is broken" and "keeps failing". That means real panic and little good content,
  and AppealDeck already has a verification checklist (AA-42).
- One AI competitor, ave7lift.ai, already ranks for Section 3.
- Pages that rank for templates say _"templates fail because they do not match the notice facts."_
  That is AppealDeck's exact argument, made by the people it competes with.

## Build order for B-25

1. **`/guides/section-3`**, the biggest cluster, and the decoder answers "which kind do I have".
2. **`/guides/plan-of-action`** answers "template" searches honestly: the structure, why a copied template
   fails, then the decoder.
3. **`/guides/identity-verification`**: the weakest competition, and the checklist is already built.
4. **`/guides/ip-complaint`**: evidence and outreach only, matching the product's IP scope (no dispute
   drafting). The page must not promise more.

Parked: related accounts (thin), funds holds (no demand signal; re-check with Keyword Planner).
All pages follow the SEO plan §4 rules: cited policy names, honest expectations, no "guarantee",
a "last verified" date, and the "not legal advice" line.

## Sources

- https://shopkeeper.com/blog/amazon-section-3-violation
- https://damlawfirm.com/blog/amazon-section-3-reinstatement-2026/
- https://ave7lift.ai/blog/amazon-section-3
- https://www.navines.com/amazon-plan-of-action/
- https://www.traverselegal.com/blog/amazon-plan-of-action/
- https://damlawfirm.com/blog/amazon-ip-complaints-plan-of-action/
- https://sellercentral.amazon.com/seller-forums/discussions/t/e6422ffe-0951-4494-86fb-0ed0ddd055d6
- https://www.amazonsellers.attorney/amazon-seller-verification-suspensions.html
