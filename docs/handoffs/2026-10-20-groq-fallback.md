# Groq fallback for local testing — 20 Oct 2026

The founder requested Groq as a fallback to Gemini and unrestricted app usage for the dev account. The founder explicitly approved sending notice text, written answers and response sections to Groq during local testing. PDFs and images were excluded from that approval.

## Behavior

- Gemini remains first. Text calls try Groq immediately after a quota error, unavailable model/key, upstream failure, timeout or invalid response. Groq can also answer when Gemini is unconfigured or its app budget is exhausted.
- Model: `openai/gpt-oss-120b`, configurable with `GROQ_MODEL`. The key is stored in ignored `.env.local` as `GROQ_API_KEY`; no credential is in tracked source.
- Existing JSON parsing, quote verification and draft/wording fact checks still validate Groq answers. The adapter uses JSON-object mode with the existing schema in its instructions and reserves extra output space for reasoning. Truncated responses are refused.
- Groq receives text only. `read-document` tasks and any message carrying attachments cannot use it. Document reading retains Gemini and the existing device-reading fallback.
- Groq is disabled when `NODE_ENV=production`. This change is for local testing; enabling a new production data processor and updating the production disclosures is outside this change.
- Ordinary local users retain their route caps. Groq has a separate app budget of 900 calls/day, so exhausting Gemini's 240-call budget does not disable the alternative. Upstream quotas remain in force.

## Dev allowance

`.env.local` enables `DEV_UNLIMITED_USAGE=true`. It applies only outside production and only to the server-authenticated account matching `DEV_LOGIN_EMAIL`. There is no request-header or request-body override. Concurrent requests have isolated usage context.

For that account, the app bypasses document-reading, drafting, wording, compose, reply-analysis, outcome, reminder and decode usage counters, plus the AI door breaker and provider spend reservations. Anonymous and other accounts keep their limits. Pass ownership, case eligibility, input validation and provider quotas still apply. No account, license or database rows were changed.

## Validation

- Focused regression suite: 133 tests passed before the additional wrapper-isolation test.
- Full suite: 2,518 tests passed across 199 files; three opt-in live evaluation tests skipped by default. The Groq live test was run separately and passed.
- Live synthetic test: forced a Gemini quota failure; Groq correctly declined to classify a payment-card update, classified a related-account notice with a verified quote, prepared a draft that passed the existing fact check, and returned the configured model. No real seller data or uploaded files were used.
- Repeat the live test explicitly in PowerShell: `$env:GROQ_LIVE_TEST='1'`, then `npx vitest run src/lib/llm/__tests__/groq.live.test.ts`. It is skipped by default.
- `npm run lint:copy`: passed.
- `npm run lint`, production `npm run build`, and formatting checks on the changed TypeScript files: passed.
- `npm run typecheck`: app types passed, but existing test errors remain in `src/app/api/csp-report/__tests__/route.test.ts:22` (TS2532) and `src/core/deadlinesModel.test.ts:252-253` (TS18048). Neither test file was changed.

Existing uncommitted seller-test and product work was preserved. Nothing was deployed or pushed.
