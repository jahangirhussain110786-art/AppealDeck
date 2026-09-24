# What is left, and whether each thing still deserves building

**24 September 2026.** The founder asked for a final judgment on everything still open from the
22 Sep gap audit ([`2026-09-22-planned-vs-built-gap-audit.md`](2026-09-22-planned-vs-built-gap-audit.md))
and the 23 Sep classification ([`2026-09-23-gap-classification.md`](2026-09-23-gap-classification.md)):
is each one still relevant, should it be built, dropped, or built in a changed form. The founder
wanted to be sure nothing important to sellers gets lost.

**Method.** Each remaining item was checked against the code at `e1a1354`, not against what the
earlier documents said. That check found **three things the earlier reports did not list**; they are
marked **NEW**.

**Nothing in `src/` was changed by this pass.** It is a verdict only.

---

## The short answer

- **Already done since the reports:** 30 of the 63 items (all of waves 1 and 2, plus D-09 and D-10).
- **Six things really matter to sellers and should be built.** Two of them are new findings.
- **Seven are worth doing in a smaller or changed form** from what was originally specified.
- **Six should be dropped**, with reasons. Most of them were planned for a product that has since
  changed shape.
- **The rest is paperwork**: fixing old documents so a future session is not misled.

---

## 1. Must do: the items that change what a seller gets

Ordered by impact on a seller.

### 1.1 Better wording for the response (founder decision; my recommendation is yes, in a safer form)

**Today:** the response is assembled from the seller's own words under the right headings. Nothing
improves the writing. A seller in a panic writes badly, and Amazon rejects vague or rambling plans.
The founder's own complaint on 12 Sep ("make sure we get a real POA, not just text") is still only
half answered.

**Found while checking:** the AI drafting code built on 12 Sep (AM-23) still exists, but
`src/app/api/compose/route.ts` skips it for every case that has a workspace. Since 22 Sep that is
every case, so that code can no longer run for any seller. The reachability check cannot see this,
because the code is imported; it just never runs.

**Recommended version, not the original one:**

- An **opt-in "Improve the wording" button** on each section. It should never run on its own.
- The seller sees the **before and after side by side** and accepts or rejects each change.
- **Facts are locked, and code checks it.** If the rewrite contains a date, number, ASIN, order ID,
  company name or evidence reference that is not in the seller's own text, it is thrown away. This is
  the part that keeps D6 intact. The single biggest reason template plans fail is invented, generic
  corrective actions, and this rule makes invention impossible rather than unlikely.
- The privacy page gets one sentence: when you press this button, that section goes to Google's
  paid Gemini service. `legalDisclosures.test.ts` already fails until the page says so.

