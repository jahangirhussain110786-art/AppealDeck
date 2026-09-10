# 2026-09-09 — Visual & UX audit of the live UI on localhost (appearance only)

Reviewing AI, 9 Sep 2026 (evening). Working tree at `7051682` (fix pass F0 committed; F1 in progress by the coding AI). Method: `npm run dev` on `localhost:3000`, every public route captured full-page at **1280 px light**, **1280 px dark** and **375 px light**; the decoder driven end to end with the built-in sample; the dev design gallery `/dev/ui` opened; every design-system file read (`globals.css`, `tailwind.config.ts`, `fonts.ts`, `layout.tsx`, all of `src/components/ui/*`, header, footer, every page). Authenticated pages (`/dashboard`, `/case`, `/compose`, `/vault`, `/billing`) were audited from code and the primitives they use — the reviewing AI does not log in.

Companion documents: plain-language guide `docs/handoffs/2026-09-09-visual-refresh-plain-guide.md` · design spec with exact replacements `docs/handoffs/2026-09-09-visual-refresh-spec.md` · coding-agent prompt `docs/handoffs/2026-09-09-visual-refresh-prompt.md`.

## 1. Verdict

The bones are right (tokens, primitives, reduced motion, dark mode, honest copy) but the surface reads as a default component kit: one narrow container everywhere, a heavy solid-badge style, a thin generic header, a footer that looks like an afterthought, a hero whose "product artwork" is a small flat card floating in empty space, tables and lists with no hierarchy, and a brand mark whose colour does not match the UI. Nothing looks broken at a glance; nothing looks designed either. Six functional defects surfaced while looking (§2) — the first one blocks the free funnel's demo path and must be fixed before any deploy.

## 2. Blockers found while inspecting (not cosmetic)

| ID | Severity | What happens | Evidence | Root cause | Fix |
|---|---|---|---|---|---|
| B1 | **P0** | **"Try a sample notice" → Decode fails** with "Could not decode — This doesn't look like an Amazon notice." | Driven on `/decode`: sample inserted (167 chars), submit → 422 Alert | `src/content/sampleNotice.ts` re-exports fixture `policy-1` (`src/core/fixtures.ts`, 167 chars, mentions neither "Amazon" nor "notice"). `src/app/api/decode/route.ts:7–20` requires ≥ 2 hits from a 6-marker list (`amazon, seller central, asin, notice, policy, account health`) → 1 hit → rejected. The client-side `src/lib/noticeLikeness.ts` uses a different 22-marker list and shows no warning, so the seller is told nothing is wrong until the server says no. | Spec §8.3 / prompt V7: replace the sample with a realistic full-length fictional notice (founder box C) and align the two marker lists |
| B2 | **P0** | **`/decode` has no header, no logo, no footer, no way back** — the main free-funnel page is a bare form | 1280 and 375 screenshots | `src/app/decode/page.tsx` renders `DecodeClient` without `AppHeader`/`SiteFooter` | Spec §7.3 / prompt V7: wrap in `MarketingShell` |
| B3 | **P1** | **`/dev/ui` (design-system gallery) crashes** — "This page hit an error" | Console: `Functions cannot be passed directly to Client Components … icon Inbox` | `src/app/dev/ui/page.tsx` is a server component passing `icon={Inbox}` to the client `EmptyState` | Prompt V10: move the gallery body into a `"use client"` file |
| B4 | **P1** | **Apple touch icon renders with 1 px hairlines** | `public/apple-touch-icon.svg:3–5` | JSX attribute names (`strokeWidth`, `strokeLinecap`) in a static SVG file — invalid, browsers ignore them | Spec §1 / prompt V2: new icon set with correct attributes |
| B5 | **P1** | **Wordmark shows as "Appeal Deck" with a gap** on every page | All screenshots | `AppHeader.tsx:27–32`: `Appeal` and `<span>Deck</span>` are separate flex children, so `gap-2` is inserted between them | Spec §1.4 / prompt V2 |
| B6 | **P2** | Brand green is three different greens | `icon.svg`/manifest/OG use `#10b981` (emerald-500); UI `--primary` is `hsl(160 70% 30%)` ≈ `#17825E`; dark primary mint | Assets were hand-coloured | Spec §1 + §2: one brand green (`#1C7D5E`, `hsl(161 64% 30%)`) everywhere |
| B7 | P2 | Pricing table is captioned **"ILLUSTRATIVE — not a real appeal"** — that is the sample-POA dialog's watermark, under the wrong element | `pricing/page.tsx:75` | Copy-paste | Prompt V6: remove |
| B8 | P2 | Locked dashboard cards render a `Lock` icon with `absolute top-4 right-4` on a card that is not `relative` — the icons escape the card | `DashboardClient.tsx:245,256` | Missing `relative` | Prompt V9 |
| B9 | P2 | `/vault` prints its title and subtitle twice (page wrapper h1 + `VaultView` h2) | `vault/page.tsx:37–38` + `VaultView.tsx:231–232` | Duplicate | Prompt V9 |
| B10 | P2 | Accordion, Sheet and Dialog carry animation classes (`animate-accordion-down`, `animate-in`, `zoom-in-95`, `fade-out-none`) that **do not exist** — `tailwindcss-animate` is not installed and no keyframes are defined, so panels snap open with no motion | `ui/accordion.tsx:50`, `ui/sheet.tsx:39`, `tailwind.config.ts` (only `fade-up`) | Copied classes without the plugin | Spec §9 / prompt V1+V3: define keyframes in the Tailwind config |
| B11 | P2 | Gallery uses `text-display` which is not defined anywhere (renders as body size) | `dev/ui/page.tsx:83`; `tailwind.config.ts` has no `fontSize` entries | Token exists as a CSS var only | Spec §3: fontSize scale in Tailwind |
| B12 | P2 | "Before you decode" hint appears **twice** while the textarea is still empty (a small grey line under the box and a blue Alert) | `/decode` screenshots; `DecodeClient.tsx:149–164` | Likeness hint fires at length 0 | Prompt V7: show once, only after ≥ 40 characters |

