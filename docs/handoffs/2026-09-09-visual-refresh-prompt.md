# AppealDeck — Visual refresh v3 (AA-32) — coding-agent prompt

Written 9 Sep 2026 (evening) by the reviewing AI. Audit: `docs/handoffs/2026-09-09-visual-audit.md`. Design authority with every exact value: `docs/handoffs/2026-09-09-visual-refresh-spec.md` (cited below as **S§n**). Plain-language guide for the founder: `docs/handoffs/2026-09-09-visual-refresh-plain-guide.md`. Evidence log for THIS pass: `docs/handoffs/2026-09-09-visual-refresh.md`.

## STATUS — RUNNABLE as soon as the access + continuity pass (AM-21) is complete (A locked; B and D ticked 9 Sep 2026 on the founder's "proceed"; C optional)

**Start condition (updated 10 Sep 2026).** `git log --oneline -1` shows `docs(access/task-8): …` (the AM-21 access + continuity pass, `docs/handoffs/2026-09-10-access-continuity-prompt.md`, is finished; the polish FIX pass finished earlier at `7bd3e4e`). If it does not, stop and tell the founder — this pass restyles files the access pass changes (`AppHeader`, `AppShell`, `VaultGate`, `InterviewFlow`, `DashboardClient`, `DecodeClient`, `pricing/page.tsx`, `compose/page.tsx`) and must not run concurrently. **Read `Planning/03-PHASE-2-BUILD/07-ACCESS-AND-CONTINUITY-SPEC.md` §3 and §8 once before V4:** the header, the signed-out states, the compose gate and the three-column pricing table are behaviour decided there; this pass restyles them and changes no behaviour.

- [x] **A — Brand mark LOCKED: option E2, "the deck, checked"** — chosen by Jhangir Hussain on 9 Sep 2026 from eleven candidates (`docs/handoffs/assets/2026-09-09-mark-options-v2.png`). The kit in `public/brand/` is generated from it (preview `docs/handoffs/assets/2026-09-09-brand-sheet.png`, link image `public/brand/og-1200x630.png`). Task V2 copies those files to their production paths (S§1.6). Do not iterate on the mark.
- [x] **D — Copy deck approved** (`docs/handoffs/2026-09-09-copy-deck.md`) — ticked 9 Sep 2026 on the founder's instruction to implement the value-first copy; the two ★ items (reinstatement FAQ answer, expectations wording) may be struck individually before the pass starts: value-first rewrites of every marketing string, the FAQ (11 items), auth subtitles, the app's no-pass cards, and the expectations-card wording (deck §4.8, marked ★). Applied by Task V10; the home page is then built with the deck's "What you get" and proof sections instead of the do/do-not strip. *If left unticked:* Task V10 is skipped, existing strings stay, and only the structural strings from S§14 are added.
- [x] **B — Sample notice text approved as written** (S§14, last block) — ticked by the reviewing AI on 9 Sep 2026 under the founder's instruction to proceed; the founder may strike it before the pass starts. This is the fix for the P0 blocker "Try a sample notice → Could not decode". *If struck:* stop at Task V7 step 5 and ask; do not ship a decoder whose own sample fails.
- [ ] **C — Align the decode API's notice markers with the client list** (`src/app/api/decode/route.ts:7–13` imports `AMAZON_MARKERS` from a shared `src/lib/noticeLikeness.ts` export instead of its own 6-entry list). One backend file, bug fix only. *Default if unticked:* do not touch the API; box B alone makes the sample pass both lists.

Boxes are ticked by Jhangir Hussain in the chat with the reviewing AI or by editing this file. Nothing else in this prompt needs a decision. **Single-AI flow:** the same coding AI finishes the access + continuity pass (its Task A8 repoints `docs/handoffs/SESSION-START-PROMPT.md` at this prompt), the founder pastes the session-start block into a fresh session, and Tasks V0–V11 run one by one, one commit each. The visual deliverables (audit, spec, this prompt, guide, copy deck, `public/brand/`, `docs/handoffs/assets/`) were committed by the reviewing AI on 10 Sep 2026; V0 verifies, it no longer commits them.

---

## 0. OPERATING PROTOCOL

