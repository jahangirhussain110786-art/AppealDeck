# Case OS v2 — ratified direction and build plan

**22 September 2026.** Founder ratified AM-26 in chat. Repository at `eb52f6e`. This document is the working authority for the build; the amendment itself is `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` → AM-26 / AA-39–43, and the reasoning is in `docs/DECISIONS.md` (22 Sep entry).

Every code claim below was checked in source on 22 Sep 2026, not carried over from an earlier summary. File and line references are given so any of it can be re-checked in seconds.

---

## 1. What the founder decided

> _"Something is sold only when it is capable to be sold to relevant audience, and for that we need to work on our tool in most means."_

Product capability comes before price and before channel. Price stays at $249 and is parked for a later conversation.

**The fact that changed the plan.** The 21 Sep commercial review ended with "ten real unpaid seller conversations" as the next action. The founder has **no direct access to sellers or appeal writers.** That plan cannot be executed as written. The intended route to both is recruiting appeal writers into the team — and a professional joins something that already looks credible:

> _"a correct and worthy thing makes them inspire to join us, they can visualise their future only if we really re-shaping the future of sellers."_

So the commercial review's arithmetic is **deferred, not overturned.** Paid acquisition is still closed at $249; that becomes relevant again when there is a channel to spend into. It is not a reason to stop improving the product now.

**The five decisions** are written in full in AM-26. In short: the decoder decides instead of describes · every notice type gets a home · the product reads the seller's uploaded documents · the system speaks first · both journeys stay until the founder chooses.

---

## 2. The two journeys, compared — the founder's requested explanation

### They are not two rival products

- `/case` renders **`CaseWorkspace`** by default ([case/page.tsx:52](../../src/app/(app)/case/page.tsx)).
- The classic interview is reachable **only** via `?mode=classic`. No link in the app points there.
- `CaseWorkspace` **embeds** `InterviewFlow` inside itself ([CaseWorkspace.tsx:581](../../src/components/workspace/CaseWorkspace.tsx)).

The old journey is already a room inside the new house, plus a back door almost nobody finds.

### Classic interview — `InterviewFlow` (1,148 lines) + `interviewEngine.ts` (379 lines)

Asks a fixed sequence one question at a time: root cause → timeline → prior appeals → preventive measures → per-action "already done / will do" check → evidence status.

| | |
|---|---|
| **Its real strength** | Getting the story out of a panicking person's head in small, unscary pieces. One question, one screen, no blank page. This technique is genuinely good and worth keeping. |
| **Its real weakness** | **It never reads the notice.** The question list does not branch on what Amazon actually asked. A seller with a rejected invoice gets the same questions as one facing a trademark complaint. |
| **Where it ends** | Produces a document and stops. No requirement tracking, no submission history, no handling of Amazon's reply. |

### Case workspace — `CaseWorkspace` (1,404 lines) + `workspace.ts` (346 lines)

Starts from the notice **and** from what the response page is asking for, then routes to one of six protocols via `routeWorkspace()`: `operational` (write a plan of action) · `documents` (send records) · `information` (no action needed) · `clarification` (unclear, go check) · `dispute` · `specialist` (needs a human).

| | |
|---|---|
| **Its real strength** | Requirements are tracked individually and each one carries a `sourceQuote` — the exact sentence in the notice that asked for it ([workspace.ts:86](../../src/core/workspace.ts)). Submissions, replies, and export are handled. This is case management, not document generation. |
| **Its real weakness** | `routeWorkspace()` sends every intellectual-property, related-account and product-safety notice to `specialist` — **the product declines to help at all** — and identity-verification and funds notices to `clarification` ([workspace.ts:120](../../src/core/workspace.ts)). For those sellers it currently does nothing. |

### Recommendation (founder's call, not executed)

**The workspace is the stronger one and should be the spine.** The interview should stop being a second front door and become a technique the workspace calls when it needs the seller's story — which is close to what the code already does.