**Why it matters:** this is what the $249 buys. It is also the first thing an appeal writer would
test. The rewrite could be too weak (just the seller's words) or too risky (AI inventing facts), and
the fact lock handles the risky side.

### 1.2 NEW: document-check results disappear on reload

**Today:** when a seller pays and checks an invoice, the result is kept only in memory (`docChecks`
in `CaseWorkspace.tsx`). On reload it is gone, and so are the disagreements it added to the facts
ledger. It is not in the export either. The seller has to check again, which means another paid
Gemini call and another hit on the rate limit.

**Do:** save the result with the record, in the encrypted vault. Clear it automatically if the
file changes. Include it in the export. An appeal writer checks documents on day one and comes back
on day two; losing the work between visits is the kind of flaw that ends a trial.

### 1.3 NEW, and B-07 in a changed form: let the seller enter the deadline they see

**Today:** when a notice states no date, the product honestly says "check Account Health". The
seller then sees the real date there, and **there is no way to tell AppealDeck**. The clock, the
dashboard and the email reminder all stay blank on the case that most needs them.

**Do:** add a "The date Amazon shows me" field, marked as entered by the seller. This is the useful
part of B-07's "provenance". The rest of B-07 is already done: since 23 Sep a deadline records
whether it came from a date the notice states, a window counted from the notice's own date, or "from
the day you received this". So drop the rest of B-07's field refactor.

### 1.4 B-04, smaller: what to do after the second rejection

**Today:** the case state `ESCALATION` exists, but **nothing ever moves a case into it** (no
transition in `caseState.ts` leads there). A seller who has been refused three times just sees
"Revision" again, with no change of approach.

**Do:** after the second recorded rejection, show a "change of approach" panel with three parts:

1. What is new since the last attempt. The novelty guard already exists, so this reuses it.
2. The other channels Amazon offers.
3. When to bring in a professional or a lawyer. This matches the Terms section "Where this service
   stops".

**Research the channel list first, and date it.** The 2 Sep plan named `jeff@amazon.com`,
`seller-performance@` and "Call me now". Several of those routes have changed or been closed over
the years. Naming a dead address to a desperate seller wastes their window. Keep BSA arbitration as
display-only with "you need a lawyer for this".

### 1.5 The old $199 price still reaches people from five live files

The earlier reports treated these as planning paperwork. They are not:

| File                                                                             | Who sees it                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/manifest.webmanifest`                                                    | **Every visitor.** It is linked from the root layout, and browsers and search engines read the description, which says "$199 one-time Appeal Pass".                                                                            |
| `scripts/setup-paddle-sandbox.mjs`                                               | Creates the sandbox price at **19900 cents**. The founder's sandbox checkout test would test $199 while the site says $249. Check which price `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS` points at before that test.               |
| `Planning/08-TEAM/EXTERNAL-OUTREACH-DRAFTS.md`, `RECRUITMENT-OUTREACH-DRAFTS.md` | **The messages that will go to appeal writers.** They say $199, and one also says "AI Plan-of-Action drafting", which is not what the product does today. Sending it would make the first claim to a professional a false one. |
| `Planning/01-PHASE-0-BLOCKERS/PADDLE-APPLICATION-DRAFT.md`                       | The text for the Paddle application. Describing the product to the merchant of record at a price we do not charge is a misdescription.                                                                                         |
| `Planning/06-OPERATIONS/canned-responses.md`                                     | A support reply to paste to a paying customer.                                                                                                                                                                                 |

Also `AGENTS.md:152` and `public/brand/README.md`, which future sessions read. Fix each line by
hand. Never use find-and-replace: competitors' $199 prices and dated history must stay.

### 1.6 B-10: show on the free decode what the case will need

**Today:** `/decode` lists only the records the notice names. The records a case like this needs
without the notice saying so appear only after the seller starts a case (corrected on building it:
the first version of this section said no list was shown at all).

**Do:** show the list on `/decode`, using the same union B-05 already builds (what the notice names,
plus what the violation needs), with the same "ours, not Amazon's" labelling. It is cheap. It is
also the first-impression moment for both a seller and an appeal writer: it shows the tool knows the
case before it asks for anything.

---

## 2. Worth doing, in a smaller or changed form

| ID                           | Originally specified                                 | Recommended instead                                                                                                                                                                                                             | Why                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B-08**                     | Read Amazon's form limits from the live form.        | A neutral **character count** under each response box, with no claimed Amazon limit unless a dated public source is found.                                                                                                      | Reading the live form breaks Amazon's Agent Policy (AM-27). A count still warns a seller before they paste 6,000 characters into a small box.        |
| **B-11** counter             | A character counter on the draft.                    | Merge with B-08 above.                                                                                                                                                                                                          | Same feature.                                                                                                                                        |
| **B-11** dated action rows   | A structured table of corrective actions with dates. | **Drop the table.** The critic already warns about "recently" and "soon" in workspace responses (`composer.ts:225`), and it runs on every case.                                                                                 | Same benefit without another form to fill in.                                                                                                        |
| **B-11** root-cause category | An extra step choosing a category.                   | **Drop.**                                                                                                                                                                                                                       | Adds a step for a panicking seller. The 40-character sufficiency check and the guidance cover the real risk ("idk").                                 |
| **B-15**                     | Code that detects a free-tier Gemini key.            | A **production switch**: document checks refuse to run in production unless `GEMINI_PAID_TIER_CONFIRMED=true` is set, which the founder sets after turning on billing (DEPLOYMENT §6b).                                         | A key does not say which tier it is on, so real detection is impossible. The switch makes forgetting impossible, which protects the privacy promise. |
| **B-19**                     | Sentry plus four uptime monitors.                    | **One uptime monitor before launch** (no user data involved). Error tracking is optional, and only with notice text scrubbed and a line in the privacy policy.                                                                  | A solo founder needs to know when the site is down. An error tracker that captures notice text would be a new place seller data goes.                |
| **Category C**               | Correct nine sets of ticks, 757 boxes in all.        | Fix only the **four misleading ticks** (AA-19/22/37, AA-40, AA-31, AA-35 text), give the multi-case spec its AM number, and put one line at the top of `Planning/README.md`: "for what is built, read `docs/CURRENT-STATE.md`". | The register now does the job the ticks were meant to do. Hand-ticking 700 boxes is hours spent on the part nobody reads.                            |
| **Analytics**                | (not in the reports)                                 | One test that each funnel event fires where it should.                                                                                                                                                                          | `CURRENT-STATE.md` says the events are untested. Once real data flows, a silently missing event cannot be recovered afterwards.                      |

---

## 3. Do later, each with the moment that triggers it

| ID                   | What                                                                                    | Trigger                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B-16, B-17, B-18** | Budget reserved for paying sellers, measured cost per document check, and a load drill. | Before the first live Gemini bill. The risk is smaller than planned, because document checks now need a Pass for that case, so cost grows with sales rather than traffic. |
| **B-09**             | Export file naming, and "download all files for this case".                             | After the first appeal writer's feedback. Amazon's form takes files one by one anyway.                                                                                    |
| **B-25**             | The four SEO guide pages.                                                               | After the founder's one-hour keyword check. Organic search is the only acquisition channel planned, so this is the most important of the "later" items.                   |
| Signed-in tests      | The 3 skipped browser tests.                                                            | As soon as `DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD` are in `.env.local`.                                                                                                  |

---

## 4. Drop, with the reason written down

| ID                 | What                                             | Why drop                                                                                                                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B-20**           | A chargeback evidence generator.                 | Paddle is the merchant of record and handles disputes itself. A half-page written procedure for when Paddle asks for evidence is enough.                                                                                                                                                                        |
| **B-23**           | A public knowledge base.                         | `/faq` and `/support` already cover it. The canned responses stay internal.                                                                                                                                                                                                                                     |
| **B-24**           | Guardian waitlist.                               | Guardian is not planned. A waitlist for something that may never ship is a promise we cannot keep. The persona telemetry was already dropped.                                                                                                                                                                   |
| **B-27**           | The browser extension.                           | **Recommend dropping it entirely (founder call, D3).** Paste-only, it is the web page in a popup. It adds a second codebase and a Chrome Web Store review, and it makes a seller ask "does this touch my Amazon account?". The web app's cleanest answer to that question is that it never touches the account. |
| **B-21**, **B-26** | Browser notifications; the withdrawal form page. | Already dropped on 23 Sep for recorded reasons, which still hold.                                                                                                                                                                                                                                               |
| **D-11**           | Tooling notes counted as product work.           | Not product work.                                                                                                                                                                                                                                                                                               |

---

## 5. Paperwork: old statements that would mislead a future session

Cheap, done in one commit, and no seller sees any of it:

- **D-01:** the remaining `$199` lines in planning instructions (payments setup, service cheat sheet,
  launch checklists). Reference documents get a one-line dated note instead of edits.
- **D-02:** Cloudflare named as the host in 10 planning files. Fix the instruction files; add a note
  to the rest.
- **D-03 to D-06:** the old price experiment, the five-slot header, the AI field suggestions, and the
  retired interview's acceptance list. Each gets a "superseded" note.
- **D-07:** record the "no date found, check Account Health" behaviour as the decision. It is better
  than the spec's "assume 90 days".
- **D-08:** `docs/MIGRATIONS.md` still says "159 tests". Remove the number.

---

## 6. Still the founder's

1. **Section 1.1**: turn on "Improve the wording" in the fact-locked form, or keep responses
   assembled from the seller's words only.
2. **EU sellers**: comply with GDPR, or decline EU purchases.
3. **The extension**: drop it (my recommendation), or keep it as paste-only.
4. **Accounts and settings**, unchanged from `docs/CURRENT-STATE.md`:
   - Gemini on the paid tier.
   - In Vercel: `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
   - Live Paddle.
   - The support mailbox.
   - The backup secrets, and one restore drill.
   - The launch checks in DEPLOYMENT §9.

---

## 7. Every open ID at a glance

| ID                                            | Verdict                                               | Section |
| --------------------------------------------- | ----------------------------------------------------- | ------- |
| B-04                                          | Build, smaller, after dated research                  | 1.4     |
| B-07                                          | Build only the seller-entered date; the rest is done  | 1.3     |
| B-08                                          | Changed: character count only                         | 2       |
| B-09                                          | Later                                                 | 3       |
| B-10                                          | Build                                                 | 1.6     |
| B-11                                          | Counter merges into B-08; the other two parts dropped | 2       |
| B-15                                          | Changed: production switch                            | 2       |
| B-16, B-17, B-18                              | Later: before the first live bill                     | 3       |
| B-19                                          | Changed: one uptime monitor; error tracking optional  | 2       |
| B-20                                          | Drop                                                  | 4       |
| B-23                                          | Drop                                                  | 4       |
| B-24                                          | Drop                                                  | 4       |
| B-25                                          | Later: after the keyword check                        | 3       |
| B-27                                          | Drop (founder call)                                   | 4       |
| C-01 to C-09                                  | Four ticks fixed plus a pointer to the register       | 2       |
| D-01                                          | Five live files now (1.5); the rest is paperwork (5)  | 1.5, 5  |
| D-02 to D-08                                  | Paperwork                                             | 5       |
| D-11                                          | Drop                                                  | 4       |
| NEW: document-check results not saved         | Build                                                 | 1.2     |
| NEW: no seller-entered deadline               | Build                                                 | 1.3     |
| NEW: AI drafting code cannot run for any case | Founder decision                                      | 1.1     |
| Analytics events untested                     | Add a test                                            | 2       |

---

## 8. Status: approved and built the same day

The founder approved everything above in chat (_"go ahead with all of them, do item 1 too"_).
All of it is built, or recorded where it needed no code:

| Item                   | What was done                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Wording help       | Opt-in **Improve the wording** under each response section (`ImproveWording.tsx`, `/api/improve-wording`). The fact lock is `src/core/wordingLock.ts`. Signed in, Appeal Pass for that case. The old whole-section AI path in `/api/compose` is deleted, so preparing a response calls no model. The privacy page, FAQ and case-screen privacy line say what is sent, pinned by `legalDisclosures.test.ts`. |
| 1.2 Saved checks       | `Workspace.documentChecks`: saved with the case, keyed to the record and its content hash, dated, and marked out of date when the case details it was compared with change. Kept out of the compose request; included in the export.                                                                                                                                                                        |
| 1.3 Seller date        | `SellerDeadlineField` on the Overview; `sellerDeadline`, `withSellerDeadlines`, `deadlinesForDisplay`. Survives a re-read of the notice and an Amazon reply, and feeds the dashboard's "Coming up" list.                                                                                                                                                                                                    |
| 1.4 Change of approach | `shouldOfferChangeOfApproach` and `ChangeOfApproach.tsx`. Three sources, dated 24 Sep 2026; the panel says Amazon publishes no escalation order.                                                                                                                                                                                                                                                            |
| 1.5 Old price          | The manifest, the sandbox script (now creates 24900 cents), the outreach drafts, the Paddle application, the canned replies, `AGENTS.md` and the brand README. `price.test.ts` fails if `$199` returns to `public/` or `scripts/`.                                                                                                                                                                          |
| 1.6 Decode records     | `/decode` now builds the same list as the case it opens, with inferred records labelled "We added this".                                                                                                                                                                                                                                                                                                    |
| 2 B-08                 | A character count under each response section.                                                                                                                                                                                                                                                                                                                                                              |
| 2 B-15                 | `GEMINI_PAID_TIER_CONFIRMED=true` is required for any Gemini call in production (`isPaidTierConfirmed`).                                                                                                                                                                                                                                                                                                    |
| 2 B-19                 | An uptime monitor is launch check 15 in `DEPLOYMENT.md` §9. No error tracker.                                                                                                                                                                                                                                                                                                                               |
| 2 Category C           | Six rows in the amendments file corrected in place; `Planning/README.md` points at the register; the multi-case spec is ticked with evidence and recorded as AM-29.                                                                                                                                                                                                                                         |
| 2 Analytics            | `analytics.test.ts` (names verbatim, every event has a firing site) and a browser test for the free-path events.                                                                                                                                                                                                                                                                                            |
| 4 Extension            | Dropped: AM-28, decision log §3 row 16, D3 amended.                                                                                                                                                                                                                                                                                                                                                         |
| 5 Paperwork            | The price lines in planning instructions now say $249, the price test is marked superseded, the Cloudflare hosting instructions are marked superseded, the header, field-suggestion and interview sections carry banners, D-07 is ratified in the build sequence, and `MIGRATIONS.md` no longer quotes a test count.                                                                                        |

**Still the founder's:** the EU decision, and the accounts and settings in section 6.4, plus the new
`GEMINI_PAID_TIER_CONFIRMED` switch.
