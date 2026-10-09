# The fresh-wording routine (9 Oct 2026)

Why it exists: the decoder and the reply reader were written against fixtures, and fixtures only prove what their author thought of. On 29 Sep, a set of researched notices took the decoder from 5 right of 12 to 12 of 12. On 9 Oct, two fresh rounds of ten notices each found 2 to 4 misses per ten, and the reply reader missed four plain wordings Amazon uses. Each miss was an hour to fix. Nobody finds these by reading the code.

## The routine (every time a notice family, a policy change or a seller report appears, and at least monthly)

1. **Write ten notices or replies in families the corpus does not hold.** From real wording: seller forums, consultants' write-ups, Amazon's own help pages, the policy changes in `docs/handoffs/2026-10-08-daily-value-research.md`. Synthetic names, real phrasing; paraphrase, never copy source text.
2. **Run them through the real code, not a test double.** `runDecode(text, {})` and `proposedRequirements(...)` for notices, `analyzeReply(text)` for replies. A scratch vitest file that prints one line per notice (kind, response type, deadline, records) is enough; delete it afterwards.
3. **Judge each line as a seller would.** Wrong kind, a missing record, a missed deadline, "not clearly classified" on a notice a person can place at a glance.
4. **Fix the narrowest thing**, keeping each pattern bounded (the hostile-input tests in `inputCost.test.ts` run in the full suite) and sentence-guarded. Never write a regex through a shell string: `\b` and `\n` are corrupted. Use the Edit tool.
5. **Pin it.** Each fix gets a test that fails on the old code, and a must-stay-negative twin (the same words in a context that must not match).
6. **Record the miss you did not fix** and why, so the next pass does not rediscover it.

## Where the pins live

- Notices: `src/core/researchedNotices.test.ts` (29 Sep), `src/core/freshNotices.oct9.test.ts` (9 Oct).
- Replies: `src/core/responseAnalyzer.oct9.test.ts` and the earlier analyser suites.
- Drafts (the AI): `src/lib/llm/__tests__/aiPipeline.eval.test.ts`, live, `AI_EVAL=1`.

## Open from 9 Oct (not fixed on purpose)

Tax-information, payment-method, inactivity-closure, selling-limit and account-reserve notices still decode as "not clearly classified". They are administrative, not appeals, and there is no kind for them (adding one is a taxonomy change, P-12). The decoder reads their deadline; the second reading proposes a kind only when one really fits and returns none for them (prompt rule, pinned in `classifyNotice.test.ts`).
