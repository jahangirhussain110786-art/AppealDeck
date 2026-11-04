# Policy watch

Five Amazon pages, checked once a day, on GitHub's free scheduler. When one moves, you get an
issue (which emails you) and, if a Resend key is set, an email too. When the change looks like a
rule, a second model writes a proposal and opens a pull request. Nothing is published without one
click.

This file is the honest scope. Read §3 before trusting a quiet week.

## 1. What runs, in order

| Time (UTC)    | Step                                                                                   | Where                                |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| 06:07 daily   | Fetch each source once, compare with the stored snapshot, write a dated report, notify | `.github/workflows/policy-watch.yml` |
| minutes later | Commit the report and the new baseline to `master`                                     | same workflow                        |
| minutes later | Ask the review model what it means; write `content/policy-watch/proposals/<day>.md`    | `scripts/policy-review.mjs`          |
| minutes later | Open that proposal as a pull request                                                   | same workflow                        |

A source that cannot be read is reported as **unreadable**, and its snapshot is kept. That is the
one design decision worth defending: a watcher that quietly turns a login wall into "no change"
is worse than no watcher, because it is believed.

## 2. What is watched, and why only these five

| Source                         | Kind      | Tier      | Why                                                                                     |
| ------------------------------ | --------- | --------- | --------------------------------------------------------------------------------------- |
| Selling Partner API changelog  | RSS       | immediate | Amazon's own dated release notes: listing attribute rules, fulfilment and order changes |
| Amazon news for small business | RSS       | immediate | Seller-facing announcements, roughly a dozen a year                                     |
| Amazon policy news and views   | RSS       | digest    | Mostly corporate; the review step decides whether an item is about sellers              |
| Sell on Amazon pricing         | page text | immediate | Fee changes, including ones never announced as policy                                   |
| Selling Partner blog           | link set  | digest    | New posts; link comparison means layout churn cannot fake an update                     |

Every one of these returned readable content to an unauthenticated fetch on **4 Nov 2026**.

### What it cannot see, and why

**Seller Central's policy pages are not watched.** On 4 Nov 2026
`sellercentral.amazon.com/help/hub/reference/G1801` answered with a 200 and 171 KB of HTML that is
the **sign-in form**, not the policy. The `external/` link variant did the same. So did the forums.
A watcher hashing those would compare two login pages forever.

That leaves four things out of reach, and it is better to say so than to imply coverage:

- the Business Solutions Agreement and the help-hub policy articles (login);
- Account Health, performance notifications and Seller Central news (login);
- suspension notices themselves (they arrive by email; nothing can read them without the seller);
- anything Amazon changes silently in a policy page without publishing an announcement.

The practical consequence: this watch catches **announcements**. When it reports one, the person
reading it still opens Seller Central to see whether the article behind it changed. That is one
logged-in check, on the days that matter, instead of none.

## 3. The limits, stated rather than discovered later

- **A feed shows its latest 10 items.** If the workflow is disabled for long enough that more than
  ten new items appear, the oldest of them are never seen. The watch does not pretend to backfill.
- **A page can be restyled without meaning anything.** Text sources store lines of 20+ characters;
  a reworded marketing sentence is still a difference. The review step is what separates a fee
  change from a new hero banner, and its confidence is printed on the proposal.
- **Five requests a day, one at a time.** No crawling, no headless browser, no login, no proxy. A
  named user agent with a contact address is sent on every request.
- **The report is not advice.** It records what differed. Any sentence about what it _means_ lives
  in the proposal and is labelled as a proposal.
- **Two dates are printed even on a quiet day**: the policy brief's age and the oldest Playbook
  page's `lastVerified`. "No news" must not hide a brief that has gone stale (limit 90 days).

## 4. Why there is still one click

The gates in `scripts/policy-review/gates.mjs` are real and run on every answer:

- the answer must parse and match the required shape;
- every cited URL must appear in today's report;
- every quoted phrase must appear **word for word** in the report, at most 20 words each and 40 in
  total;
- every currency amount or percentage in the proposal must appear in the report — a remembered fee
  is the most damaging thing a model can add;