## 3. Findings by aspect

Severity: **P0** blocks deploy · **P1** visibly poor to every visitor · **P2** polish. Each finding names the spec section that replaces it (S) and the prompt task that ships it (V).

### 3.1 Brand mark, logo, icons
- **A1 · P1** The mark is a green square with three lines and a magnifier — a generic "document search" glyph; at 16 px it reads as a blob. It does not say "appeal" or "deck". → S1: a two-sheet "deck" with a check, tuned for 16/32/180 px.
- **A2 · P1** Wordmark gap (B5); "Deck" coloured green while the mark's green differs (B6).
- **A3 · P2** Icon family is lucide (good) but sizes are mixed: `h-4 w-4` ×16, `size-4` ×9, `size-3`, `h-3 w-3`, `h-3.5 w-3.5`, `h-5 w-5`, `h-6 w-6`, and stroke width is lucide's default 2 px everywhere — spec 06 §1.1 says one stroke (1.5 px) at 16/20 px. → S11: global `.lucide { stroke-width: 1.5 }` and two sizes.
- **A4 · P2** `manifest.webmanifest` lists only a 32 px SVG icon; no 192/512 PNG, so "Add to home screen" shows a letter tile on Android. → S1.6.
- **A5 · P2** OG image: dark card with mark + tagline, `#a1a1aa` grey text, no product. → S1.7: mark + wordmark + one decoded-notice card, brand colours.

### 3.2 Colour
- **A6 · P1** Badges are solid saturated pills with white text (`bg-info text-info-foreground`, `bg-warning`, `bg-destructive`). On the pricing "trust" cards four royal-blue solid badges act as headings — the loudest thing on the page. → S5.2: tinted badges (`bg-tone/10 text-tone border-tone/20`), solid reserved for the primary CTA.
- **A7 · P1** Light mode has no depth: `--surface-2` (96 %) is barely distinguishable from white, shadows are near-invisible, every panel relies on a 1 px `#e2e6ec` border → "wireframe" look. → S2: surface-2 at 97 % with a warmer tint, tinted shadows (`--shadow` token), cards `shadow-card`, hero panel `shadow-elevated`.
- **A8 · P2** Dark mode is a straight inversion: `--surface-2` (14 %) vs background (6 %) is right in principle, but borders at 16 % lightness vanish and the mint primary at 71 % saturation glows. → S2.2: borders 18 %, primary `160 52% 62%`, `--input` lighter than `--border`.
- **A9 · P2** Tooltips use `bg-muted` (light grey on white) — they read as disabled boxes. → S5.7: inverse surface.
- **A10 · P2** Sonner `richColors` paints toasts in its own green/red, off-brand. → S5.10.
- **A11 · P2** `body.bg-gradient` (a primary radial tint) is defined and never used — marketing pages are flat white. → S4.4: `MarketingShell` applies a restrained top glow.