**But do not retire the interview before AA-39 lands.** Today, for IP, related-account, product-safety, identity and funds cases, the workspace refuses and the interview at least produces something. Removing it first would take away the only path those sellers have. Once the routing is fixed, that objection disappears.

---

## 3. What was verified in code on 22 Sep 2026

| Claim | Verdict | Evidence |
|---|---|---|
| The decoder describes, it does not decide | **True** | [`noticeParser.ts`](../../src/core/noticeParser.ts) is 66 lines of regex returning a category, a window, and four booleans. No response-type determination. `classifyStage1()` picks one of 7 kinds by priority order. |
| No entity extraction | **True** | No ASIN, case ID, order ID, date or requested-record extraction anywhere in `noticeParser.ts`. `proposedRequirements()` does a coarse label match on five document types, which is the closest thing that exists. |
| Notice types with no home | **True** | `ViolationKind` has 7 members. Nothing for verification/INFORM, performance metrics (ODR, late shipment, valid tracking), product safety, restricted products, or Seller Challenge. |
| Nothing ever speaks first | **True, and worse than described** | `reminderAt` is stored ([caseStore.ts:37](../../src/lib/caseStore.ts)) and `reminderDue` is read by the state machine ([caseState.ts:93](../../src/core/caseState.ts)). **No delivery mechanism exists in the repo.** The only scheduled job is `/api/jobs/purchase-emails`. |
| Nothing reads the seller's documents | **True** | Zero `FormData` / multipart handlers across `src/app/api` and `src/lib`. No upload endpoint exists at all. |
| The product is privacy-first and that must be broken | **Three-quarters already false** | Notice text has always gone server-side and on to Gemini: `/api/decode`, `/api/compose`, `/api/extract-field`, `/api/analyze-reply`. `legal/privacy.md` §2 already discloses it. `/decode` already renders `<LocalFirstBadge processing="server" />` ([DecodeClient.tsx:146](../../src/app/decode/DecodeClient.tsx)). |

**Why that last row matters.** The founder asked to break local-first so the product can read files. It turns out only **uploaded files** are local-only, and no code was ever written to upload them. So this is *adding the capability that was never built*, not dismantling one. Three places in the copy become untrue and must be corrected in the same commit (AA-43).

**The distinction to keep straight:**

- **"Read-only"** = AppealDeck never touches or automates the seller's Amazon account. **Unchanged.** This is what keeps the product compliant with the 4 Mar 2026 Agent Policy. Not what the founder was asking about.
- **"Local-first"** = data stays on the device. **This is what narrows**, and it had already narrowed for text without being recorded.

---

## 4. Build order

### AA-39 — K0: the kernel

The decoder decides. Nothing else can be built honestly on top of a decoder that only describes.

1. **Response type.** Determine which of Amazon's response types is being asked for — plan of action · supporting documents · acknowledgement · questionnaire/quiz · no action required — and say so plainly. Picking wrong is the top cause of failed appeals.
2. **Entities with spans.** ASINs, case and order IDs, dates, amounts, and the specific records requested — each carrying the offset of the text it came from, so every claim the product makes can be traced to the seller's own notice. Never invent; degrade to fewer findings rather than filler (the pattern `decodeAnnotations.ts` already establishes).
3. **Taxonomy v2.** Add `VERIFICATION`, `PERFORMANCE_METRIC`, `PRODUCT_SAFETY`, `RESTRICTED_PRODUCT` to `ViolationKind`, and split conduct-policy from metric-policy.
4. **No notice left homeless.** Rework `routeWorkspace()` so IP, related-account, product-safety, identity and funds notices are identified, explained, and guided. Where the product genuinely should not draft (forged documents, fraud, child safety — the real D6 gates), it says so clearly and routes to real help. `specialist` and `clarification` stop being a silent refusal.
5. **Ground truth.** Build the notice-family table from the real Amazon wording already captured in `docs/handoffs/2026-09-19-second-opinion-salvage/salvage-research_amazon-mechanics.md` — notice family → response type → channel → window. This replaces the standalone "notice corpus" deliverable the paused 19 Sep pass never wrote.