- the areas it may name are fixed (`policy_brief`, `playbook`, `fees`, `api`, `none`);
- confidence below 0.8 is marked **needs a careful read**, not ready;
- wording that **appeared** on a page with nothing removed, and no feed item or new article to
  explain it, is never "ready" — a rebuilt page produces exactly that report. The first practical
  run on 4 Nov 2026 is why this rule exists: the model read a rebuilt fee table as a fee change and
  called it 0.95, and nothing in the report could support that number.

What no gate can check is whether a faithful paraphrase is _right_. A sentence can quote the
report correctly and still draw the wrong conclusion, and in this product a wrong sentence costs a
seller an appeal. So the machine stops at a pull request. Merging it is the click, and it is the
only manual step in the whole flow.

**Why not auto-edit the Playbook?** Because the Playbook's promise is that every line was checked
on a date by a person. An automatic edit would quietly replace that promise with "a model agreed
with itself". The flow removes the _finding_ and the _drafting_ work; it does not remove the
judgement.

## 5. Adding or changing a source

1. Fetch it by hand with no login and confirm the body is the real content, not a sign-in shell:
   `curl -sS -L -A "Mozilla/5.0" <url> | head -c 400`.
2. Add it to `sources.json` with a **good `expect` string** (the guard), a `kind`
   (`feed` / `text` / `links`), and a `tier`.
3. Delete its entry from `baseline.json` (or run `--seed` for a fresh start) and run
   `node scripts/policy-watch.mjs --dry-run`. It must report `first check`, not `changed`.
4. Commit both files.

A source with a weak `expect` is a source that can rot silently. If the string also appears in a
404 page, it is not a guard.

## 6. Running it by hand

```bash
node scripts/policy-watch.mjs --dry-run            # report, write nothing
node scripts/policy-watch.mjs --seed               # store today as the starting point
node scripts/policy-watch.mjs --only=sell-pricing  # one source
node scripts/policy-watch.mjs --no-notify          # compare and write, send nothing
node scripts/policy-review.mjs --dry-run           # print the proposal, write nothing

npm run policy:watch
npm run policy:review
```

Tests: `npx vitest run scripts/policy-watch scripts/policy-review`.

## 7. The AI key is its own

`POLICY_AI_API_KEY` is separate from the app's `GEMINI_API_KEY`, on purpose:

- this job never receives a seller's notice, document or case, so it is outside the privacy
  policy's provider list and cannot weaken that promise;
- its spend and its quota cannot affect a seller preparing an appeal;
- it can be pointed at any provider by changing `POLICY_AI_PROVIDER` and `POLICY_AI_MODEL`.

Supported: `groq` (default), `gemini`, `openai`, `openrouter`, `cerebras`, `mistral`, `anthropic`,
and `custom` with `POLICY_AI_BASE_URL`. The default is Groq's `openai/gpt-oss-120b`, the model the
app's own Groq path uses, chosen by the founder on 4 Nov 2026; that model name is pinned in
`scripts/policy-review/provider.mjs`, and every other provider needs `POLICY_AI_MODEL` set, because
model names change faster than code. Free tiers are enough: one call on the days something changed,
zero on the days nothing did.

Without the key the watch still works end to end — it fetches, compares, reports and notifies. Only
the proposal is skipped, and the run says so.

## 8. Files

```
content/policy-watch/sources.json    what is watched, and the guard string for each
content/policy-watch/baseline.json   last stored snapshot per source (committed on change)
content/policy-watch/reports/        one dated report per day something moved
content/policy-watch/proposals/      the review's dated proposal, and any rejected answer
scripts/policy-watch.mjs             the daily job
scripts/policy-watch/{core,snapshot,fetch,render,notify}.mjs
scripts/policy-review.mjs            the review job
scripts/policy-review/{provider,gates,prompt,render}.mjs
.github/workflows/policy-watch.yml   the schedule
```

## 9. Cost

Zero for the run and the notification. The repository is public, so Actions minutes are not
metered; the issue and its notification email are part of GitHub; the AI call is free on the free
tier and a fraction of a cent on a paid one. There is no server to host and no subscription. The
only optional cost is a Resend key, which is already used by the purchase email.