### 3.3 Typography
- **A12 · P1** Two competing scales: CSS tokens `--text-display/h1/h2/h3` exist but pages use ad-hoc Tailwind sizes (`text-lg` ×16, `text-2xl` ×10, `text-3xl` ×6, `text-xl` ×5, `text-4xl` ×3, `text-5xl` ×1). The hero uses `text-4xl sm:text-5xl` and wraps to four ragged lines at 1280 px ("today. Draft a / Plan of Action / Amazon can act on."). → S3: Tailwind `fontSize` entries `display/h1/h2/h3/eyebrow` wired to the tokens; hero on `text-display` with `text-balance` and `max-w-[14ch]`-class constraints.
- **A13 · P2** Inter is loaded with fixed weights 400–700 and `adjustFontFallback: false`; the variable font's `opsz` axis (available in this Next version — verified in `font-data.json`) is unused, so large headings use text-optimised letterforms. → S3.1: `axes: ["opsz"]`, `adjustFontFallback: true`, `font-feature-settings: "cv11", "ss03"`.
- **A14 · P2** Section eyebrows/kickers do not exist; every section starts with a bare h2. Footer and legal "last updated" text at 12 px grey run edge to edge. → S3.3 + S6.
- **A15 · P2** Tabular numerals are applied globally on `body` (fine) but `DeadlineChip` and the character counter also set `font-mono` — mono for prose-adjacent numbers looks like a terminal. → S5.5: tabular sans, mono only for pasted notice text and the POA body.

### 3.4 Spacing, widths, layout
- **A16 · P1** Width tokens exist (`--w-reading 65ch`, `--w-form 40rem`, `--w-app 72rem`, `--w-marketing 80rem`) but pages use `max-w-5xl` ×11, `max-w-3xl` ×5, `max-w-2xl` ×3, `max-w-4xl`, `max-w-xl`, and the token once. Header, footer and content do not share an edge (header container `max-w-5xl`, FAQ `max-w-3xl`, decode `max-w-3xl` with different padding). → S4: one `PageContainer` per width token; header/footer on `--w-marketing`.
- **A17 · P1** Vertical rhythm is `py-16` + `mt-12`/`mt-16` with no eyebrow spacing; the hero grid is `items-start`, leaving the right column two-thirds empty under the small card. → S8.1.
- **A18 · P2** Cards use `p-5` and `pt-5`/`pt-6` inconsistently; `Card` carries `backdrop-blur-sm` on every instance (cost, no benefit). → S5.3.
- **A19 · P2** Mobile: pricing table squeezes "with the Appeal Pass at launch" into a 90 px column; the decode counter wraps to two lines ("0" / "characters"). → S8.2 / S8.3.

### 3.5 Header and navigation
- **A20 · P1** Marketing header: three tiny always-underlined links (`underline underline-offset-2` on every nav link), no "Sign in" — a paying seller cannot find the app from the marketing site; the theme toggle sits between nav and menu. → S6.1: pill nav with active state, "Sign in" ghost button, 64 px bar, `--w-marketing`.
- **A21 · P2** Mobile Sheet nav: links only, no title, `pt-10`, `w-64`, overlay `bg-background/80` (washes the page instead of dimming it). → S6.1.
- **A22 · P2** App header shows the email in 12 px grey next to an icon-only sign-out with no tooltip. → S6.1.

### 3.6 Footer
- **A23 · P1** One 12 px row (tagline + four underlined links) plus two full-width 12 px disclaimer lines with `px-4` and no max width — on 1280 px the independence line spans 1200 px. → S6.2: brand column + Product/Legal columns + bounded legal strip.