### AA-40 — K1: the clock speaks first

Reminder delivery (browser notification; email for signed-in sellers through the already-built Resend integration, which needs `RESEND_API_KEY`), the "since you were here" brief on return, and an honest waiting-on-a-third-party state with a pre-filled follow-up letter and a date. Journey consolidation is **prepared but not executed** — gated on the founder's decision in §2.

### AA-41 — K2: sensors, the product reads the documents

Each requirement resolves to **present / missing / unclear / conflicting** — never to the word "authentic", which nobody outside Amazon can assert. Plus a facts ledger with provenance, and a duplicate-submission guard before an identical resubmission (the hashes already exist).

Recommended processing split, **founder's call, does not block the start**:

| Document | Where it is read | Why |
|---|---|---|
| Invoices, authorization letters, sales reports, listing screenshots | **Server + AI** | This is where reading creates the value: "your supplier's phone number is missing from page 1, here is the letter to fix it." |
| Passports, national ID cards, driving licences, bank statements | **In-browser checks** — legible, in date, fully framed, no glare | Liability, not ethics. The founder is personally liable as an individual; a breach of a thousand invoices and a breach of a thousand identity documents are not the same event. Nobody needs AI to tell a seller their passport photo is blurry. |

If the founder prefers everything server-side, the architecture supports it — one instruction changes it.

### AA-42 — K3: pack and tracks

Evidence pack export with a manifest · Seller Challenge token counter · verification-track preparation checklists.

### AA-43 — disclosure parity (blocks AA-41)

`legal/privacy.md` §1 says "We cannot read your case vault." That becomes false the moment AA-41 lands, so the correction ships **in the same commit, never after**: privacy §1 and §2, `src/components/LocalFirstBadge.tsx`, and the "Encrypted on your device" label in `src/content/marketing.ts`. D6's honesty requirement makes this blocking, not a follow-up.

---

## 5. Two founder decisions — neither blocks the start

1. **Classic interview: keep or retire?** Recommendation in §2 — workspace as spine, interview technique retained inside it. Best decided after AA-39 fixes the routing.
2. **Identity documents: in-browser checks, or server-side like everything else?** Recommendation in AA-41. Either is buildable.

---

## 6. Carried over from the paused 19 Sep research pass

The second-opinion pass (`docs/handoffs/2026-09-19-case-os-v2-second-opinion-RESUME.md`) is **closed, not abandoned.** Checked item by item against the 21 Sep four-phase research:

- **Adversarial verification of the Meta AI numbers** — already done by Phase 1 on 21 Sep (the rejection percentages, approval odds, word counts and bot-scoring claims were all found unsupported). Not repeated.
- **Notice corpus** — absorbed into AA-39 item 5, where it is an input to the build rather than a standalone document.
- **Legal-boundaries research** — **still genuinely open and owned by nobody.** Zero coverage across all four 21 Sep documents. Covers the document-preparation-versus-legal-advice line, what the DoNotPay FTC order implies for our copy, Amazon's stance on third-party appeal services, and CCPA obligations once we hold uploaded documents. The last of those becomes materially more relevant with AA-41. Not blocking the build; it must land before any outreach that makes claims about what AppealDeck does.
- The 208 salvaged web calls remain in `docs/handoffs/2026-09-19-second-opinion-salvage/` and are a source for AA-39.

---

## 7. Scope guard

D1–D10 are not reopened by this pass except AM-26's explicit, recorded narrowing of "local-first". D6's "read-only", the no-guarantee rule, honest-expectations before purchase, severity gating, and win-rates-only-from-opt-in-data all stand exactly as written.
