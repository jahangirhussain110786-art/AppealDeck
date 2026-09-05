# Wave B — Completion Handoff (5 Sep 2026)

## What shipped

### Committed waves

- **Wave A** `67979dc`: tokens v2, shadcn primitives, AppHeader, patterns, fonts, motion system
- **Wave B Task 0** `c8d06de`: DeadlineChip, LocalFirstBadge, VerifiedStamp, dev UI gallery, SITE_URL wiring
- **Wave B Task 1** `8b22a4c`: content modules (marketing, legal, shared, sampleNotice), guidance.ts, lint-copy gate + CI
- **Wave B Task 2** `6728aaa`: decode page rewrite, notice-likeness prefilter, sample notice, severity-gated CTA
- **Wave B Task 3** `e74c5b4`: home page rewrite (server component, hero-as-product, how-it-works, expectations, founder note, footer FAQ link)

### This commit — Wave B marketing surface completion

- `/pricing` rewrite: Free-vs-Pass table + trust card + 7-item FAQ accordion + D8 EU withdrawal consent checkbox + CheckoutButton + sample-POA Dialog + HonestExpectationsCard
- Legal pages via `LegalPage.tsx` component with structured `LEGAL` content + sticky TOC + "last updated" stamp
- `/faq` new static route (7 Q&As grouped by Pricing/Decoding/Deadlines/Vault/Submitting)
- `src/app/opengraph-image.tsx` (dynamic, brand + honest tagline via `@vercel/og`, edge runtime)
- `public/apple-touch-icon.svg` + `public/manifest.webmanifest`
- `src/content/marketing.ts` (FAQ content, SAMPLE_POA)
- `src/content/legal.ts` (LegalDoc/LegalSection types, meta descriptions, consent prompts)
- `src/content/shared.ts` (tocHeading, lastUpdated, consentPrompt, footer, metadata)

## Gates (all green)

| Gate                         | Result                        |
| ---------------------------- | ----------------------------- |
| `tsc --noEmit`               | PASS                          |
| `next lint --dir src`        | PASS (0 warnings)             |
| `node scripts/lint-copy.mjs` | PASS                          |
| `prettier --check`           | PASS                          |
| `next build`                 | PASS (26 routes + middleware) |
| `vitest run`                 | 244/244 PASS (22 files)       |

## Deviations from spec

1. **Static icon files instead of dynamic**: `apple-touch-icon.svg` + `manifest.webmanifest` as static files in `public/` instead of `icon.tsx`/`manifest.ts`. This avoids Next.js build errors with the `apple-icon.tsx` convention.
2. **OG image uses edge runtime**: `opengraph-image.tsx` uses `runtime = "edge"` from `next/og` — standard Next 14 pattern.
3. **`/faq` renders all Q&As expanded**: No accordion on the `/faq` route page itself — all questions and answers are visible for SEO. The `/pricing` page FAQ section uses an accordion (`FaqAccordion`).
4. **Patterns flat in `src/components/`**: Per spec §4 patterns, not in a `patterns/` directory. They live alongside other UI components.

## Known issues (deferred to Wave C)

- Dashboard routing: `src/app/(app)/page.tsx` is unreachable (`/` shadowed by `src/app/page.tsx`). Wave C moves to `/dashboard`.
- Server-side license gap: `/api/interview` and `/api/extract-field` use `requireUser()` only (returns redirect, not 401 JSON). Wave C adds `getApiUser()` + license checks.
- Open redirect: `auth/callback/route.ts` uses unvalidated `next` param. Wave C adds same-origin validation.
- `decode/route.ts` hardcodes `kind === "INAUTHENTIC_DOCUMENTS"` instead of `isSeverityGated()`. Wave C fixes.
- Dead code: `PageShell.tsx`, `SiteHeader.tsx`, `content/errors.ts`, `SHARED` in `content/marketing.ts`. Wave C removes.
- `caseFile` persistence to `sessionStorage` instead of the encrypted vault. Wave C migrates to vault-backed store per spec §7.3.