### 3.7 Components
- **A24 · P1** Buttons: `hover:-translate-y-0.5` lift on primary/secondary/destructive (spec 06 §5 forbids hover-lift theatre), `rounded-lg` (14 px) on a 40 px control, `font-semibold`. → S5.1: `rounded-md`, colour-shift hover, `font-medium`, `active:scale-[0.985]`, `link` variant added.
- **A25 · P2** Inputs/textarea: `bg-background` with a 1 px `--border` — in light mode the field edge is nearly the same value as card borders, so forms have no figure/ground. → S5.4: `bg-surface-1`, `--input` one step darker, hover border, 2 px ring at 40 % alpha.
- **A26 · P2** Alert clones every child and re-applies `text-foreground` (odd, and it strips callers' colour classes); `role="alert"` on informational banners announces them as urgent. → S5.6.
- **A27 · P2** Skeleton has no pulse; `Progress` indicator has no eased transition; native `<select>` in the vault is unstyled (`rounded-md border px-2 py-1`). → S5.8, S5.9.
- **A28 · P2** `HonestExpectationsCard` is a grey box with an info icon and a seven-bullet list; "we do" and "we do not" are indistinguishable. → S6.4: two columns with check/minus glyphs.
- **A29 · P2** `EmptyState` icon at 40 px 50 % grey with no container; `Stepper` uses text glyphs (`✓`, `—`) instead of icons. → S6.5.

### 3.8 Motion
- **A30 · P2** Accordion/Sheet/Dialog have no working animation (B10); `DecodeClient` animates the **Decode button itself** in on mount (`motion.div` with `y: 4`) and the CTA card twice; `login` fades the form in over 350 ms (spec cap 320 ms). → S9: content-only enters at 200 ms, no control enters, keyframes for Radix panels.

### 3.9 Page by page (what the screenshots show)
- **A31 · `/` · P1** Hero: four-line headline, subline, two buttons, small card top-right, blank column below it. How-it-works: three identical cards, number baked into the title string ("1. Paste your notice"), 40 px icon tiles. Expectations: one grey box. No closing section; footer follows. → S8.1: hero-as-product (decoded-notice panel with summary, chips and a "do now" list — all real engine output), numbered step rail, two-column expectations, quiet closing CTA band.
- **A32 · `/pricing` · P1** Headline "Appeal Pass — $199 one-time" then an unstyled full-width table with "Yes"/"—" text, the stray watermark caption (B7), four solid-blue badge cards, an accordion, a purchase card with a disabled outline button reading "Select the consent to continue" and a ghost "View a sample Plan of Action", then the expectations box. No price card, no emphasis on the Pass column, no icons. → S8.2.
- **A33 · `/decode` · P0/P1** No shell (B2); duplicated hint (B12); sample fails (B1); result view (from code) is a stack of Alerts with the same tint for "Do now" and a warning tint for "Do not", plus a CTA card and a copy button at the very bottom. → S8.3.
- **A34 · `/faq` · P2** Definition list on `max-w-3xl`, group headings as bare h2, answers in 14 px grey; no anchors; CTA card. → S8.4.
- **A35 · `/terms` `/privacy` `/refund` · P2** Prose with sticky TOC works; "Last updated" 12 px; TOC has no active state; content column starts at `max-w-5xl` grid `220px_1fr` so the prose measure varies. → S8.5.
- **A36 · `/login` `/signup` `/forgot-password` · P2** Card centred in `min-h-screen` under the marketing header (double height on tall viewports), no logo above the card, "Use a magic link instead" as a bare primary-coloured link, no footer. → S8.6.
- **A37 · App pages (from code) · P1/P2** `AppShell` at `max-w-5xl py-12`; dashboard is a vertical stack of five equal cards with 16 px titles; the readiness `Progress` has no label row; `/case` wraps the whole interview in a card inside a card; `/vault` duplicate heading (B9), unstyled select, a solid red delete button per row (heaviest element on the page), icon-only outline buttons for view/download; `EvidenceSlotPanel` prints raw enum keys as labels (`supplier_invoice` → "supplier invoice") and hard-codes eight strings; `/billing` device cards fine; `ComposeView` back-button is a ghost `Button` with `pl-0`. → S8.7.
- **A38 · `not-found` / `error` / `loading` · P2** No header/footer, left-aligned 12 px labels; root `loading.tsx` skeleton header is 56 px while the real header will be 64 px (layout jump). → S8.8.

### 3.10 Accessibility notes seen in passing
- Nav links rely on underline + colour only for active state (fine) but the theme toggle has no visible focus ring in dark mode against `bg-background/60`.
- Icon-only buttons in the vault have `aria-label` ✓; `SignOutButton` has `aria-label` ✓ but no tooltip.
- Decode result heading is a `span` next to the badge, not an `h2`. → S8.3.

## 4. What is already good — keep it
Token architecture (HSL vars + Tailwind alpha), class-based dark mode with `disableTransitionOnChange` semantics, reduced-motion global rule, `MotionConfig reducedMotion="user"` + `LazyMotion`, skip link, `aria-current` on nav, tabular numerals, `text-balance/pretty`, all copy in `src/content/*`, the lint-copy colour gate, `DeadlineChip` tooltips carrying the rule, `LocalFirstBadge` with a verifiable claim, `HonestExpectationsCard` placement before checkout, the sticky interview bar with `env(safe-area-inset-bottom)`, one `AppHeader` for both modes, `LegalPage` TOC.

## 5. Counts

| Severity | Count | Where |
|---|---|---|
| P0 | 2 | B1 sample decode fails · B2 decode page has no shell |
| P1 | 15 | B3–B5, A1–A2, A6–A7, A12, A16–A17, A20, A23–A24, A31–A33, A37 |
| P2 | 27 | remainder |

Every item above has a replacement in the spec and a task in the prompt. Nothing here reopens D1–D10 or AM-16–19; the brand mark and the sample-notice text are the two items the founder must tick before the coding AI starts (prompt banner).
