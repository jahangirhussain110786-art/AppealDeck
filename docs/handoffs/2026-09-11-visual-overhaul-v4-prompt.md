# AppealDeck — AM-22 visual overhaul v4: coding-agent prompt

Formal task prompt for the visual overhaul approved by the founder on 11 Sep 2026. The locking/planning document is `docs/handoffs/2026-09-11-visual-overhaul-v4-handoff.md` (read it for the full design rationale, the approved mockup markup, and §3's proposed task order). This file is the executable version: each task has explicit Do/Accept blocks and a verbatim commit message. Evidence log for THIS pass: `docs/handoffs/2026-09-11-visual-overhaul-v4.md`.

Baseline: commit `1e4dd05` (visual overhaul v4 handoff committed + session-start repointed). Working tree is clean.

**Two founder-gated decisions must be confirmed before their tasks start (flag them, don't guess — see §7):**

- **V1/color reconciliation — RESOLVED 12 Sep 2026:** adopt the mockup's warm-neutral palette in full (background/foreground/muted-foreground/border/muted/surface-2, exact hex→HSL — see V1 below).
- **V6/vault theme — RESOLVED 12 Sep 2026, REVERSED from the default reading:** `/vault` respects `next-themes`/`.dark` like every other page — no permanent dark "obsidian" override.

---

## STATUS — RUNNABLE from Task V0

- [x] V0: Paperwork — create this prompt, the evidence log, DECISIONS.md entry, repoint SESSION-START-PROMPT.md — **DONE**, commit `533dc84`
- [x] V1: Tokens — color reconciliation, radius, accent font (Newsreader) — **DONE** 12 Sep 2026
- [x] V2: Primitives — Badge size variant, aurora/dot-grid background utility, illustrations library — **DONE** 12 Sep 2026
- [x] V3: Home page rebuild against `Main.dc.html` — **DONE** 12 Sep 2026
- [x] V3b: Auth pages (login/signup) rebuild against `Login.dc.html` — **DONE** 12 Sep 2026
- [x] V4: Guided interview layout rebuild (rail + context panel, adapted to 2 columns) — **DONE** 12 Sep 2026
- [x] V5: Decode result layout rebuild (annotation cards) — **DONE** 12 Sep 2026
- [x] V6: Vault surface rebuild (respects site theme — no override, founder-reversed 12 Sep 2026) — **DONE** 12 Sep 2026
- [ ] V7: Sweep pass — cross-page consistency check — **not requested this round, deferred, not skipped silently** (see evidence log)
- [ ] V8: Gates — full gate run + screenshot set for founder sign-off — next

**Scope guard (AM-18, carries over):** presentation, assets, copy, and layout only. No new API routes, no engine changes, no new features. D1–D10 are not reopened. The `07-REFERENCE` directory is edit-gated.

---

## 0. OPERATING PROTOCOL

- One task = one commit, with the exact commit message given at the end of each task.
- **Create and edit files only with your file-editing tool.** Never through the shell: no heredocs, no `echo >`, no `Out-File`, no `Set-Content`, no scripts that write files. Shell writes have corrupted files in this repo to UTF-16.
- In PowerShell use `Select-Object -Last N` instead of `tail`; use your search/grep tool instead of shell `grep` where one is available, but the Accept blocks below are written as literal `grep`/`rg`-style commands for portability — translate to whatever your environment supports, the important part is the expected output, not the exact shell syntax.
- Before every commit, run the self-check block (§4). No secrets in commits.
- **D6 is the aesthetic, non-negotiable:** no "guarantee", no percentages/hours/countdowns, no invented Amazon rules, no social proof, no exclamation marks. New user-facing strings go into `src/content/*.ts`, then `npm run lint:copy` must pass. Banned words inside `src/app/`, `src/components/`, `src/content/`: "secure", "don't worry", "powerful", "simply", "just", "seamless", "trust us", "AI-powered", "hassle".
- Token-first: every visual change starts in `src/app/globals.css` + `tailwind.config.ts`. If a value is duplicated per-file, that is a bug, not a pattern.
- The approved mockup source files (in `docs/handoffs/2026-09-11-visual-direction-v2-mockup/`) are static HTML — open them in a browser to see the exact approved markup. They are the source of truth for layout, not this prompt's prose.
- Read files in ranges where you can; grep first. Keep chat to at most 3 lines between tool calls.

### 0.A Key files to read before starting V1

These are the real token architecture files the overhaul builds on (all verified in the handoff §4):

- `src/app/globals.css` — single source of truth for all color HSL tokens, radius, width, fluid type, motion, z-index. Light `:root` block, dark `.dark { }` override block.
- `tailwind.config.ts` — maps every CSS variable to a Tailwind name. Extend here, not in components.
- `src/lib/fonts.ts` — `next/font/google` config. Add Newsreader here with `variable: "--font-accent"`.
- `src/components/ui/badge.tsx` — shadcn-style Badge primitive. Add `size="sm"` variant here.
- `src/components/ui/input.tsx` — Input primitive (for the PasswordInput reference pattern, though that's already done).
- `src/app/dev/ui/DevUiGallery.tsx` — dev-only route (`/dev/ui`). Add V2 primitives here for visual testing.
- `src/content/marketing.ts` — marketing copy (hero subline must stay byte-identical to the mockup).
- `src/content/app.ts` — app strings. New copy goes here under `APP.*`.
- `src/app/(app)/case/page.tsx` — guided interview entry.
- `src/components/InterviewFlow.tsx` — the interview engine UI (V4 target).
- `src/app/decode/page.tsx` — decode result page (V5 target).
- `src/app/(app)/vault/page.tsx` — vault entry (V6 target).
- `src/app/(app)/login/page.tsx`, `src/app/(app)/signup/page.tsx` — auth entry points (V3b target).
- `src/components/VaultView.tsx` — vault UI (V6 target).

---

## 1. CONTEXT — what was approved (condensed)

### 1.1 Design direction

The founder approved a premium visual direction inspired by Stripe Atlas / Ironclad / 1Password / Linear (_"inspired," never cloned_). Approved artifact: the four `.dc.html` files in `docs/handoffs/2026-09-11-visual-direction-v2-mockup/` (open directly in any browser). Approved reference site: https://claude.ai/code/artifact/020b42eb-325e-412d-a378-8838d1917a1e

### 1.2 Palette (mockup)

- Background `#FBFBFA`, foreground `#14201C`/`#0E1815`, muted text `#4B5A54`/`#7A867F`, borders `#EDEDEA` (unified)
- Brand green `#1C7D5E` (gradient `#229070 → #1C7D5E` on primary buttons), amber warning `#D9A406`/`#8A6300`, indigo accent `#6366F1` (aurora background only)
- Vault surface only: near-black `#090C0B → #0B0F0E` gradient with `#4FDBA6` bright-mint accent

### 1.3 Typography

- Inter stays primary — already loaded (`--font-sans`)
- Newsreader italic weight 500 as serif accent for exactly one word per major headline — **not loaded yet**
- JetBrains Mono for technical strings — already loaded (`--font-mono`)

### 1.4 Radius scale (mockup vs real)

| Element      | Mockup | Real token                                            |
| ------------ | ------ | ----------------------------------------------------- |
| Cards        | 20px   | `--radius-xl: 1.25rem` ✅ exact                       |
| Buttons      | 13px   | `--radius-lg: 1.875rem` (14px) — needs 13px           |
| Rows / pills | 16px   | between `--radius-lg` (14px) and `--radius-xl` (20px) |

### 1.5 Current real token values (verified from `globals.css`)

```
Light: --background: 0 0% 100%; --foreground: 224 32% 11%; --border: 220 16% 90%; --muted-foreground: 220 9% 42%; --primary: 161 64% 30%
Dark:  --background: 224 28% 7%;  --foreground: 220 18% 92%; --border: 224 16% 18%; --muted-foreground: 220 10% 66%; --primary: 160 52% 62%
```

---

## 2. SETTLED — do not reopen

- Everything in `CLAUDE.md` §1–3 (product, locked decisions D1–D10, forbidden sources).
- AM-18 scope guard (presentation/copy/attributes only; no engine behavior, no new capabilities).
- D6 aesthetic rules (no guarantee, no percentages/hours/countdowns, no invented Amazon rules, no social proof, no exclamation marks). Banned words per §0.
- AM-17 interview engine: typed per-step inputs, no persistent input box, deterministic-first routing. V4 adds layout (step-rail + context panel) but must not change this behavior.
- AM-21 access ladder: the interview starts with no account, saves to the vault. V4's interview rewrite must preserve save-first/gate-second/resume-third.
- The founder-issues fix pass (Tasks 1–3, `6436aba`/`ed44480`/`e7a3dfb`) is complete and committed — these visual changes build on top of them.

---

## 3. TASKS

### V0 — Paperwork: create the formal prompt, evidence log, DECISIONS.md entry, repoint session-start

**Do.**

1. Write this prompt file at `docs/handoffs/2026-09-11-visual-overhaul-v4-prompt.md` (already done by the reviewing AI that wrote it — your job is to verify it exists and is consistent).
2. Create the evidence log at `docs/handoffs/2026-09-11-visual-overhaul-v4.md` with a Resume pointer at V0.
3. Append the AM-22 entry to `docs/DECISIONS.md`, and the matching AM-22/AA-35 section to `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (the amendments file is the authoritative-over-v1.0 record per `CLAUDE.md` §5 — every prior ratified AM-XX, including AM-19/AM-20/AM-21, got a section there, not only a `DECISIONS.md` entry). Bump the Definition-of-done count and status line to AA-01…AA-35.
4. Update `docs/handoffs/SESSION-START-PROMPT.md` PATH lines to point at the new prompt + evidence log.
5. Run the existing gates to confirm nothing is broken (this is a docs-only change): `npm run typecheck`, `npm run lint`, `npm run lint:copy`, `npm run format:check`, `npm run test`, `npm run build`.

**Accept.**

```
git status --short                    → only the 5 files this task creates/updates (prompt, evidence log, DECISIONS.md, 02-BUILD-PLAN-AMENDMENTS.md, SESSION-START-PROMPT.md)
npm run typecheck                     → exit 0
npm run lint                          → 0 warnings
npm run lint:copy                     → PASS
npm run format:check                  → exit 0
npm test                              → 373 passed (no regressions from the founder-fixes pass)
npm run build                         → 33 routes (no change)
```

Commit: `docs(AM-22/task-0): formal prompt, evidence log, and DECISIONS.md entry for the visual overhaul v4 pass; repoint session-start prompt`

---

### V1 — Tokens: color reconciliation, radius, accent font

**Why.** The mockup uses a warm-neutral palette (`#FBFBFA` / `#14201C` / `#EDEDEA`) against the app's current cooler-neutral HSL tokens. The brand green (`#1C7D5E` ≈ HSL 161 63% 30%) is already nearly identical to the current `--primary` (`161 64% 30%`). The real decision is the neutral axis + radius gaps + the new Newsreader accent font.

**Founder-gated.** Before committing the color reconciliation, confirm whether to adopt warm-neutral or keep cooler-neutral. If keeping cooler-neutral, adopt the mockup's `--primary` hue only (already matched).

**Do.**

1. Convert the mockup's approved hex values to HSL:
   - `#FBFBFA` → HSL(45 39% 97%)
   - `#14201C` → HSL(163 42% 16%) (light foreground)
   - `#0E1815` → HSL(162 43% 7%) (dark foreground)
   - `#4B5A54` → HSL(163 11% 33%) (light muted)
   - `#7A867F` → HSL(163 9% 48%) (dark muted)
   - `#EDEDEA` → HSL(80 22% 93%) (light border)
   - `#090C0B` → HSL(163 12% 3%) (vault dark bg)
   - `#0B0F0E` → HSL(163 13% 4%) (vault dark bg alt)
2. **Color reconciliation (founder decision):**
   - If adopting warm-neutral: update `--background`, `--foreground`, `--muted-foreground`, `--border`, `--muted`, `--surface-2` in both light and dark blocks of `src/app/globals.css` to the mockup's HSL values. Update `--muted-foreground` accordingly. Do NOT change `--primary` (already matches).
   - If keeping cooler-neutral: leave the neutral tokens unchanged; document the decision in the evidence log. Only verify `--primary` matches the mockup's `#1C7D5E`.
3. **Radius reconciliation** (`src/app/globals.css`):
   - `--radius-lg` is 0.875rem (14px); the mockup wants 13px for buttons. Option A (preferred): change `--radius-lg` to 0.8125rem (13px). Option B: add `--radius-btn: 0.8125rem` and add it to `tailwind.config.ts`. Option C: accept 14px as close enough — document the call.
   - For row items (16px): between `--radius-lg` (now 13px after Option A) and `--radius-xl` (20px). Same three-way choice: document the call.
4. **Accent font** (`src/lib/fonts.ts` + `tailwind.config.ts` + `globals.css`):
   - Add `Newsreader`, `style: ["italic"]`, `weight: ["500"]`, `variable: "--font-accent"` via `next/font/google`.
   - Add `--font-accent` CSS variable in `globals.css` (set to the loaded font).
   - Add `fontFamily.accent: ["var(--font-accent)"]` in `tailwind.config.ts`.
   - Create a tiny `<AccentWord>` component (`src/components/ui/accent-word.tsx`) that wraps a span with `font-accent font-normal` classes, so every accent word in headlines is consistent (avoiding the drift the mockup had to fix).
5. Screenshot 2–3 representative pages before/after (e.g., `/`, `/decode`, `/login`) and paste the filenames in the evidence log.
6. Run gates: `npm run typecheck`, `npm run lint`, `npm run lint:copy`, `npm run format:check`, `npm run test`, `npm run build`.

**Accept.**

```
grep -n "224 32% 11%" src/app/globals.css           → 0 hits (cooler-neutral foreground removed, IF warm-neutral adopted) OR unchanged (IF warm-neutral rejected)
grep -n "font-accent" src/lib/fonts.ts              → ≥ 1 hit
grep -n "font-accent" src/app/globals.css            → ≥ 1 hit
grep -n "accent" tailwind.config.ts                  → ≥ 1 hit (fontFamily.accent)
ls src/components/ui/accent-word.tsx                → file exists
npm run lint:copy                                    → PASS (no banned words introduced)
npm run build                                        → 33 routes (no change)
npm test                                             → all green (≥ 373)
```

Commit: `feat(AM-22/v1): reconcile visual-overhaul v4 color tokens, radius, and Newsreader accent font against the approved mockup`

---

### V2 — Primitives: Badge size variant, aurora/dot-grid background, illustrations library

**Do.**

1. **Badge** (`src/components/ui/badge.tsx`): add a `size="sm"` variant matching the mockup's `.pill-sm` (11px text, 3×10px padding). Keep the existing default size for `.pill` (12.5px text, 5×12px). Export a `BadgeSize` type.
2. **Background utility** (`src/app/globals.css`): extend `.marketing-surface` (or add `.marketing-surface-aurora` for the home hero only) with the mockup's dot-grid (radial-gradient dot pattern, masked to fade out by ~78%) + two blurred radial-gradient aurora blobs (green `#1C7D5E` at low opacity + small indigo `#6366F1`). Keep `pointer-events: none`. Respect `prefers-reduced-motion` (static only — already safe). Do NOT animate.
3. **Illustrations library**: create `src/components/illustrations/` with three React SVG components using layered-gradient `<defs>` + 2–3 stacked shapes:
   - `ShieldCheckIllustration.tsx` (hero shield-check)
   - `VaultDoorIllustration.tsx` (vault-door glyph)
   - `MagnifierDocumentIllustration.tsx` (decode magnifier-over-document)
     Each should use the resolved HSL tokens (via `hsl()` or CSS variables) so they automatically inherit theme changes.
4. Add a section to `DevUiGallery.tsx` (`/dev/ui`) demonstrating all three primitives with both light and dark backgrounds.
5. Run gates.

**Accept.**

```
grep -n "size" src/components/ui/badge.tsx                          → ≥ 1 hit (sm variant)
grep -n "marketing-surface-aurora\|dot-grid" src/app/globals.css    → ≥ 1 hit
ls src/components/illustrations/ShieldCheckIllustration.tsx        → file exists
ls src/components/illustrations/VaultDoorIllustration.tsx          → file exists
ls src/components/illustrations/MagnifierDocumentIllustration.tsx  → file exists
grep -n "ShieldCheck\|VaultDoor\|MagnifierDocument" src/app/dev/ui/DevUiGallery.tsx → ≥ 3 hits
npm run build                                                       → 33 routes (no change)
```

Commit: `feat(AM-22/v2): Badge sm variant, aurora/dot-grid marketing background, layered illustration library`

---

### V3 — Home page rebuild against `Main.dc.html`

**Do.**

1. Open `docs/handoffs/2026-09-11-visual-direction-v2-mockup/Main.dc.html` and read the exact approved markup.
2. Rebuild `src/app/page.tsx` (or its component tree) to match:
   - Pill nav badge (top of hero)
   - Headline with one `<AccentWord>` (from V2) — subline must match `src/content/marketing.ts` verbatim
   - Right-side "decoded notice" artifact panel: two deadline rows + "Do now" list from `deadlinesModel` data (never hardcoded dates — verify by data)
   - Three-card "how it works" strip below the fold
3. Replace the current `.marketing-surface` background with `.marketing-surface-aurora` on the hero section only (not every marketing page).
4. Verify hero copy is byte-identical to `src/content/marketing.ts` — grep for any hardcoded text in the page component.
5. Run gates.

**Accept.**

```
grep -n "AccentWord" src/app/page.tsx                    → ≥ 1 hit
grep -n "marketing-surface-aurora" src/app/page.tsx      → ≥ 1 hit
grep -n "Deadline\|guidanceFor" src/components/marketing/HeroArtifact.tsx → ≥ 1 hit (real data, not hardcoded — this panel already lived in HeroArtifact.tsx from the visual-refresh-v3 pass, imported into page.tsx, not inlined there)
npm run lint:copy                                        → PASS
npm run build                                            → 33 routes
```

Commit: `feat(AM-22/v3): rebuild home page against approved Main.dc.html mockup`

---

### V3b — Auth pages (login/signup) rebuild against `Login.dc.html`

**Why.** Founder direction 12 Sep 2026: use real product imagery the way Apollo/Linear/Stripe do — the auth split-screen is the clearest, lowest-risk place to start (§2.8 of the handoff). The mockup's right panel is a **labelled sample-data preview**, not a real screenshot, since the real dashboard doesn't carry this visual language yet — keep that honesty framing in the real page too (this is a real user's real sign-in page; do not imply the preview is their own data).

**Do.**

1. Open `docs/handoffs/2026-09-11-visual-direction-v2-mockup/Login.dc.html` and read the exact approved markup.
2. Rebuild `src/app/(app)/login/page.tsx` (and `.../signup/page.tsx` analogously — same split-screen shell, signup-specific fields) as a split-screen: left the real auth form (email/password via `PasswordInput`, Google, magic link — unchanged from current behavior, this is presentation only), right a framed browser-chrome panel showing a stylized preview of the dashboard using the same components the real dashboard renders (deadline rows, do-now item) fed with clearly-fixture, non-real data.
3. Caption the preview honestly, e.g. "A preview with sample data — your dashboard, once signed in, shows your own case" (or `src/content/app.ts` copy to the same effect) — this is a D6 requirement, not decoration: never let the frame imply it shows the viewer's real case.
4. This is presentation-only — the actual auth logic (NextAuth/Supabase calls, `?next=` handling, the AM-21 access ladder) must not change.
5. Run gates.

**Accept.**

```
grep -n "PasswordInput" src/app/(app)/login/page.tsx        → ≥ 1 hit (real component, unchanged)
grep -n "sample data" src/app/(app)/login/page.tsx           → ≥ 1 hit (honesty caption present)
npm run lint:copy                                            → PASS
npm run build                                                → 33 routes
```

Commit: `feat(AM-22/v3b): rebuild login/signup as a split-screen with a labelled sample-data preview panel per Login.dc.html`

---

### V4 — Guided interview layout rebuild (step-rail + context panel) — DONE 12 Sep 2026, adapted from the literal plan

**Why.** `InterviewFlow.tsx` had none of the mockup's split: no persistent rail, and "why we ask" was a click-to-expand toggle, not an always-visible panel.

**Two real findings changed the "Do" below from what was originally planned:**

1. **No new `StepRail` component was built.** `src/components/Stepper.tsx` already implements a numbered-circle-with-connecting-line vertical rail (`md:flex md:flex-col`, done/current/todo/skipped states) — built in an earlier pass, unused for this purpose until now. Building a parallel `StepRail` would have duplicated it, against this project's own no-duplicate-systems convention (the same reasoning that keeps Badge's size variant instead of a second badge system). Reused `Stepper` as the rail instead.
2. **The literal 3-column split (rail | question | why-panel) does not fit.** `/case`'s own `page.tsx` already reserves a 20rem sidebar for `CasePreview` (`lg:grid-cols-[1fr_20rem]`), and `main` is capped at `max-w-app` (72rem) regardless of viewport — so a 3rd column here starves the question card to ~168px wide at every screen size (verified directly in a browser, not assumed). **Adapted to 2 columns** (rail | question), with the why-we-ask panel rendered as a full-width, persistent (not collapsible) panel under the question at `lg:`, instead of fighting for a 3rd column. Still answers the brief — always visible, not click-to-expand — just laid out to fit the real page it lives in.

**Do (as actually executed).**

1. Read `docs/handoffs/2026-09-11-visual-direction-v2-mockup/Interview.dc.html` for intent (numbered rail, persistent why-we-ask, privacy note) — not ported pixel-for-pixel given finding 2 above.
2. `InterviewFlow.tsx`: `lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)]` — `Stepper` in column 1 (`lg:sticky`), the question `Card` in column 2, a new persistent why-we-ask panel (same `step.whyAmazonWantsIt` data, no engine change) full-width in column 2 below the card, visible only at `lg:` (the collapsible in-card toggle stays for `<lg`). The "Step X of Y" line moved from the rail into the question `CardHeader` as an eyebrow (matching the mockup's placement).
3. No change to the AM-17 engine or AM-21 save-first/gate-second/resume-third logic — verified via `npm test` (373/373, all interview-adjacent tests green) and a manual browser walkthrough of the full step sequence including a reload mid-interview.
4. Not done: adding this to `DevUiGallery.tsx` — `Stepper` already has gallery coverage from its original pass; the new why-we-ask panel is one JSX block reusing existing primitives (Alert-like `div`, `HelpCircle`/`Shield`), not judged worth a dedicated gallery entry. Flagged here rather than silently skipped.

**Accept.**

```
grep -n "Stepper" src/components/InterviewFlow.tsx                    → ≥ 1 hit (rail, reused not rebuilt)
grep -n "whyPanelEyebrow\|whyAmazonWantsIt" src/components/InterviewFlow.tsx → ≥ 1 hit
grep -n "never sent to Amazon" src/content/app.ts                     → ≥ 1 hit (whyPanelPrivacy copy)
npm run test                                                          → all green (373/373, interview tests unchanged in behavior)
npm run build                                                         → 33 routes
```

Commit: folded into the batched AM-22 V1–V4 commit (see the evidence log) per the founder's 12 Sep direction to batch several tasks per commit rather than one commit per task.

---

### V5 — Decode result layout rebuild (annotation cards)

**Why.** The current `/decode` page renders a single-column result card. The mockup (`Decode.dc.html`) has a two-column layout: decoded notice text with inline `hl-risk`/`hl-clear` highlighted spans on the left, floating annotation cards on the right explaining specific phrases, ending in a "Start your Plan of Action" CTA.

**Do.**

1. Open `docs/handoffs/2026-09-11-visual-direction-v2-mockup/Decode.dc.html`.
2. Build an `AnnotationCard` component (`src/components/AnnotationCard.tsx`): tagged clear/risky, floating on the right column.
3. Rebuild the decode result section in `src/app/decode/page.tsx` (or its component) to the two-column layout with inline highlighted spans (`hl-risk`/`hl-clear`) and annotation cards.
4. D6 compliance check: every annotation describes a _real_ phrase from the decoded notice text — no fabricated deadlines or claims (the mockup itself had two D6 near-misses caught and fixed this session). Review real annotation copy for accuracy.
5. End the right column with a "Start your Plan of Action" CTA linking to `/case`.
6. Run gates.

**Accept.**

```
grep -n "AnnotationCard" src/app/decode/page.tsx             → ≥ 1 hit
grep -n "hl-risk\|hl-clear" src/app/globals.css               → ≥ 1 hit (CSS rules for the spans)
grep -n "Start your Plan of Action" src/app/decode/page.tsx   → ≥ 1 hit
grep -n "guarantee" src/app/decode/page.tsx                   → 0 hits
grep -rn "90 days" src/app/decode/page.tsx                    → 0 hits (no invented policy claims)
npm run lint:copy                                             → PASS
npm run build                                                 → 33 routes
```

Commit: `feat(AM-22/v5): rebuild decode result with two-column annotation card layout per Decode.dc.html`

---

### V6 — Vault surface rebuild against `Vault.dc.html`

**FOUNDER-GATED decision RESOLVED 12 Sep 2026 (reversed from the handoff's default reading):** the founder explicitly said _"let the vault support the light and dark both variants with the theme and look we just selected for entire webapp"_ — `/vault` does **not** get a permanent dark "obsidian" override. It respects `next-themes`/`.dark` exactly like every other page, using the V1-reconciled warm-neutral tokens. `Vault.dc.html`'s obsidian surface was one explored direction, not the shipped behavior — carry over its layout (row list, illustration, mono filenames) and its mint-accent _flavor_ as an ordinary `--accent`/`--success`-family tint, not as a hardcoded dark background.

**Do.**

1. Open `docs/handoffs/2026-09-11-visual-direction-v2-mockup/Vault.dc.html` for layout reference only — its literal `#090C0B`/`#0B0F0E` dark-mode colors are NOT ported; use the real `--background`/`--surface-1`/`--surface-2` tokens (light and dark) instead.
2. In `src/app/(app)/vault/page.tsx` / `VaultView.tsx`, apply the row/list layout from the mockup (file rows with an icon tile, filename, kind/size caption, an "Encrypted" badge) using standard theme tokens — it must look correct in both light and dark mode via the existing toggle, with no special-cased always-dark branch.
3. Use the `VaultDoorIllustration` (from V2) as the vault teaching-state graphic; it should already inherit theme via CSS variables (built that way in V2).
4. Render filenames/technical strings (`AES-GCM`, file names, envelope-version) in `font-mono` with `tabular-nums`.
5. Add a section to `DevUiGallery.tsx` showing the vault surface in both light and dark.
6. Run gates, including a manual/E2E check that `/vault` responds to the theme toggle like other pages (no page that never changes when the user switches theme).

**Accept.**

```
grep -rn "#090C0B\|#0B0F0E\|090C0B\|0B0F0E" src/app/(app)/vault/ src/components/VaultView.tsx  → 0 hits (no hardcoded obsidian override ported into real code)
grep -n "VaultDoorIllustration" src/app/(app)/vault/page.tsx      → ≥ 1 hit
grep -n "font-mono" src/components/VaultView.tsx                  → ≥ 1 hit (technical strings)
npm run lint:copy                                                 → PASS
npm run build                                                     → 33 routes
```

Commit: `feat(AM-22/v6): rebuild vault surface per Vault.dc.html's layout, on the standard light/dark theme tokens (no obsidian override — founder-reversed 12 Sep)`

---

### V7 — Sweep pass: cross-page consistency check

**Why.** Every prior visual pass had to manually fix consistency drift between mockup files. This time, everything reads from the same tokens/components (§0's thesis). Verify it held.

**Do.**

1. Audit all pages/components for:
   - Radii consistency (`rounded-xl` for cards, `rounded-lg` or the new token for buttons, consistent pill/row radius)
   - Pill/badge sizing (Badge `size="sm"` used for compact chips, default for primary)
   - Illustration reuse (the three SVGs from V2 appear in their designated places, no one-off inline SVGs)
   - Accent-word usage (Newsreader `.accent` class or `<AccentWord>` component, not ad-hoc font changes)
2. Fix any drift found — change the token/component, not the per-file instance.
3. Run the full gate suite.

**Accept.**

```
npx prettier --check src/components/ui/accent-word.tsx        → formatted
npx prettier --check src/components/illustrations/*            → formatted
npm run typecheck                                              → exit 0
npm run lint                                                   → 0 warnings
npm run lint:copy                                              → PASS
npm run format:check                                           → exit 0
npm test                                                       → all green
npm run build                                                  → 33 routes
```

Commit: `chore(AM-22/v7): sweep pass — cross-page consistency verification, fix any token/component drift`

---

### V8 — Gates + screenshot set for founder sign-off

**Do.**

1. Run the full gate suite: `npm run typecheck`, `npm run lint`, `npm run lint:copy`, `npm run format:check`, `npm run test`, `npm run build`.
2. Run Playwright if the e2e suite covers any route changed in V3–V6: `npm run test:e2e`. If a route changed has no e2e coverage, note it. If Playwright can't run (no browser/auth), write `NOT RUN — reason`.
3. Run Lighthouse on the pages built/modified in V3–V6: `npx lighthouse http://localhost:3000` (home, decode, vault). Target: ≥ the visual-refresh v3 baseline (a11y 1.0, perf ≥ 0.9, bp ≥ 0.95, seo ≥ 0.95).
4. Capture screenshots (same convention as prior passes) at `/docs/handoffs/screenshots/2026-09-11/`. At minimum: `/`, `/decode`, `/case`, `/vault`, `/login`, light + dark, 375px and 1280px.
5. File the screenshot paths + founder sign-off status in the evidence log.

**Accept.**

```
npm run typecheck        → exit 0
npm run lint             → 0 warnings
npm run lint:copy        → PASS
npm run format:check     → exit 0
npm run test             → all green, count ≥ 373
npm run build            → 33 routes
npm run test:e2e         → all pass (or NOT RUN with reason)
npm run lighthouse       → perf ≥ 0.9, a11y 1.0, bp ≥ 0.95, seo ≥ 0.95 (report actual numbers)
ls docs/handoffs/screenshots/2026-09-11/ → screenshots present for home, decode, vault, login (light+dark, 375+1280)
```

Commit: `chore(AM-22/v8): final gates and screenshot set for founder sign-off on visual overhaul v4`

---

## 4. SELF-CHECK BEFORE EACH COMMIT

- `git cat-file -t` on every hash you're about to write anywhere.
- The prescribed commit message copied verbatim. If your work doesn't match the message, the work isn't finished as specified — fix the work, don't edit the message.
- `git ls-files --eol <changed files>` shows `w/lf` for every file (a `w/crlf` result means your editor wrote CRLF on Windows — fix before committing).
- `npm run lint:copy` after any change to `src/content/**` or any new user-facing string anywhere in `src/`.
- `npm run format:check` — no unformatted files.
- No secrets in commits.
- `grep -rin "guarantee" src/` → 0 hits after every task (D6 check).

---

## 5. FINAL GATES (after Task V8)

```
npm run typecheck      → exit 0
npm run lint           → 0 warnings
npm run lint:copy      → PASS
npm run format:check   → exit 0
npm run test           → all green, count ≥ 373
npm run build          → 33 routes (or more)
npm run test:e2e       → pass (or NOT RUN — reason)
npm run lighthouse     → perf ≥ 0.9, a11y 1.0, bp ≥ 0.95, seo ≥ 0.95
```

---

## 6. AFTER THE PASS (surface, do not perform)

- Both founder-gated decisions are resolved (V1 warm-neutral in full; V6 no vault override — see §7). Founder: sign off screenshots at V8. Decide push-`master`.
- Founder: review the accent font (Newsreader) usage and the new illustration set.
- AI assistant (reviewer): update `SESSION-START-PROMPT.md` and `CLAUDE.md` §4 to point at the next pass.

---

## 7. FOUNDER-GATED

- **V1/color reconciliation:** RESOLVED — warm-neutral in full.
- **V6/vault theme override:** RESOLVED — no override; vault respects the site theme.
- Never touch `Planning/07-REFERENCE`, `FOUNDER_NOTE`, `legal/` (except copy through `lint:copy`), or anything in `docs/handoffs/2026-09-11-visual-direction-v2-mockup/` (the mockups are read-only source).
- Do not start Task 4 (real AI-drafted composer) from the founder-issues fix pass — it is a separate, founder-gated feature.

---

## Appendix A — Key file paths (reference, not editable from this pass)

| Purpose                     | Path                                                            |
| --------------------------- | --------------------------------------------------------------- |
| Colour/radius/motion tokens | `src/app/globals.css`                                           |
| Tailwind token mapping      | `tailwind.config.ts`                                            |
| Font config                 | `src/lib/fonts.ts`                                              |
| Badge primitive             | `src/components/ui/badge.tsx`                                   |
| Input primitive (reference) | `src/components/ui/input.tsx`                                   |
| Dev UI gallery              | `src/app/dev/ui/DevUiGallery.tsx`                               |
| Marketing copy              | `src/content/marketing.ts`                                      |
| App copy                    | `src/content/app.ts`                                            |
| Home page                   | `src/app/page.tsx`                                              |
| Decode page                 | `src/app/decode/page.tsx`                                       |
| Interview entry             | `src/app/(app)/case/page.tsx`                                   |
| Interview flow UI           | `src/components/InterviewFlow.tsx`                              |
| Vault page                  | `src/app/(app)/vault/page.tsx`                                  |
| Login / signup pages        | `src/app/(app)/login/page.tsx`, `src/app/(app)/signup/page.tsx` |
| Vault view                  | `src/components/VaultView.tsx`                                  |
| Interview engine (behavior) | `src/core/interviewEngine.ts`                                   |
| Deadline model              | `src/core/deadlinesModel.ts`                                    |
| Mockup source               | `docs/handoffs/2026-09-11-visual-direction-v2-mockup/*.dc.html` |
| Evidence log for this pass  | `docs/handoffs/2026-09-11-visual-overhaul-v4.md`                |
| Decisions ledger            | `docs/DECISIONS.md`                                             |