§0 and §0.A of `docs/handoffs/2026-09-09-uiux-polish-prompt.md` (one task = one commit, gate block after every task, evidence not adjectives, append never overwrite, no secrets, D6 is the aesthetic, extract don't duplicate, cross-platform, FORBIDDEN SOURCES, compact at 50 %, read in ranges, ≤ 3 chat lines between tool calls) and §0.B of `docs/handoffs/2026-09-09-uiux-polish-fix-prompt.md` (hashes only from `git log`, exit codes decide gates, shrunk tasks are written up as NOT DONE, prescribed commit messages verbatim, final message generated from commands) apply unchanged. Commit prefix: `feat(visual-v3/task-N)` for code, `docs(visual-v3/task-N)` for docs.

### 0.C Rules specific to this pass
1. **The spec is the source of truth.** Copy class strings, tokens and SVG geometry from S§1–§7 verbatim. Do not "improve" a value; if a value cannot work, record why in the evidence log and use the nearest value that does.
2. **Grep before you edit — every line number in this prompt was taken at `7051682`; the fix pass and the access pass both move lines.** Appendix A lists anchors as `file:line` + a grep pattern; trust the pattern.
3. **Colour gate.** `npm run lint:copy` includes a colour gate: no hex and no Tailwind palette colours (`emerald-500`, `slate-…`) in `src/components/**` outside `ui/`. Brand hex lives only in the static assets (`public/brand/*`, `src/app/icon.svg`, `public/manifest.webmanifest`); the React mark uses the `brand` token.
4. **No new dependencies.** `tailwindcss-animate`, `@radix-ui/react-select`, `geist`, `sharp` are all out (S§13). Keyframes live in `tailwind.config.ts`.
5. **Strings** — every new user-facing string is listed in S§14; add them to `src/content/*` first, then use them. Do not invent copy. Remove the "1. / 2. / 3." prefixes from `HOME.howItWorks.stepN.title` exactly as S§14 says.
6. **Tests that pin the UI:** `e2e/marketing.spec.ts` asserts the Free/Appeal Pass `columnheader` names, a level-1 heading on `/` and `/pricing`, the textbox named "Your notice", the independence text in the footer; `e2e/a11y.spec.ts` asserts h1 "Sign in"/"Create your account"/"Forgot your password?", `getByLabel(/email/i)`, the skip link `a[href="#main"]`. Keep those roles, names and ids.
7. **Visual proof.** After V4, V5, V6, V7, V10 and V11 run `npx playwright test e2e/screenshots.spec.ts` with `OUT` changed to `docs/handoffs/screenshots/2026-09-<DD>-visual` (one edit in the spec file, committed with V4) and look at the PNGs before you write "done". A task whose screenshot contradicts S§11 is not done.

---

## 1. CONTEXT — verified at `7051682` (9 Sep 2026 evening, localhost audit)

Design-system layer today: HSL tokens in `src/app/globals.css` (light/dark), Tailwind colours mapped with `<alpha-value>`, `next/font` Inter (fixed weights, no `opsz`) + JetBrains Mono, `MotionConfig reducedMotion="user"`, shadcn-style primitives in `src/components/ui/` (Accordion, Alert, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, Input, Kbd, Label, Progress, Separator, Sheet, Skeleton, Table, Tabs, Textarea, Toaster, Tooltip), one `AppHeader` for marketing/app, `SiteFooter`, `AppShell`, `LegalPage`, dev gallery `/dev/ui`.

What the screenshots and code showed (full list in the audit §2–§3):
- **P0 · sample decode fails.** `src/content/sampleNotice.ts` re-exports the 167-char fixture `policy-1`; `src/app/api/decode/route.ts:7–20` needs ≥ 2 of `amazon | seller central | asin | notice | policy | account health`; the fixture has one. Client `src/lib/noticeLikeness.ts` has a different 22-marker list and shows no warning.
- **P0 · `/decode` has no header/footer** (`src/app/decode/page.tsx` renders `DecodeClient` bare).
- `/dev/ui` crashes (server component passes `icon={Inbox}` to client `EmptyState`).
- `public/apple-touch-icon.svg` uses JSX attribute names (`strokeWidth`) and is not linked by any tag; `public/manifest.webmanifest` lists only a 32 px SVG; `icon.svg`/manifest/OG use `#10b981` while `--primary` is `hsl(160 70% 30%)`.
- Wordmark renders "Appeal Deck" (`AppHeader.tsx:27–32`, two flex children).
- Badges are solid saturated pills; tooltips are `bg-muted`; buttons lift on hover; cards carry `backdrop-blur-sm`; Accordion/Sheet/Dialog use animation classes that do not exist (no keyframes, no plugin); `text-display` is a CSS var with no Tailwind class.
- Width tokens exist but pages use `max-w-5xl` ×11, `max-w-3xl` ×5, `max-w-2xl` ×3, `max-w-4xl`, `max-w-xl`; heading sizes are ad hoc (`text-lg` ×16, `text-2xl` ×10, `text-3xl` ×6, `text-xl` ×5, `text-4xl` ×3, `text-5xl`).
- Header: always-underlined nav, no Sign in; footer: one 12 px row plus two unbounded 12 px disclaimer lines.
- Pricing table captioned with the sample-POA watermark (`pricing/page.tsx:75`); dashboard locked cards position `Lock` absolutely without `relative` (`DashboardClient.tsx:245,256`); `/vault` prints its title twice; `EvidenceSlotPanel` prints raw enum keys and hard-codes eight strings; decode hint shows twice at 0 characters.
- Gates at `7051682`: typecheck · lint · lint:copy (3 passes) · vitest 308/308 · build 30 routes green; `format:check` red only on the CRLF working copy of `billing/page.tsx` (fixed by the fix pass F7). Inter `opsz` axis confirmed available in `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`.

**State after the access + continuity pass (AM-21, 10 Sep 2026 — the actual start state of this pass; V0 records the numbers):**
- The header already has the five slots (Decode · Case · Dashboard · Vault 🔒 · Pricing|Billing), a `Lock` + tooltip on Vault when signed out, a ghost "Sign in" link carrying `?next=` on app routes, and a session-aware right cluster on static pages. Labels live in `SHARED.nav.*` (keys: `primary, decode, case, dashboard, vault, pricing, billing, faq, signIn, signOut, menu, openMenu, themeToggle, lockedHint`). **V4 restyles this header and keeps every behaviour.**
- `AppShell` accepts `user: null`; `(app)/layout.tsx` renders it for signed-out visitors too, so `main#main` exists on every app route.
- `/case`, `/dashboard`, `/vault` render signed out (S§3.2 of spec 07): `SignInGate.tsx`, `CasePreview.tsx` (also under the decode result with a "Start your case — free" CTA), the dashboard draft summary / teaching `EmptyState`, the vault teaching state. `DashboardClient` has **no locked-card branch** any more (the `absolute top-4 right-4` `Lock` is gone). `/compose` shows `ComposeGate.tsx` (D8 consent via `pricing/ConsentRow.tsx`, `CheckoutButton`, an activation state) when signed in without a Pass. All `APP.*.noPass*` keys are removed; the strings live in `APP.access.*`.
- Pricing table has **three columns** (Free · Free account · Appeal Pass) and four new rows; `e2e/marketing.spec.ts` asserts the three `columnheader`s with `exact: true`.
- New route `GET /api/license/status` (build ≥ 31 routes). `lint:copy` prints **5** passes. vitest ≥ 309 plus the access pass's tests. Playwright: `e2e/access.spec.ts` added; the "Auth gate" tests now expect `/case`, `/dashboard`, `/vault` to render signed out and `/compose`, `/billing` to redirect with `?next=`.
- The hard-coded `CheckoutButton` strings moved to `APP.checkout.*`; the privacy page gained one paragraph (`what-we-collect`).

## 2. SETTLED — do not reopen
D1–D10 (CLAUDE.md §2); AM-16…AM-19; spec 06 principles §1, simplicity budget §1.1, motion §5, state quartet §6, content system §10, §14 verdicts (confetti, tours, analytics banner, countdowns, approval scores, template tabs, sticky disclaimer bar all rejected). S§13 "not in this pass" is binding. The header is the five-slot header decided in AM-21 (spec 07 §3.1) — this pass restyles it and adds no further nav item; it adds no card above the fold and no second primary action on any screen. AM-21's behaviours (signed-out states, gates, three-column pricing, compose gate, continuity) are settled: restyle, never change.

---

## 3. TASKS — in this order, one commit each

### Task V0 — Start condition, ratification paperwork, evidence log

**Do.**
1. Verify the start condition (banner: `git log --oneline -1` → `docs(access/task-8)`). `git status --short` must be clean except `.claude/` and `disconnected-chat!.txt`. Verify the visual deliverables are committed: `git ls-files public/brand | wc -l` → 21, `git ls-files docs/handoffs/assets | wc -l` → 5, `git ls-files docs/handoffs/2026-09-09-visual-*.md docs/handoffs/2026-09-09-copy-deck.md | wc -l` → 6 (committed by the reviewing AI on 10 Sep 2026). Anything else: stop and report.
2. Run the §5 gate block once and record the **baseline** rows in `docs/handoffs/2026-09-09-visual-refresh.md` (tests, routes — expect ≥ 31 — lint:copy pass count — expect 5 — format:check exit).
3. If box A is ticked: append the AM-20 block from S§12 to `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` **directly after the AM-19 block and before the AM-21 block** (AM-21 was appended on 10 Sep 2026; the file then reads AM-19 → AM-20 → AM-21). The DoD line already reads "All 34 action items AA-01…AA-34" and names AA-32 as this pass's item: **do not change the count**; append "— <DD> Sep 2026: AM-20 ratified; AA-32 OPEN (visual v3)." to that line. If box A is unticked, append the same block with the title suffix "(mark v2 deferred; assets recoloured)" and record the deviation.
4. Append to `docs/DECISIONS.md` (same format as the AM-21 entry): `## 2026-09-<DD> — AM-20 ratified: visual system v3 (brand mark, tokens, shell, hero-as-product)` with Decision / Alternatives (do nothing until sales — rejected: the free funnel's sample fails and the decoder has no shell; hire a designer — deferred to post-revenue; Tailwind v4/OKLCH — separate decision) / Rationale / Files / Decider.
5. `CLAUDE.md` §4: one bullet "**AM-20 ratified <DD> Sep 2026** — visual refresh v3 (AA-32) started; prompt `docs/handoffs/2026-09-09-visual-refresh-prompt.md`; audit `…-visual-audit.md`." `docs/handoffs/SESSION-START-PROMPT.md`: verify the two PATH lines already point at this prompt and `docs/handoffs/2026-09-09-visual-refresh.md` (the access pass's A8 set them); add a History line.
6. Resume pointer → Task V1 step 1.

**Accept.**
```
git log --oneline -1                                                   → docs(visual-v3/task-0) on top of docs(access/task-8)
grep -n "AM-20" Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md → ≥ 1 hit before "## 4. Facts"
grep -n "AM-20 ratified" docs/DECISIONS.md                             → 1 hit
grep -n "PASS PROMPT PATH" docs/handoffs/SESSION-START-PROMPT.md       → …2026-09-09-visual-refresh-prompt.md
```
Commit: `docs(visual-v3/task-0): AM-20 recorded, visual audit + spec + prompt + guide + copy deck + brand kit committed, evidence log opened`

---

### Task V1 — Foundation: tokens v3, Tailwind scale, fonts, base layer (S§2, S§3, S§4.1, S§5.0)

**Why.** Every later task depends on these classes existing (`text-display`, `max-w-marketing`, `shadow-card`, `animate-accordion-down`, tinted tokens).

**Do.**
1. `src/app/globals.css`: replace the `:root` and `.dark` **colour** blocks with S§2 (keep the typography, width, motion and z tokens; add `--w-tool: 52rem`; add `--shadow` to both blocks). Replace `--text-display/h1/h2` with S§3.2. Add the S§2.1 base-layer rules (`font-feature-settings`, heading tracking, `.lucide`, `.marketing-surface` + `.dark .marketing-surface`). Delete the unused `body.bg-gradient` block. Leave the `@media print` block exactly as the fix pass left it.
2. `tailwind.config.ts`: add `maxWidth` (S§4.1), `fontSize` (S§3.3), replace `boxShadow` with S§5.0, add the S§5.0 `keyframes`/`animation`, set `container.padding = { DEFAULT: "1rem", sm: "1.5rem" }`. Keep `colors` and `borderRadius` as they are.
3. `src/lib/fonts.ts` → S§3.1.
4. `src/app/layout.tsx`: `viewport.themeColor` dark value → `hsl(224 28% 7%)`; keep `manifest: "/manifest.webmanifest"` (the static manifest stays, V2 updates its contents). Nothing else in this file. In `tailwind.config.ts` also add `brand: "hsl(var(--brand) / <alpha-value>)"` to `colors` and the `--brand` token to both blocks in `globals.css` (S§2, S§5.0).
5. Run `npm run build` — the font download and the arbitrary `fontSize` tuples must compile.

**Accept.**
```
grep -c "161 64% 30%\|160 52% 62%" src/app/globals.css               → 2
grep -n "bg-gradient" src/app/globals.css                              → 0 hits
grep -n "\.lucide\|marketing-surface\|--w-tool\|--shadow:" src/app/globals.css → ≥ 5 hits
grep -n "display: \[\|marketing: \"var\|accordion-down\|elevated:" tailwind.config.ts → ≥ 4 hits
grep -n "axes: \[\"opsz\"\]" src/lib/fonts.ts                          → 1 hit
grep -n "manifest:" src/app/layout.tsx                                 → 1 hit (kept)
grep -n "brand:" tailwind.config.ts; grep -c "\-\-brand:" src/app/globals.css → 1 hit; 2
npm run build 2>&1 | tail -5                                           → ✓ Compiled, exit 0
```
Commit: `feat(visual-v3/task-1): colour tokens v3 with tinted shadows, Tailwind type/width/shadow/keyframe scales, Inter variable with optical sizing`

---

### Task V2 — Brand: mark, wordmark, favicon, apple icon, manifest, OG image (S§1)

**The assets already exist** — `public/brand/` holds the finished kit and `public/brand/README.md` is the placement map. This task copies and wires; it designs nothing.

**Do.**
1. `src/content/shared.ts`: add `brand` (S§14). (`metadata.ogTagline/ogSub` are no longer needed — the OG image is static.)
2. New `src/components/Logo.tsx` = S§1.3 verbatim (brand-fixed mark via `fill-brand`/`stroke-brand`/`fill-white`; box A). If box A is unticked, keep the current three-lines-and-magnifier glyph inside the same component API and classes.
3. Copy with your file tool (binary files: use `Copy-Item`/`cp`, never a text redirect): `public/brand/favicon.svg` → `src/app/icon.svg` (overwrite) · `public/brand/favicon.ico` → `src/app/favicon.ico` · `public/brand/apple-icon-180.png` → `src/app/apple-icon.png` · `public/brand/og-1200x630.png` → `src/app/opengraph-image.png`. Create `src/app/opengraph-image.alt.txt` with the one-line alt text from the README. `git rm src/app/opengraph-image.tsx` and `git rm public/apple-touch-icon.svg`.
4. `public/manifest.webmanifest` → the JSON in `public/brand/README.md` (theme colour `#1C7D5E`, four icons including the maskable one).
5. `src/app/layout.tsx` metadata: `twitter.card: "summary_large_image"`. Nothing else.
6. `AppHeader.tsx`: replace the local `Logo` function with `import { Logo } from "@/components/Logo"` (the header rebuild itself is V4 — here only the logo swap, so the gap fix ships now).
7. Verify in the browser: `/icon.svg`, `/favicon.ico`, `/apple-icon.png` (180 × 180), `/manifest.webmanifest`, `/opengraph-image.png`; `view-source:/` shows `rel="icon"`, `rel="apple-touch-icon"` and `og:image` tags pointing at them.

**Accept.**
```
grep -rn "10b981" src public                                           → 0 hits
grep -n "strokeWidth\|strokeLinecap" src/app/icon.svg                  → 0 hits
test -f src/app/favicon.ico && test -f src/app/apple-icon.png && test -f src/app/opengraph-image.png && test -f src/app/opengraph-image.alt.txt && test -f src/components/Logo.tsx → all exist
test ! -e public/apple-touch-icon.svg && test ! -e src/app/opengraph-image.tsx → both gone
cmp public/brand/favicon.svg src/app/icon.svg && cmp public/brand/apple-icon-180.png src/app/apple-icon.png → identical
grep -n "maskable\|#1C7D5E" public/manifest.webmanifest                 → 2 hits
grep -n "summary_large_image" src/app/layout.tsx                         → 1 hit
grep -n "Appeal<span" src/components/Logo.tsx                          → 1 hit; grep -n "function Logo" src/components/AppHeader.tsx → 0 hits
curl -sI http://localhost:3000/apple-icon.png | grep -i "content-type"  → image/png
```
Commit: `feat(visual-v3/task-2): brand kit wired — favicon set, apple icon, manifest icons, static OG image, brand-fixed Logo component in the header`

---

### Task V3 — Primitives restyled (S§5.1–5.10)

**Do.** In `src/components/ui/`: `button.tsx` (S§5.1, adds `link`, `icon-sm`), `badge.tsx` (S§5.2, adds `solid`), `card.tsx` (S§5.3, adds `CardDescription`), `input.tsx` + `textarea.tsx` + new `native-select.tsx` (S§5.4; export `fieldClassName` from `input.tsx`), `alert.tsx` (S§5.6, delete the `React.Children.map` block, `role` by variant), `tooltip.tsx` (S§5.7), `skeleton.tsx` + `progress.tsx` (S§5.8), `accordion.tsx` + `tabs.tsx` + `table.tsx` + `checkbox.tsx` (S§5.9), `sheet.tsx` + `dialog.tsx` + `toaster.tsx` (S§5.10). `DeadlineChip.tsx` per S§5.5 (drop `font-mono`, icon in tone colour). Then `npm run typecheck` — callers of removed variant names (`shadow-soft-lg` remains as an alias) must still compile.

**Accept.**
```
grep -rn "hover:-translate-y" src/components/ui                        → 0 hits
grep -n "backdrop-blur-sm" src/components/ui/card.tsx                  → 0 hits
grep -n "React.Children.map" src/components/ui/alert.tsx               → 0 hits
grep -n "richColors" src/components/ui/toaster.tsx                     → 1 hit, value false
grep -n "animate-in\|zoom-in-95\|fade-out-none" src/components/ui      → 0 hits
grep -n "animate-slide-in-right\|animate-zoom-in\|animate-accordion-down" src/components/ui/sheet.tsx src/components/ui/dialog.tsx src/components/ui/accordion.tsx → 3 hits
grep -n "bg-surface-inverse" src/components/ui/tooltip.tsx             → 1 hit
test -f src/components/ui/native-select.tsx                            → exists
grep -n "font-mono" src/components/DeadlineChip.tsx                    → 0 hits
npm run typecheck && npm test 2>&1 | tail -4                           → 0 errors; tests ≥ baseline
```
Commit: `feat(visual-v3/task-3): primitives on tokens v3 — tinted badges and alerts, calm buttons, layered cards, edged fields, inverse tooltips, real panel motion`

---

### Task V4 — Shell: header, footer, MarketingShell, SectionHeading, AppShell, expectations card, empty state, stepper (S§4.3, S§4.4, S§6)

**Do.**
1. `src/content/shared.ts`: `nav.*` **already exists** (AM-21 Task A1 — keep every key and value); add `footer.groups`, `footer.copyright`, `expectations.*` (S§14).
2. `AppHeader.tsx` render → S§6.1 as updated for AM-21: five slots in both states, labels from `SHARED.nav`, hrefs local, `aria-current` drives the active pill, the `Lock` + `Tooltip` on Vault when signed out, the ghost Sign in link **keeping its `?next=` logic**, the session-aware right cluster (`useSessionState`) untouched, Sheet with `SheetTitle` and the full-width Sign in button when signed out. Restyle only — the access pass's `e2e/access.spec.ts` and `e2e/marketing.spec.ts` (`/sign in/i` link) must stay green.
3. `SiteFooter.tsx` → S§6.2 (`FooterGroup` local helper; copyright year via `new Date().getFullYear()` in a server component — `SiteFooter` is a server component today, keep it so).
4. New `src/components/MarketingShell.tsx` (S§4.3) and `src/components/SectionHeading.tsx` (S§4.4).
5. `AppShell.tsx` → S§6.3; `src/app/loading.tsx` and `src/app/(app)/loading.tsx` skeleton headers → `h-16`/`h-14` and `max-w-marketing`/`max-w-app`.
6. `HonestExpectationsCard.tsx` → S§6.4 (keep `whatToDo` working). `EmptyState.tsx`, `Stepper.tsx` → S§6.5.
7. `e2e/screenshots.spec.ts`: `OUT` → `docs/handoffs/screenshots/2026-09-<DD>-visual`. Run it for the public routes; look at `/` and `/pricing` at 1280 light before committing (header/footer must already read as S§11 items 1 and 5 — pages themselves come next).

**Accept.**
```
grep -n "underline" src/components/AppHeader.tsx                       → 0 hits
grep -n "SHARED.nav.signIn\|SheetTitle" src/components/AppHeader.tsx   → ≥ 2 hits
grep -n "lockedHint\|next=" src/components/AppHeader.tsx               → ≥ 2 hits (AM-21 behaviour kept)
grep -n "max-w-marketing" src/components/AppHeader.tsx src/components/SiteFooter.tsx → ≥ 2 hits
grep -n "groups.product\|groups.legal\|copyright" src/components/SiteFooter.tsx → 3 hits
test -f src/components/MarketingShell.tsx && test -f src/components/SectionHeading.tsx → exist
grep -n "weDoNot" src/components/HonestExpectationsCard.tsx            → ≥ 2 hits
grep -n "✓\|—" src/components/Stepper.tsx                              → 0 hits (icons, not glyphs)
grep -n "max-w-app" src/components/AppShell.tsx                        → 1 hit
npm run lint:copy 2>&1 | tail -2                                       → PASS
```
Commit: `feat(visual-v3/task-4): rebuilt header with pill nav and sign-in, three-column footer with bounded legal strip, MarketingShell and SectionHeading, two-column expectations card`

---

### Task V5 — Home: hero-as-product, numbered steps, expectations, closing band (S§7.1)

**Do.**
1. `src/content/marketing.ts`: add `HOME.hero.eyebrow`, `HOME.hero.reassuranceLine`, `HOME.hero.artwork.label`, `HOME.howItWorks.eyebrow`, `HOME.expectations.eyebrow`, `HOME.closing`; change the three step titles (S§14).
2. New `src/components/marketing/HeroArtifact.tsx` (client; uses `guidanceFor("POLICY")`, `SeverityBadge`, `CaseStateBadge`, `DeadlineChipList`, `LocalFirstBadge`; the fixed illustrative dates move here from `page.tsx`).
3. `src/app/page.tsx` → `MarketingShell` + S§7.1 sections. Numbers rendered from the array index; `HOW_IT_WORKS` icons unchanged. **If box D is ticked:** build the home per the copy deck §4.2 — the "What you get" section renders `PRICING.rows[*].feature` and the proof section renders `PRICING.trust.*` + `VerifiedStamp`; the do/do-not card is not on the home page (it lives on `/pricing`, `/compose` and the dashboard). Task V10 supplies the strings; build the sections here with the S§14 keys and let V10 swap the wording.
4. Screenshots at 375/768/1280 light + dark; check S§11 items 2–4.

**Accept.**
```
grep -n "MarketingShell\|HeroArtifact\|SectionHeading\|HOME.closing" src/app/page.tsx → ≥ 4 hits
grep -n "\"1\. \|\"2\. \|\"3\. " src/content/marketing.ts               → 0 hits
grep -n "text-display" src/app/page.tsx                                 → 1 hit
grep -n "guidanceFor(\"POLICY\")" src/components/marketing/HeroArtifact.tsx → 1 hit
npx playwright test e2e/marketing.spec.ts --reporter=dot 2>&1 | tail -3 → 0 failed
```
Commit: `feat(visual-v3/task-5): home hero is the product — decoded-notice panel, fluid display headline, numbered steps, two-column expectations, closing band`

---

### Task V6 — Pricing (S§7.2)

**Do.** `src/content/marketing.ts` add `PRICING.price`, `priceNote`, `included`, `jumpToPurchase` (S§14). `src/app/pricing/page.tsx` → `MarketingShell` + S§7.2 as updated for AM-21: price card whose "Included" list is the Pass-only rows (`poa`, `critic`, `replyAnalysis`, `devices`, `refund`), the **three-column** table (Free · Free account · Appeal Pass — keep the exact `columnheader` texts; Pass column tinted; "First steps" / "Draft only" / "Yes, daily cap" cell values render as text, `Yes` with the check glyph, `—` muted), trust tiles with icons, FAQ in a card, `id="purchase"`; **delete the watermark caption** under the table; `PurchasePanel.tsx` button row per S§7.2 (sample dialog trigger `variant="link"`) **keeping the AM-21 completion handling and `ConsentRow`**. Screenshots 375/1280 light + dark; check S§11 item 6.

**Accept.**
```
grep -n "samplePoa.watermark" src/app/pricing/page.tsx                 → 0 hits
grep -n 'id="purchase"\|PRICING.price\b\|jumpToPurchase' src/app/pricing/page.tsx → ≥ 3 hits
grep -n "Badge" src/app/pricing/page.tsx                                → 0 hits on the trust grid (badges replaced by icon tiles)
npx playwright test e2e/marketing.spec.ts --reporter=dot 2>&1 | tail -3 → 0 failed (the three exact columnheader names intact)
```
Commit: `feat(visual-v3/task-6): pricing with a price card, emphasised Appeal Pass column, three-column table, icon trust tiles and an anchored purchase card`

---

### Task V7 — Decode page: shell, layout, hint logic, result card, decodable sample (S§7.3; boxes B and C)

**Do.**
1. `src/content/marketing.ts`: add `DECODE.result.*` (S§14); move the hard-coded strings in `DecodeClient.tsx` ("Do now", "Do not", "Need more than the decoder?", the CTA sentence, "No timers…", "Could not decode", "Something went wrong.", "Network error…", "Copy plain-English summary") onto them.
2. `src/app/decode/page.tsx` → `<MarketingShell width="tool"><DecodeClient /></MarketingShell>` (the fix pass mounted `OfflineNotice` inside `DecodeClient`; keep it).
3. `DecodeClient.tsx` → S§7.3: form card, single counter line, hint `Alert` only when `text.trim().length >= 40 && likeness.hint`, remove the `motion.div` wrappers around the buttons and the CTA panel, result as one `Card` with an `h2`, two-tone triage panels, expectations card, CTA panel, `CopyButton` in the header; dashed empty state; result-shaped skeleton. **Keep the `CasePreview` panel and the "Start your case — free" CTA that AM-21 Task A4 placed under the result** (restyle as S§7.3's preview panel; strings and the `/case?kind=` link unchanged).
4. **Box B:** `src/content/sampleNotice.ts` exports the S§14 text as `SAMPLE_NOTICE_TEXT` (keep `SAMPLE_NOTICE_ID` for reference; the fixture stays untouched).
5. **Box C (only if ticked):** export `AMAZON_MARKERS` from `src/lib/noticeLikeness.ts` and import it in `src/app/api/decode/route.ts`; keep the `hits >= 2` and `length >= 50` rules; add one vitest in `src/lib/__tests__/noticeLikeness.test.ts` asserting `SAMPLE_NOTICE_TEXT` scores ≥ 2 markers.
6. Prove the P0 fix in the browser: `/decode` → Try a sample notice → Decode → result card visible (screenshot into the visual folder as `decode-sample-result-1280-light.png`).

**Accept.**
```
grep -n "MarketingShell" src/app/decode/page.tsx                        → 1 hit
grep -n '"Do now"\|"Do not"\|Need more than the decoder' src/app/decode/DecodeClient.tsx → 0 hits (moved to content)
grep -n "length >= 40" src/app/decode/DecodeClient.tsx                  → 1 hit
grep -n "motion.div" src/app/decode/DecodeClient.tsx                    → ≤ 2 hits (result stagger only)
grep -n "Seller Performance" src/content/sampleNotice.ts                → 1 hit (box B)
curl -s -X POST localhost:3000/api/decode -H "content-type: application/json" -d @<(node -e "console.log(JSON.stringify({text: require('fs').readFileSync('src/content/sampleNotice.ts','utf8')}))") → not needed; instead: browser proof screenshot listed in the evidence log
```
Commit: `feat(visual-v3/task-7): decoder inside the marketing shell — form card, single hint, result card with two-tone triage, sample notice that decodes`

---

### Task V8 — FAQ, legal pages, auth shell, system pages (S§7.4–7.6, S§7.8)

**Do.** `src/app/faq/page.tsx` → S§7.4 (`MarketingShell width="reading"`, grouped cards with `id` slugs). `LegalPage.tsx` → S§7.5 + new client `LegalToc.tsx` (IntersectionObserver active state). `AuthCard.tsx` `AuthShell` → S§7.6 (logo mark above the card, 200 ms fade, link-style toggle; `login/page.tsx` toggle button → `Button variant="link"`; keep every role/name the e2e tests assert). `not-found.tsx`, `error.tsx` → S§7.8 inside `MarketingShell width="reading"`.

**Accept.**
```
grep -n "MarketingShell" src/app/faq/page.tsx src/components/LegalPage.tsx src/app/not-found.tsx src/app/error.tsx → 4 hits
test -f src/components/LegalToc.tsx                                     → exists
grep -n "duration: 0.35" "src/app/(app)/login/page.tsx" "src/app/(app)/signup/page.tsx" → 0 hits
grep -n "LogoMark" src/components/AuthCard.tsx                          → ≥ 1 hit
npx playwright test e2e/marketing.spec.ts e2e/a11y.spec.ts --reporter=dot 2>&1 | tail -3 → 0 failed
```
Commit: `feat(visual-v3/task-8): FAQ cards with anchors, legal pages with a live table of contents, auth shell with the mark, system pages inside the shell`

---

### Task V9 — App surfaces on the new system (S§7.7)

**Do.** Page heads on `dashboard`, `case`, `compose`, `vault`, `billing` per S§7.7. `DashboardClient.tsx`: `ReadinessCard` score row, two-column grid for the two secondary cards, and the **signed-out states from AM-21** (draft summary, teaching `EmptyState`) on the new tokens — there is no locked-card branch any more. `SignInGate.tsx`, `CasePreview.tsx`, `ComposeGate.tsx` and the vault teaching state: restyle to S§7.7 (surface-2 panels, `SectionHeading`-style eyebrows, `Check`/`Minus` glyphs for required/optional) without changing a string or a link. `src/app/(app)/case/page.tsx`: drop the outer card around `InterviewFlow`; engine badge as `Badge variant="secondary"`; the `CasePreview` column stays (`lg:grid-cols-[1fr_20rem]`). `VaultView.tsx`: remove the duplicated h2/subtitle, toolbar row with `NativeSelect`, record rows and action buttons per S§7.7. `EvidenceSlotPanel.tsx`: `APP.evidenceSlots.*` strings (S§14) and `APP.evidenceKinds` labels, `EvidenceStatusBadge` for attached. `ComposeView.tsx`: back link `variant="link"`; `PoaSection.tsx` header/aside classes. Screenshots for the auth routes via `e2e/screenshots.spec.ts` require `DEV_LOGIN_EMAIL`/`DEV_LOGIN_PASSWORD` in the environment — if the founder has not provided them, write "auth screenshots NOT RUN — no dev login env" and verify these surfaces through `/dev/ui` compositions instead (V10 adds them).

**Accept.**
```
grep -n "absolute top-4 right-4" src/components/DashboardClient.tsx    → 0 hits (already 0 after AM-21; keep it so)
grep -n "dashboardSignedOut\|signInGate\|composeGate" src/components/DashboardClient.tsx src/components/SignInGate.tsx src/components/ComposeGate.tsx → ≥ 3 hits (AM-21 strings untouched)
npx playwright test e2e/access.spec.ts --reporter=dot 2>&1 | tail -3   → 0 failed
grep -n "APP.vault.title\|APP.vault.subtitle" src/components/VaultView.tsx → 0 hits
grep -n "NativeSelect" src/components/VaultView.tsx                     → ≥ 1 hit
grep -n 'variant="destructive"' src/components/VaultView.tsx            → 1 hit (the confirm button in the delete dialog only)
grep -n "replace(/_/g" src/components/EvidenceSlotPanel.tsx             → 0 hits
grep -n "Required evidence\|Open the vault" src/components/EvidenceSlotPanel.tsx → 0 hits (strings in content)
npm run lint:copy 2>&1 | tail -2                                        → PASS
```
Commit: `feat(visual-v3/task-9): app pages on tokens v3 — page heads, readiness score, vault toolbar and rows, evidence slot labels from content`

---

### Task V10 — Copy deck applied: value-first marketing strings (box D; `docs/handoffs/2026-09-09-copy-deck.md`)

**Why.** Founder direction 9 Sep: marketing surfaces say what the seller gets; the boundaries live in Terms, the FAQ and the pre-purchase card. The deck rewrites every string under that rule and keeps every D6 line (no "guarantee", no rates, no fake urgency, expectations card at purchase, independence line in footer/Terms/FAQ).

**Do.**
1. Apply deck §4.1–§4.7 to `src/content/shared.ts`, `marketing.ts`, `auth.ts`, `app.ts` exactly as written (current → new). Ratified independence strings stay untouched. **AM-21 strings (`SHARED.nav.*`, `APP.access.*`, `APP.checkout.*`, the pricing `account` column and the four AM-21 rows, the FAQ item "What is free, and what needs an account?", the privacy paragraph) stay exactly as the access pass wrote them** — the deck (updated 10 Sep) lists them as unchanged. Remove the expectations section from the home page; the `HonestExpectationsCard` renders on `/pricing` (title `PRICING.expectationsTitle`), `/compose` and the dashboard only.
2. Home (built in V5): the "What you get" section renders `PRICING.rows[*].feature`; the proof section renders `PRICING.trust.*` + `VerifiedStamp`. No strings beyond the deck.
3. FAQ: replace `FAQ.items` and `FAQ.groups` with deck §4.5 (11 items, 5 groups); `faqByGroup()` keeps working; `/faq` and the pricing accordion pick the new items up.
4. ★ Deck §4.8: `GLOBAL_EXPECTATIONS.whatWeDoNot` and `typicalNote` in `src/core/guidance.ts` — copy only, no logic; `npm test` must stay green (`src/core/index.test.ts` banned-word test, `core.test.ts`). The card's second column label is `SHARED.expectations.weDoNot` = "What stays in your hands".
5. `src/app/layout.tsx`: title/description literals read from `SHARED.metadata.*` (one source).

**Accept.**
```
grep -rn "no outcome promises\|do not promise reinstatement\|never touches your Amazon account\|No timers" src → 0 hits
grep -c "q: \"" src/content/marketing.ts                                → 12 (deck's 11 + AM-21's "What is free, and what needs an account?")
grep -n "What stays in your hands" src/content/shared.ts src/core/guidance.ts → ≥ 1 hit
grep -n "expectationsTitle" src/app/page.tsx                            → 0 hits; grep -n "HonestExpectationsCard" src/app/pricing/page.tsx → ≥ 1 hit
npm run lint:copy 2>&1 | tail -2; npm test 2>&1 | tail -4               → PASS; tests ≥ baseline
npx playwright test e2e/marketing.spec.ts --reporter=dot 2>&1 | tail -3 → 0 failed (footer independence text still present)
```
Commit: `feat(visual-v3/task-10): value-first copy across marketing, FAQ, auth and app surfaces; expectations card at the purchase point`

---

### Task V11 — Dev gallery, screenshots, gates, docs, tick (S§7.9, S§11)

**Do.**
1. `src/app/dev/ui/DevUiGallery.tsx` (`"use client"`) receives the JSX from `page.tsx`; `page.tsx` keeps `notFound()` in production and renders it. Add the S§7.9 sections; include a "Dashboard head", "Vault row", "Evidence slot" composition using fixture props so the app surfaces can be screenshot without login.
2. Run the full §5 block; paste each proving line into the evidence log. Run `npx playwright test` and the screenshots spec (public routes at 375/768/1280, light + dark; `/dev/ui` at 1280 light + dark). Walk S§11 items 1–10 and write one evidence row per item with the screenshot path.
3. `02-BUILD-PLAN-AMENDMENTS.md`: tick AA-32 with the V10 hash. `CLAUDE.md` §4: one DONE bullet listing V0–V11 by hash from `git log`. Evidence log: Resume pointer `done`, Discovered and Deviations filled ("none" if empty).

**Accept.** Every V1–V10 Accept line has an evidence row with a real hash; S§11 items 1–10 each have a row; §5 green or explicitly NOT RUN; `/dev/ui` renders with no console error (`read_console_messages` or the Next overlay clean).

Commit: `docs(visual-v3/task-11): gallery repaired and extended, visual acceptance screenshots, gates, AA-32 ticked, CLAUDE.md state`

---

## 4. SELF-CHECK BEFORE EACH COMMIT
§4 of the polish prompt + `git cat-file -t` on every hash you write + `git ls-files --eol <changed>` shows `w/lf` + **look at the screenshot** for any task in §0.C rule 7.

## 5. FINAL GATES
`npm run typecheck` · `npm run lint` 0 warnings · `npm run lint:copy` PASS (5 passes since the fix pass) · `npm run format:check` exit 0 · `npm run build` routes ≥ 31 (AM-21 added `/api/license/status`), and `/icon.svg`, `/favicon.ico`, `/apple-icon.png`, `/manifest.webmanifest`, `/opengraph-image.png` all answer 200 · `npm test` ≥ baseline (+1 if box C) · `npx playwright test` 0 failed · Lighthouse a11y 1.0 on `/`, `/pricing`, `/decode`, `/faq`, `/login` · `grep -rn "10b981" src public` → 0 · `grep -rn "max-w-5xl\|max-w-4xl\|max-w-3xl\|max-w-2xl" src/app src/components --include=*.tsx` → 0 · `grep -rn "hover:-translate-y" src` → 0 · `grep -rn "guarantee" src` → only the critic pattern and tests · `grep -rli superpower src e2e scripts` → 0 · S§11 items 1–10 evidenced with screenshots · simplicity statement per route (one primary action, ≤ 3 cards above the fold, ≤ 7 nav items) written in the evidence log.

## 6. AFTER THE PASS (surface, do not perform)
Founder signs off the S§11 screenshots (light + dark, 375 + 1280); decides on the Vercel preview deploy (`docs/DEPLOYMENT.md`); decides whether Wave C-fix Tasks 8–10 or AA-31 (M-4) runs next.

## 7. FOUNDER-GATED (never do these yourself)
Everything in §7 of the polish prompt. Plus: no copy beyond S§14; no change to `legal/*.md`; no photo, illustration or testimonial assets; no analytics or third-party scripts; no new fonts beyond Inter/JetBrains Mono; the brand mark geometry is the founder's decision (box A) — do not iterate on it.

---

## Appendix A — anchors at `7051682` (grep first; the fix pass and the access pass move lines)

Files created by the access pass (AM-21) that this pass restyles in V9 (no anchors at `7051682`; grep the component name): `src/components/SignInGate.tsx`, `src/components/CasePreview.tsx`, `src/components/ComposeGate.tsx`, `src/components/pricing/ConsentRow.tsx`, `src/lib/useSessionState.ts` (do not touch).

| File | Line(s) at `7051682` | Grep pattern | What |
|---|---|---|---|
| `src/app/globals.css` | 20–46, 73–97 | `--primary:` | light/dark colour blocks (V1) |
| | 141–148 | `bg-gradient` | unused body gradient (delete) |
| | 303–336 | `@media print` | leave as the fix pass leaves it |
| `tailwind.config.ts` | 71–76, 137–145 | `boxShadow\|keyframes` | replace/add (V1) |
| `src/lib/fonts.ts` | whole (17) | `Inter(` | V1 |
| `src/app/layout.tsx` | 38, 45–48 | `manifest:\|themeColor` | V1 |
| `src/app/icon.svg` · `public/apple-touch-icon.svg` · `public/manifest.webmanifest` · `src/app/opengraph-image.tsx` · `src/app/layout.tsx:28` (`twitter.card`) | whole | `10b981` | V2 — sources are ready in `public/brand/` (see its README) |
| `src/components/AppHeader.tsx` | 12–34 (nav arrays, Logo), 36–51 (NavLink), 58–91 (render) — **rewritten by AM-21 A1**: one five-slot list, `SHARED.nav.*`, lock + tooltip, `next=`, `useSessionState` | `function Logo\|SHARED.nav` | V2 (logo), V4 (rest) |
| `src/components/SiteFooter.tsx` | whole (43) | `SHARED.footer` | V4 |
| `src/components/AppShell.tsx` | 17 | `max-w-5xl` | V4 |
| `src/components/HonestExpectationsCard.tsx` | whole (31) | `whatToDo` | V4 |
| `src/components/EmptyState.tsx` · `Stepper.tsx` | whole | — | V4 |
| `src/components/ui/*.tsx` | whole | — | V3 |
| `src/components/DeadlineChip.tsx` | 23–28, 46–63 | `toneClasses` | V3 |
| `src/app/page.tsx` | 26–39 (dates), 62–105 (hero), 107–130, 132–144 | `HeroSection` | V5 |
| `src/app/pricing/page.tsx` | 42–52, 54–76 (table + stray caption 75), 78–92 (trust), 94–112 | `samplePoa.watermark` | V6 |
| `src/components/pricing/PurchasePanel.tsx` | 45–77 | `DialogTrigger` | V6 |
| `src/app/decode/page.tsx` · `src/app/decode/DecodeClient.tsx` | whole; hint 149–164; buttons 166–192; ResultView 235–313; CTA 315–351 | `likeness.hint` | V7 |
| `src/content/sampleNotice.ts` | whole (7) | `SAMPLE_NOTICE_TEXT` | V7 (box B) |
| `src/app/api/decode/route.ts` | 7–20 | `AMAZON_MARKERS` | V7 (box C only) |
| `src/lib/noticeLikeness.ts` | 10–33 | `AMAZON_MARKERS` | V7 (box C only) |
| `src/app/faq/page.tsx` · `src/components/LegalPage.tsx` · `src/components/AuthCard.tsx` (26–52) · `src/app/not-found.tsx` · `src/app/error.tsx` | whole | — | V8 |
| `src/app/(app)/login/page.tsx` | 134–139 (350 ms fade), 200–210 (toggle) | `duration: 0.35` | V8 |
| `src/components/DashboardClient.tsx` | 75–105 (ReadinessCard), 240–259 (locked cards — **removed by AM-21 A5**; signed-out draft/teaching states live there now), 403–482 | `ReadinessCard\|dashboardSignedOut` | V9 |
| `src/app/(app)/case/page.tsx` | 41–71 — **changed by AM-21 A2/A4** (optional user, `CasePreview` column, `InterviewFlow signedIn`) | `guidedInterview\|CasePreview` | V9 |
| `src/components/VaultView.tsx` | 229–249 (dup head), 339–353 (select), 394–475 (rows) | `APP.vault.title` | V9 |
| `src/components/EvidenceSlotPanel.tsx` | 102–163, 166–200 | `replace(/_/g` | V9 |
| `src/components/ComposeView.tsx` | 287–292 | `backButton` | V9 |
| `src/components/PoaSection.tsx` | 61–99 | `CardHeader className="flex-row` | V9 |
| `src/app/dev/ui/page.tsx` | whole (364) | `notFound()` | V10 |
| `e2e/screenshots.spec.ts` | 5 | `const OUT` | V4 |

## Appendix B — parked (not this pass)
S§13 list. Also: animated hero (rejected: spec 06 §5), scroll-triggered reveals (rejected: initial-paint motion), a "trusted by" strip (rejected: D6), pricing "most popular" ribbon (rejected: one plan), gradient buttons (rejected: one accent), custom cursor/parallax (rejected), skeleton-to-content morphs (post-freeze), Storybook (post-freeze).
