# Seller walk-through: where we stopped on 19 Oct 2026, and what to do next

Read this first. The founder paused the work on purpose ("we will do it tomorrow") and deleted the chat, so everything needed is here and in `REPORT.md`.

## What this work is

Invented, realistic sellers with realistic Amazon notices, replies and documents, run through the real app as a seller would (dev account, production build on port 3100, free-tier AI), then the defects fixed with tests. Rounds 1 to 5 are written up in `REPORT.md` and **committed and pushed** (last pushed commit `ce1b518`). Round 6 (below) is **uncommitted**.

How to run it again:

```bash
npm run build
(set -a; . ./.env.local; set +a; nohup node node_modules/next/dist/bin/next start --port 3100 > /tmp/next3100.log 2>&1 &)
node --env-file=.env.local scripts/grant-dev-license.mjs      # a Pass binds to the first case it prepares: run before EACH case
MSYS_NO_PATHCONV=1 node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/run-case.cjs S3    # one case, one round
MSYS_NO_PATHCONV=1 node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-A.cjs     # whole journeys: A, B, C, S1
MSYS_NO_PATHCONV=1 node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/run-notice.cjs M-multi-issue   # one notice from more-notices.json
```

Stop the server when finished (`netstat -ano | grep :3100`, then `taskkill //PID <pid> //F`). Output (screenshots and text) goes to `out/`, which is gitignored.

## Round 6: five new cases (UNCOMMITTED, built and unit-tested, not yet gated as a whole)

Notices `notice-1..5`, documents from `make-docs4.cjs` (and `make-docs3.cjs`, `make-docs2.cjs`), scripts `journey-S1.cjs` and `run-case.cjs` entries S2, S3, S4.

| Case | Seller | What it tests |
| --- | --- | --- |
| S1 | Larkspur & Fern Gifts (Savannah) | Section 3 authenticity deactivation, two wholesalers plus a retail receipt, 340 units sold against 300 invoiced |
| S2 | Kestrel Desk Co. (Denver) | Design-patent complaint, seller disputes; manufacturer invoice and statement |
| S3 | VoltRidge Power | FBA dangerous goods: SDS and UN38.3 summary |
| S4 | Cotswold Tea Merchants Ltd (UK) | Amazon.co.uk VAT and business verification |
| S5 | Brindle Hollow Pet Co. | Order Defect Rate deactivation, arrives after two refusals (notice, second refusal and order log are written; **the journey script is not written or run yet**) |

### Fixed in round 6 (all in the working tree, with tests)

1. **A first notice was read as "Amazon's reply".** "Your Plan of Action should explain..." matched the reply markers and "permanently deactivated" read as a final decision. Reply markers now need a verb about something already sent (`src/app/api/decode/route.ts`). **This was the most serious find: every Section 3 style notice was affected.**
2. **A record added by hand had no kind**, so a second supplier's invoice was stored but never checked or counted in the units total. The kind is now inferred from the name (`evidenceKindFromName`, `CaseWorkspace.tsx`). Verified: 300 of 340 units, "short by 40".
3. **A request naming several compliance documents had one card.** SDS, UN38.3 summary, Children's Product Certificate, Certificate of Analysis and cGMP certificate now each get a card (`COMPLIANCE_DOCUMENTS` in `workspace.ts`), and each is checked against questions that fit it (`COMPLIANCE_VARIANTS` in `evidenceModel.ts`, a `variant` carried through `runCheck.ts`, `/api/read-document` and `documentCheck.ts`, plus keyword support in `localReading.ts`).
4. **UK VAT notice decoded as a funds notice.** Now verification; the VAT certificate is raised as "Other requested record".
5. **A conditional warning about funds counted as a second issue** ("we may ... withhold your disbursements"). Only a firm sentence counts (`noticeIssues.ts`).
6. Earlier in round 5/6, also uncommitted if not in `ce1b518`: check `git status`.

### Not yet done

- Run S2 (the dispute stance: `run-case.cjs S2` has a `dispute` step that prints `FIRST-SCREEN CONTROLS`; it was started and stopped, nothing read). Check what a disputing seller sees and that the draft says the seller contests the finding.
- Write and run the S5 journey: prior attempts recorded with text (#91), the second refusal pasted, "change of approach", affected-orders log as the record, a new Plan of Action that names orders.
- Run S4 properly (it is a verification route; the script's explanation step fails there by design: skip it for verification cases).
- Re-run S1 through to a prepared response (it stops after business details).
- **Run all gates**: `npm run lint`, `lint:copy`, `lint:reachability`, `lint:sources`, `format:check`, `npx tsc --noEmit`, `npx vitest run`, a build, then `CI=1 npx playwright test --project=chromium --retries=0` on the affected specs (load `.env.local` first). Not run since the last edits.
- Then commit in one batch and push; check `gh run list` after the push.

### Open findings not fixed (from REPORT.md and round 6)

- The free on-device reading finds little on an invoice whose supplier is in the header with no "From" label (the AI reading handles it).
- The pack's file name carries the case id.
- The "Why Amazon asks" text for the performance record talks about order exports even when Amazon asked for carrier scan records.
- S3: the device reading cannot date a report whose label is "Test report no. / date".
- The AI's free-tier daily limit ended most drafts in the "built from your own wording" fallback, so AI-written round-2 letters have been tested little. Re-test on a day with quota, or after billing is on (F-03).

## Things to remember

- Never pass a regex through a shell heredoc or `node -e` in Bash: `\b` becomes a backspace character. Write scripts with the Write tool (use `String.raw`) and scan with `git diff --name-only | xargs grep -lP "[\x00-\x08]"` (PDFs show up in that scan; ignore them).
- `.env.local` has `GEMINI_PAID_TIER_CONFIRMED=true`, so local signed-in checks use the free tier (20 requests a day per model). Never copy it to Vercel.
- The live test host is now `https://appealdeck-project.vercel.app` (the old `appealdeck.vercel.app` stopped resolving; `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MARKETING_HOST` were changed and redeployed). Still the founder's: add that host to Supabase's redirect allow-list and to Paddle's approved domain.
- Parked items and founder decisions are unchanged (`docs/PARKED-ITEMS.md`). R-8 says tax and selling-limit notices stay unplaced on purpose: an attempt to place tax notices was undone because of it.

## Update, 20 Oct 2026 (end of day)

Round 7 is pushed (`7c9c186`, all gates green). After it, live sessions (a visible browser driven one step at a time: `live-browser.cjs` to open it, `step.cjs <file.js>` for each step) produced **21 uncommitted files**, unit-tested (core and document-check suites pass) but **not gated as a whole** (no lint, build or Playwright run on them):

- Confirmed live: tone warnings on a furious answer (page and prepared draft), personal-use licence pointer, copyright records.
- Unit-tested only: IP hint key for copyright and patent, "looks like only part of your notice" line, "letter from a named brand" pattern, wrong-document pointer (bank statement, bill, ID), banner wording on the prepared draft.
- Not fixed: supplier printed in the letterhead with no "From" label is not read; new document cards have no "what a good one shows" text; the second session (Marcus, `notice-M2-authenticity-tools.txt`, docs M2A/M2B) was not finished; AI drafting untested (Gemini quota out).

First step next time: run every gate, then commit (add paths explicitly: `docs/handoffs/nda/` is untracked on purpose and must never be committed; it was once pushed by mistake and scrubbed from history).
