# Content modules

All user-facing strings live in typed modules under `src/content/`. No hardcoded UI strings in components.

## Modules

- `marketing.ts` — home, decode, pricing, founder note
- `legal.ts` — privacy / terms / refund prose + D8 consent wording shared with pricing
- `auth.ts` — login / signup / forgot / reset
- `app.ts` — dashboard / authenticated surfaces
- `shared.ts` — footer, metadata titles/descriptions
- `errors.ts` — loading text (exists)

## Voice rules (spec §10.1–10.3)

- **Headline** = the outcome the seller controls, never Amazon's.
- **Sub-line** = the boundary (you submit yourself; we never touch your account).
- **Button** = verb + object.
- Dates: absolute + relative. Amazon terms defined on first use per page.
- Sentence case.

## How to add a string

1. Add it to the relevant group in the matching `src/content/*.ts` module as a typed `as const` entry.
2. Reference it from the component: `import { HOME } from "@/content/marketing"`.
3. Run `npm run lint:copy` to confirm it passes the banned-pattern / banned-number gate.

## How the lint works

`scripts/lint-copy.mjs` scans every `.ts`/`.tsx` string for the banned regex (§10.2/§10.3) and the banned-numbers regex. It skips test files and is wired into CI after `lint`. Allow-listed phrases live in `src/content/claims-allowlist.txt`.
