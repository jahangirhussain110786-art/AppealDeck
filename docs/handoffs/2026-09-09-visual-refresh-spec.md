# Visual system v3 — exact replacements for a premium AppealDeck (appearance only)

Written 9 Sep 2026 by the reviewing AI from the localhost audit `docs/handoffs/2026-09-09-visual-audit.md`. This document is the **design authority** for the visual refresh: every value below is final and copy-pasteable; the coding-agent prompt `docs/handoffs/2026-09-09-visual-refresh-prompt.md` sequences the work. Spec 06 (`Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md`) stays the parent spec; where this document is more specific, this document wins. Where spec 06 §2 said "brand redesign — not now", the founder's 9 Sep direction ("logo, icons, colour theme, fonts, spacing, layout … the appearance needs a lot of effort") supersedes it for the mark and the assets only (founder box A in the prompt).

## 0. Rules that bound every change

1. **Presentation only.** No new routes except metadata routes (`manifest.ts`, `apple-icon.tsx`), no engine or decision changes, no new dependencies. The single backend touch (aligning the decode API's notice markers with the client list) is founder-gated (prompt box C).
2. **D6 is the aesthetic.** No "guarantee", no percentages/hours/countdowns, no social proof, no reassurance copy, no exclamation marks, no celebration of a draft, no fake scarcity. `npm run lint:copy` must pass after every task.
3. **Calm authority (spec 06 §1).** One accent colour. Depth from surface tiers and tinted shadows, not borders on everything. Motion only for content the user requested, ≤ 320 ms, never on initial marketing paint beyond one stagger, never on controls.
4. **Every new user-facing string lives in `src/content/*.ts`** (AA-29). The strings this spec introduces are listed in §14 — copy them verbatim.
5. **Colour gate:** no hex or Tailwind palette colours in `src/components/**` (outside `ui/`). Static SVG files and `src/app/*` metadata routes may use the two brand hex values in §1.1.
6. **Contrast:** every text/background pair in §2 was checked at WCAG AA (≥ 4.5:1 for text under 18 px). Do not lighten a token without re-checking.
7. **Simplicity budget (spec 06 §1.1):** one primary action per screen, at most one secondary; ≤ 3 cards above the fold; ≤ 7 nav items; no modal for information.

---

## 1. Brand mark, wordmark, icons, social image

### 1.1 The one brand green
- Light UI and all static assets: **`#1C7D5E` = `hsl(161 64% 30%)`**. White text on it: 5.0:1.
- Dark UI primary: **`hsl(160 52% 62%)`** (mint, ≈ `#6CD0AF`) with near-black text `hsl(224 40% 8%)`: 10:1.
- Retire `#10b981` everywhere (`icon.svg`, `manifest`, `opengraph-image.tsx`).

### 1.2 The mark — "the deck, checked" (option E2, locked by the founder 9 Sep 2026)
Three sheets stepping back in perspective — the whole case file — with a check on the front sheet, on a rounded square in the brand green. Three sheets (not two) so it is never read as the generic "copy" icon; solid stepped tints (no translucent mud); reads at 16 px and scales to 512 px unchanged. Chosen from eleven candidates (`docs/handoffs/assets/2026-09-09-mark-options-v2.png`). Geometry on a 32-unit grid:

```svg
<!-- src/app/icon.svg — favicon; served automatically by Next (copy of public/brand/favicon.svg) -->
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#1C7D5E"/>
  <rect x="14" y="5.5" width="12" height="15" rx="2.6" fill="#FFFFFF" fill-opacity="0.38"/>
  <rect x="10.5" y="8" width="12.5" height="15.5" rx="2.6" fill="#FFFFFF" fill-opacity="0.66"/>
  <rect x="6.5" y="10.5" width="13.5" height="16.5" rx="2.8" fill="#FFFFFF"/>
  <path d="M9.9 19.4l2.8 2.8 5.3-5.8" fill="none" stroke="#1C7D5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### 1.3 React mark + wordmark (`src/components/Logo.tsx`, new)
The mark is brand-fixed (always the green square with white sheets, in both themes — identical to every exported asset in `public/brand/`); only the wordmark follows the theme. Needs the `--brand` token (§2) and the Tailwind `brand` colour (§5.0):

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <rect x="14" y="5.5" width="12" height="15" rx="2.6" className="fill-white opacity-[0.38]" />
      <rect x="10.5" y="8" width="12.5" height="15.5" rx="2.6" className="fill-white opacity-[0.66]" />
      <rect x="6.5" y="10.5" width="13.5" height="16.5" rx="2.8" className="fill-white" />
      <path
        d="M9.9 19.4l2.8 2.8 5.3-5.8"
        fill="none"
        className="stroke-brand"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? 36 : size === "sm" ? 24 : 28;
  return (
    <Link
      href={href}
      aria-label={SHARED.brand.name}
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <LogoMark size={px} />
      <span className={cn("font-semibold tracking-tight text-foreground", size === "lg" ? "text-xl" : "text-[1.0625rem]")}>
        Appeal<span className="text-primary">Deck</span>
      </span>
    </Link>
  );
}
```
Rules: one `<span>` for the wordmark (fixes the "Appeal Deck" gap); never letter-space the wordmark; minimum clear space = the mark's corner radius; never place the mark on a green background.

### 1.4 Apple icon and manifest — SUPERSEDED (9 Sep 2026, later): the assets are generated, see §1.6; do NOT build the routes below
The routes described in this subsection were the plan before the reviewing AI generated the static files. Static PNG/ICO/SVG files in `public/brand/` replace them; keep `public/manifest.webmanifest` (updated contents in `public/brand/README.md`).
`public/apple-touch-icon.svg` is not referenced by any tag and iOS does not accept SVG touch icons; `public/manifest.webmanifest` lists one 32 px SVG. Replace both:

```tsx
// src/app/apple-icon.tsx — Next serves /apple-icon as PNG and links it automatically
import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: 180, height: 180, display: "flex", background: "#1C7D5E", borderRadius: 40 }}>
      <svg width="180" height="180" viewBox="0 0 32 32">
        <rect x="12" y="6" width="13" height="16" rx="2.5" fill="#FFFFFF" fillOpacity="0.45" />
        <rect x="7" y="10" width="13" height="16" rx="2.5" fill="#FFFFFF" />
        <path d="M10.4 18.3l2.3 2.3 4.7-4.9" fill="none" stroke="#1C7D5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>,
    size,
  );
}
```

```ts
// src/app/manifest.ts — replaces public/manifest.webmanifest (delete it and the layout's manifest: field)
import type { MetadataRoute } from "next";
import { SHARED } from "@/content/shared";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SHARED.metadata.titleDefault,
    short_name: SHARED.brand.name,
    description: SHARED.metadata.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1C7D5E",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
```
`layout.tsx` `viewport.themeColor` stays split by scheme: light `#FFFFFF`, dark `hsl(224 28% 7%)`.

### 1.5 Open Graph image — SUPERSEDED: generated as `public/brand/og-1200x630.png` (see §1.6). The dynamic `opengraph-image.tsx` is deleted, not rewritten. The description below documents the layout that was produced.
1200 × 630, edge runtime. Background `#0D1017` with a radial glow `rgba(108,208,175,0.14)` centred top-left. Left column (x 80–620): mark 64 px + wordmark 56 px ("Deck" in `#6CD0AF`), tagline `SHARED.metadata.ogTagline` at 26 px `#E6E9F0`, sub-line `SHARED.metadata.ogSub` at 20 px `#9AA3B5`. Right column (x 680–1120): one card `#151A28` border `#26304A` radius 20 containing three rows that mirror the real decode result — a small "Policy violation" pill, a deadline row "Appeal window · 23 Sep · in 18 days" in tabular figures, and "Decoded in your browser · nothing sent" with a shield glyph. No photos, no people, no stock art.

### 1.6 Generated brand kit — inventory and placement (added 9 Sep 2026, later)
All assets exist in `public/brand/` (designed + rasterised by the reviewing AI; preview `docs/handoffs/assets/2026-09-09-brand-sheet.png`; generator `docs/handoffs/assets/brand-gen.js`). `public/brand/README.md` is the placement map; summary:

| Asset | Target | Wiring |
|---|---|---|
| `favicon.svg` | `src/app/icon.svg` | Next auto-links `<link rel="icon" type="image/svg+xml">` |
| `favicon.ico` (16/32/48) | `src/app/favicon.ico` | auto-linked; answers legacy `/favicon.ico` |
| `apple-icon-180.png` | `src/app/apple-icon.png` | auto-linked `<link rel="apple-touch-icon">` |
| `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | stay in `public/brand/` | referenced by `public/manifest.webmanifest` (contents in the README; `theme_color` `#1C7D5E`) |
| `og-1200x630.png` | `src/app/opengraph-image.png` + `src/app/opengraph-image.alt.txt` | auto-linked OG + Twitter image; delete `src/app/opengraph-image.tsx`; set `twitter.card: "summary_large_image"` in `layout.tsx` |
| `logo-horizontal-*.svg/.png`, `wordmark-*.svg`, `mark*.svg` | stay in `public/brand/` | brand kit for checkout, email, partners |

Delete `public/apple-touch-icon.svg` (never linked; invalid attributes). The in-app mark is the inline React `LogoMark` (§1.3), pixel-identical to `mark.svg`.

---

## 2. Colour tokens v3 (`src/app/globals.css` — replace the two colour blocks)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 224 32% 11%;
  --surface-1: 0 0% 100%;
  --surface-2: 220 20% 97%;
  --surface-inverse: 224 28% 10%;
  --brand: 161 64% 30%;
  --primary: 161 64% 30%;
  --primary-foreground: 0 0% 100%;
  --info: 221 72% 46%;
  --info-foreground: 0 0% 100%;
  --warning: 30 90% 36%;
  --warning-foreground: 0 0% 100%;
  --success: 152 58% 30%;
  --success-foreground: 0 0% 100%;
  --destructive: 0 68% 45%;
  --destructive-foreground: 0 0% 100%;
  --muted: 220 18% 95%;
  --muted-foreground: 220 9% 42%;
  --accent: 161 64% 30%;
  --accent-foreground: 0 0% 100%;
  --border: 220 16% 90%;
  --input: 220 16% 84%;
  --ring: 161 64% 34%;
  --shadow: 224 32% 11%;
  color-scheme: light;
}
.dark {
  --background: 224 28% 7%;
  --foreground: 220 18% 92%;
  --surface-1: 224 24% 10%;
  --surface-2: 224 22% 13%;
  --surface-inverse: 220 18% 96%;
  --brand: 161 64% 30%;
  --primary: 160 52% 62%;
  --primary-foreground: 224 40% 8%;
  --info: 217 85% 68%;
  --info-foreground: 224 40% 8%;
  --warning: 38 92% 62%;
  --warning-foreground: 30 90% 10%;
  --success: 152 52% 55%;
  --success-foreground: 152 80% 8%;
  --destructive: 0 70% 60%;
  --destructive-foreground: 0 0% 8%;
  --muted: 224 18% 15%;
  --muted-foreground: 220 10% 66%;
  --accent: 160 52% 62%;
  --accent-foreground: 224 40% 8%;
  --border: 224 16% 18%;
  --input: 224 16% 24%;
  --ring: 160 52% 62%;
  --shadow: 224 60% 2%;
  color-scheme: dark;
}
```

Contrast (text on the page background unless stated): light `foreground` 15.6:1 · `muted-foreground` 5.3:1 · `primary` 5.0:1 (also white on primary 5.0:1) · `info` 6.5:1 · `warning` 4.8:1 · `success` 5.4:1 · `destructive` 5.9:1. Dark: `foreground` 15:1 · `muted-foreground` 7.6:1 · `primary` 10:1 (navy on mint 10:1) · `info` 7.5:1 · `warning` 10:1 · `success` 9:1 · `destructive` 4.5:1 (near-black on it 6:1).

Semantic rules:
- `primary` = the one action colour and brand. Never for decoration larger than an icon tile.
- `info` = neutral callouts (gap-draft banner, "why Amazon wants this"). `warning` = caution the seller must read (idle lock, gated case, attempt novelty). `destructive` = errors and delete only. `success` = confirmed states only (evidence present, copied, saved).
- **Surface tiers:** page `background` → cards `surface-1` (+ `shadow-card`) → nested panels `surface-2` (no shadow) → inverse for tooltips and the one dark hero panel if ever used. Dark mode gets depth from tone (`surface-2` lighter than `surface-1`) and a 1 px `border-border`, never from shadows.
- **Tinted, never black shadows:** all `boxShadow` entries use `hsl(var(--shadow) / a)` (§5.0).
- Keep the compat aliases (`--card`, `--popover`, `--secondary`, `--radius`) unchanged.

### 2.1 Base-layer additions (same file)
```css
@layer base {
  body { font-feature-settings: "cv11", "ss03"; }          /* Inter: single-storey a, disambiguated 0/O and I/l — IDs and ASINs read unambiguously */
  h1, h2, h3, h4 { letter-spacing: -0.02em; }
  .lucide { stroke-width: 1.5; }                           /* one icon stroke everywhere */
  .marketing-surface {
    background-image: radial-gradient(60rem 30rem at 50% -10%, hsl(var(--primary) / 0.07), transparent 70%);
    background-repeat: no-repeat;
  }
  .dark .marketing-surface {
    background-image: radial-gradient(60rem 30rem at 50% -10%, hsl(var(--primary) / 0.10), transparent 70%);
  }
}
```
Remove the unused `body.bg-gradient` block.

---

## 3. Typography

### 3.1 Fonts (`src/lib/fonts.ts` — replace)
```ts
import { Inter, JetBrains_Mono } from "next/font/google";

// Variable Inter with the optical-size axis: display sizes get display letterforms automatically.
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});
```
(`adjustFontFallback` defaults to true — keep the default. `opsz` is present in this Next version's `font-data.json` for Inter — verified 9 Sep.)

### 3.2 Scale tokens (`globals.css`)
```css
--text-display: clamp(2.5rem, 1.6rem + 3vw, 3.75rem);
--text-h1: clamp(2rem, 1.4rem + 2vw, 2.75rem);
--text-h2: clamp(1.5rem, 1.2rem + 1vw, 1.875rem);
--text-h3: 1.25rem;
```
### 3.3 Tailwind `fontSize` (so the scale is usable as classes; `text-display` currently does nothing)
```ts
fontSize: {
  display: ["var(--text-display)", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "600" }],
  h1: ["var(--text-h1)", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "600" }],
  h2: ["var(--text-h2)", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
  h3: ["var(--text-h3)", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
  eyebrow: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "600" }],
},
```
Usage map: page h1 on marketing = `text-display` (home hero) or `text-h1` (pricing/faq/decode/legal); app page h1 = `text-h2`; section h2 = `text-h2`; card titles = `text-base font-semibold`; eyebrows = `text-eyebrow uppercase text-primary` (or `text-muted-foreground` inside cards); body `text-base leading-relaxed` for anything the seller must read, `text-sm` for supporting copy, `text-xs` only for metadata (dates, counts, legal strip). Headings `text-balance`; paragraphs `text-pretty` (global already). Mono only for pasted notice text, the POA body and code; tabular sans for every number (`data-tn` or `tabular-nums`), never `font-mono` on chips or counters.

Headline constraint: hero `h1` gets `max-w-[16ch] text-display text-balance`; sub-line `max-w-[46ch] text-lg leading-relaxed text-muted-foreground`.

---

## 4. Spacing, widths, containers

### 4.1 Width tokens → Tailwind `maxWidth`
Add `--w-tool: 52rem` to `:root` (decoder) and expose all tokens as classes:
```ts
maxWidth: {
  reading: "var(--w-reading)",   // 65ch  legal prose, FAQ column
  form: "var(--w-form)",         // 40rem auth cards, vault create/unlock
  tool: "var(--w-tool)",         // 52rem decoder, compose
  app: "var(--w-app)",           // 72rem app shell
  marketing: "var(--w-marketing)", // 80rem header, footer, home, pricing
},
```
Replace every `max-w-5xl/4xl/3xl/2xl/xl` on page and shell containers with one of these (audit A16). Horizontal padding is always `px-4 sm:px-6`.

### 4.2 Rhythm
Marketing sections: `py-16 sm:py-20 lg:py-24`; inside a section the eyebrow → h2 → sub-line stack is `gap-3`, then `mt-10 sm:mt-12` to the content. App pages: `py-8 sm:py-10`, cards `gap-6`. Everything sits on the 4 px grid; no `mt-1`/`mt-3` mixes in the same block.

### 4.3 `MarketingShell` (`src/components/MarketingShell.tsx`, new — replaces the repeated header/main/footer wrapper on `/`, `/pricing`, `/faq`, legal pages, `/decode`, `not-found`, `error`)
```tsx
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

const WIDTH = { marketing: "max-w-marketing", tool: "max-w-tool", reading: "max-w-reading", form: "max-w-form" } as const;

export function MarketingShell({ children, width = "marketing", className }: { children: ReactNode; width?: keyof typeof WIDTH; className?: string }) {
  return (
    <div className="marketing-surface flex min-h-svh flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className={cn("mx-auto w-full flex-1 px-4 sm:px-6", WIDTH[width], className)}>{children}</main>
      <SiteFooter />
    </div>
  );
}
```
### 4.4 `SectionHeading` (`src/components/SectionHeading.tsx`, new)
Props `eyebrow?`, `title`, `description?`, `align?: "left" | "center"`. Renders `<p class="text-eyebrow uppercase text-primary">` · `<h2 class="mt-3 text-h2 text-foreground text-balance">` · `<p class="mt-3 max-w-prose text-base text-muted-foreground">`.

---

## 5. Primitives (`src/components/ui/*`) — replace class strings as written

### 5.0 Tailwind config additions (`tailwind.config.ts`)
```ts
colors: { /* …existing entries… */ brand: "hsl(var(--brand) / <alpha-value>)" },   // fixed brand green for the mark (fill-brand / stroke-brand)
boxShadow: {
  card: "0 1px 2px 0 hsl(var(--shadow) / 0.06), 0 1px 1px -1px hsl(var(--shadow) / 0.04)",
  soft: "0 1px 3px 0 hsl(var(--shadow) / 0.08), 0 1px 2px -1px hsl(var(--shadow) / 0.06)",
  elevated: "0 24px 48px -24px hsl(var(--shadow) / 0.22), 0 2px 6px -2px hsl(var(--shadow) / 0.08)",
  "soft-lg": "0 24px 48px -24px hsl(var(--shadow) / 0.22)",   // compat alias, remove once unused
  inset: "inset 0 1px 0 hsl(var(--border) / 0.6)",
},
keyframes: {
  "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
  "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
  "zoom-in": { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
  "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
  "slide-out-right": { from: { transform: "translateX(0)" }, to: { transform: "translateX(100%)" } },
  "accordion-down": { from: { height: "0", opacity: "0" }, to: { height: "var(--radix-accordion-content-height)", opacity: "1" } },
  "accordion-up": { from: { height: "var(--radix-accordion-content-height)", opacity: "1" }, to: { height: "0", opacity: "0" } },
},
animation: {
  "fade-in": "fade-in var(--dur-base) var(--ease-out) both",
  "fade-up": "fade-up var(--dur-base) var(--ease-out) both",
  "zoom-in": "zoom-in var(--dur-base) var(--ease-out) both",
  "slide-in-right": "slide-in-right var(--dur-slow) var(--ease-out) both",
  "slide-out-right": "slide-out-right var(--dur-base) var(--ease-in-out) both",
  "accordion-down": "accordion-down var(--dur-base) var(--ease-out)",
  "accordion-up": "accordion-up var(--dur-base) var(--ease-out)",
},
```
Also `container.padding: { DEFAULT: "1rem", sm: "1.5rem" }`. The global reduced-motion rule already zeroes every animation.

### 5.1 Button
```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
        secondary: "bg-surface-2 text-foreground hover:bg-muted",
        outline: "border border-border bg-surface-1 text-foreground shadow-card hover:bg-surface-2",
        ghost: "text-foreground hover:bg-muted",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```
No translate on hover anywhere. `lg` is the CTA size on marketing pages and the interview bar.

### 5.2 Badge — tinted by default
```ts
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary",
        solid: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        info: "border-info/20 bg-info/10 text-info",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
      },
      size: { default: "px-2.5 py-0.5 text-xs", sm: "px-2 py-0 text-[0.6875rem]" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```
`SeverityBadge`, `CaseStateBadge`, `EvidenceStatusBadge` keep their variant maps (they now render tinted). `CaseStateBadge` for `POLICY`/`INTELLECTUAL_PROPERTY` uses `default` (tinted green) — fine.

### 5.3 Card
```
Card:            "rounded-lg border border-border/80 bg-card text-card-foreground shadow-card"
CardHeader:      "flex flex-col gap-1.5 p-6"
CardTitle:       "text-base font-semibold leading-snug tracking-tight text-foreground"
CardDescription: "text-sm text-muted-foreground"            (new export)
CardContent:     "p-6 pt-0 text-sm text-muted-foreground"
CardFooter:      "flex items-center gap-3 p-6 pt-0"
```
Remove `backdrop-blur-sm`. Nested panels inside cards use `rounded-md border border-border/70 bg-surface-2 p-4`, never another `Card`.

### 5.4 Input, Textarea, NativeSelect
Shared base (export it as `fieldClassName` from `ui/input.tsx`):
```
"flex w-full rounded-md border border-input bg-surface-1 text-sm text-foreground shadow-inset transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20"
```
Input adds `h-10 px-3 py-2`; Textarea adds `min-h-[7.5rem] p-3 leading-relaxed`; new `ui/native-select.tsx` wraps a `<select>` in `relative` with `appearance-none pr-9 h-10 px-3` and a `ChevronDown` (`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground`). Label: `text-sm font-medium text-foreground`, field spacing `space-y-1.5`, error text `text-xs text-destructive`.

### 5.5 DeadlineChip
Keep the tone logic. Classes: chip `inline-flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs` — remove `font-mono`; label `font-medium text-foreground`, date line `text-muted-foreground tabular-nums`; icon `size-4` in the tone colour (`text-info` / `text-warning` / `text-destructive`, neutral `text-muted-foreground`).

### 5.6 Alert
```tsx
const variants = {
  info: "border-info/25 bg-info/[0.07] [&>svg]:text-info",
  warning: "border-warning/30 bg-warning/[0.08] [&>svg]:text-warning",
  destructive: "border-destructive/30 bg-destructive/[0.07] [&>svg]:text-destructive",
  success: "border-success/30 bg-success/[0.08] [&>svg]:text-success",
} as const;
// Alert renders: <div role={variant === "destructive" ? "alert" : "status"} className={cn("relative flex items-start gap-3 rounded-lg border px-4 py-3 text-sm text-foreground [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", variants[variant], className)} {...props}>{children}</div>
// AlertTitle: "font-medium leading-snug text-foreground"   AlertDescription: "mt-1 text-sm text-muted-foreground [&_p]:leading-relaxed"
```
Delete the `React.Children.map` cloning. Callers keep passing an icon as the first child.

### 5.7 Tooltip
`"z-[var(--z-dropdown)] max-w-xs rounded-md bg-surface-inverse px-2.5 py-1.5 text-xs leading-snug text-background shadow-elevated animate-fade-in"`. Inverse surface, never `bg-muted`.

### 5.8 Skeleton, Progress, Separator
Skeleton `"animate-pulse rounded-md bg-muted"`. Progress root `h-2 rounded-full bg-muted`, indicator `h-full rounded-full bg-primary transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]`. Separator unchanged.

### 5.9 Accordion, Tabs, Table, Checkbox
- Accordion item `border-b border-border/80 last:border-0`; trigger `flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary [&[data-state=open]>svg]:rotate-180`; chevron `size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--dur-base)]`; content `overflow-hidden text-sm text-muted-foreground data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up` with inner `pb-4`.
- Tabs list `inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground`; trigger `rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-surface-1 data-[state=active]:text-foreground data-[state=active]:shadow-card`.
- Table head `h-11 px-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground`; row `border-b border-border/70 hover:bg-muted/40`; cell `p-4 align-middle`.
- Checkbox `size-5 rounded-sm border border-input bg-surface-1 shadow-inset data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`.

### 5.10 Sheet, Dialog, Toaster
- Overlay (both): `fixed inset-0 z-[var(--z-sheet)] bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-fade-in`.
- Sheet content (right): `fixed inset-y-0 right-0 z-[var(--z-sheet)] flex w-[min(20rem,85vw)] flex-col gap-6 border-l border-border bg-surface-1 p-6 shadow-elevated data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right`.
- Dialog content: `fixed left-1/2 top-1/2 z-[var(--z-dialog)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-1 p-6 shadow-elevated data-[state=open]:animate-zoom-in`. Close button `size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground`.
- Toaster: `richColors={false}`, `position="bottom-right"`, `duration={4000}`, `closeButton`, classNames `toast: "group toast group-[.toaster]:rounded-lg group-[.toaster]:border-border group-[.toaster]:bg-surface-1 group-[.toaster]:text-foreground group-[.toaster]:shadow-elevated"`, `description: "group-[.toast]:text-muted-foreground"`, `actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground"`, `cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"`.

---

## 6. Shell components

### 6.1 `AppHeader` (rewrite the render; logic stays)
- `<header class="sticky top-0 z-[var(--z-sticky)] border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">`, inner `mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6` with `max-w-marketing` (marketing) or `max-w-app` + `h-14` (app).
- **Behaviour is AM-21's (spec 07 §3.1), decided 10 Sep 2026 — restyle only.** Five slots in both states: Decode · Case · Dashboard · Vault · Pricing (signed out) / Billing (signed in). Signed out, the Vault pill carries `<Lock class="ml-1 size-3.5 text-muted-foreground" aria-hidden />` and a `Tooltip` `SHARED.nav.lockedHint`. The "Sign in" link keeps its `?next=<pathname>` on `/case`, `/dashboard`, `/vault`. The session-aware right cluster (`useSessionState`) on static pages stays.
- Left: `<Logo href={signedIn ? "/dashboard" : "/"} />`.
- Centre/right nav (`hidden md:flex items-center gap-1`, `aria-label={SHARED.nav.primary}`): pills `rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground`. No underlines.
- Right cluster `flex items-center gap-1.5`: `ThemeToggle` (icon button with `Tooltip` "Toggle colour theme" from content); signed out → `Button asChild variant="ghost" size="sm" class="hidden sm:inline-flex"` → `signInHref` `SHARED.nav.signIn`; signed in → `SignOutButton` (email in `text-xs text-muted-foreground hidden lg:inline`, icon button `size="icon-sm" variant="ghost"` with Tooltip `SHARED.nav.signOut`).
- Mobile: `Sheet` trigger `md:hidden` icon button `aria-label={SHARED.nav.openMenu}`; content `side="right"` with `SheetHeader`/`SheetTitle` `SHARED.nav.menu`, links `flex h-11 items-center rounded-md px-3 text-base font-medium hover:bg-muted aria-[current=page]:bg-muted`, then a divider and `Sign in` (signed out) as a full-width `outline` button.
- Nav labels come from `SHARED.nav.*` — the keys exist since AM-21 Task A1 (`primary, decode, case, dashboard, vault, pricing, billing, faq, signIn, signOut, menu, openMenu, themeToggle, lockedHint`); keep hrefs in the component.

### 6.2 `SiteFooter` (rewrite)
```
<footer class="border-t border-border/60 bg-surface-2/50">
  <div class="mx-auto grid max-w-marketing gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
    <div>
      <Logo size="sm" />
      <p class="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{SHARED.footer.tagline}</p>
    </div>
    <FooterGroup title={SHARED.footer.groups.product} links=[Decode /decode, Pricing /pricing, FAQ /faq] />
    <FooterGroup title={SHARED.footer.groups.legal} links=[Privacy, Terms, Refund] />
  </div>
  <div class="border-t border-border/60">
    <div class="mx-auto flex max-w-marketing flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-muted-foreground sm:px-6 md:flex-row md:items-start md:justify-between md:gap-8">
      <div class="max-w-3xl space-y-1.5"><p>{neverSubmits}</p><p>{independence}</p></div>
      <p class="shrink-0 tabular-nums">{copyright with the current year}</p>
    </div>
  </div>
</footer>
```
`FooterGroup`: `h3 class="text-eyebrow uppercase text-muted-foreground"`, `ul class="mt-4 space-y-2.5"`, links `text-sm text-foreground/80 hover:text-foreground` (no underline; underline on hover only). Nav labels from `SHARED.nav.*`, group titles from `SHARED.footer.groups.*`.

### 6.3 `AppShell`
`main` → `mx-auto w-full max-w-app flex-1 px-4 py-8 sm:px-6 sm:py-10`; breadcrumb `mb-6`. Match `src/app/(app)/loading.tsx` and `src/app/loading.tsx` skeleton headers to `h-14`/`h-16` and the new widths so nothing jumps.

### 6.4 `HonestExpectationsCard` v2 (extend, keep the old prop for compatibility)
Props: `summary`, `weDo?: readonly string[]`, `weDoNot?: readonly string[]`, `whatToDo?: readonly string[]` (legacy single list), `severityNote?`, `className?`. When `weDo`/`weDoNot` are given render:
```
<section class="rounded-lg border border-border/80 bg-surface-2 p-6">
  <div class="flex items-start gap-3"><Info class="mt-0.5 size-5 shrink-0 text-info" /><p class="text-sm leading-relaxed text-foreground">{summary}</p></div>
  <div class="mt-5 grid gap-6 sm:grid-cols-2">
    <div><p class="text-eyebrow uppercase text-muted-foreground">{GUIDANCE_LABELS.weDo}</p><ul class="mt-3 space-y-2">{weDo → <li class="flex gap-2.5 text-sm text-foreground"><Check class="mt-0.5 size-4 shrink-0 text-success"/>{item}</li>}</ul></div>
    <div><p class="text-eyebrow uppercase text-muted-foreground">{GUIDANCE_LABELS.weDoNot}</p><ul class="mt-3 space-y-2">{weDoNot → <li class="flex gap-2.5 text-sm text-muted-foreground"><Minus class="mt-0.5 size-4 shrink-0 text-muted-foreground/70"/>{item}</li>}</ul></div>
  </div>
  {severityNote && <p class="mt-4 text-xs text-muted-foreground">{severityNote}</p>}
</section>
```
Labels `SHARED.expectations.weDo` = "We do", `.weDoNot` = "We do not" (content). Callers on `/`, `/pricing`, dashboard and compose pass `GLOBAL_EXPECTATIONS.whatWeDo` / `.whatWeDoNot` separately; the decode result keeps the single-list form.

### 6.5 `EmptyState`, `Stepper`
- EmptyState: icon inside `grid size-12 place-items-center rounded-lg bg-surface-2 text-muted-foreground` (`size-6` icon), title `text-base font-semibold`, description `max-w-sm text-sm text-muted-foreground`, action `mt-1`.
- Stepper desktop rail: `size-6` circles, done state uses `<Check class="size-3.5" />`, skipped uses `<Minus class="size-3.5" />` (no text glyphs), a 1 px `bg-border` connector between circles (`before:` pseudo on each `li` except the first), current label `text-primary`, done `text-foreground`, todo `text-muted-foreground`. Mobile pill: `rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium tabular-nums`.

---

## 7. Pages — marketing shells

All marketing pages use `MarketingShell`. Section heads use `SectionHeading`.

### 7.1 `/` home (`src/app/page.tsx` + new `src/components/marketing/HeroArtifact.tsx`)
```
<section class="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
  <div>
    <p class="text-eyebrow uppercase text-primary">{HOME.hero.eyebrow}</p>
    <h1 class="mt-4 max-w-[16ch] text-display text-balance text-foreground">{HOME.hero.headline}</h1>
    <p class="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">{HOME.hero.subline}</p>
    <div class="mt-8 flex flex-wrap gap-3">
      <Button asChild size="lg"><Link href="/decode">{HOME.hero.primaryCta}<ArrowRight/></Link></Button>
      <Button asChild size="lg" variant="outline"><Link href="/pricing">{HOME.hero.secondaryCta}</Link></Button>
    </div>
    <p class="mt-5 text-sm text-muted-foreground">{HOME.hero.reassuranceLine}</p>   <!-- factual boundary line only: "Nothing you paste leaves your browser. You submit in Seller Central yourself." -->
  </div>
  <HeroArtifact />
</section>
```
`HeroArtifact` (aria-hidden, sr-only description kept): a `relative` wrapper with a static glow `absolute -inset-8 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl` behind a `Card class="overflow-hidden rounded-xl shadow-elevated"`:
- top bar `flex items-center justify-between border-b border-border/80 bg-surface-2/60 px-5 py-3`: `text-eyebrow uppercase text-muted-foreground` `HOME.hero.artwork.label` ("Decoded notice") + `<LocalFirstBadge />`;
- body `space-y-4 p-5`: row `<SeverityBadge severity="low"/> <CaseStateBadge kind="POLICY"/>`; `<p class="text-sm leading-relaxed text-foreground">{guidanceFor("POLICY").summary}</p>`; `<DeadlineChipList deadlines={HERO_DEADLINES} now={ARTIFACT_TODAY}/>`; a nested panel `rounded-md border border-border/70 bg-surface-2 p-4` with `text-eyebrow uppercase text-muted-foreground` `DECODE.result.doNow` and the first two `guidanceFor("POLICY").triage.doNow` items as `<li class="flex gap-2 text-sm"><Check class="mt-0.5 size-4 text-success"/>…</li>`.
Everything in the panel is real engine output (spec 06 §1.3 "product is the artwork"). Dates stay the fixed illustrative dates already in the file.

How it works: `SectionHeading eyebrow={HOME.howItWorks.eyebrow} title={HOME.howItWorksTitle} description={HOME.howItWorksSub}`; `ol class="mt-12 grid gap-6 md:grid-cols-3"`; each `li` is a `Card` whose header row is `<span class="grid size-8 place-items-center rounded-md bg-primary/10 text-sm font-semibold tabular-nums text-primary">{n}</span>` + lucide icon `size-5 text-muted-foreground`; title `mt-5 text-base font-semibold`; description `mt-2 text-sm leading-relaxed text-muted-foreground`. **Remove the "1. / 2. / 3." prefixes from `HOME.howItWorks.stepN.title`** — the number is rendered.

Expectations: `SectionHeading eyebrow={HOME.expectations.eyebrow} title={HOME.expectationsTitle}` then `HonestExpectationsCard` two-column.

Closing band: `section class="py-16 sm:py-20"` → `div class="rounded-xl border border-border/80 bg-surface-2 px-6 py-10 text-center sm:px-10"`: h2 `text-h2` `HOME.closing.title`, p `mt-3 text-muted-foreground` `HOME.closing.desc`, buttons row reusing `HOME.hero.primaryCta` (default) and `HOME.hero.secondaryCta` (ghost). Same action as the hero — not a second primary.

### 7.2 `/pricing`
- Hero grid `lg:grid-cols-[1fr_24rem] gap-12 py-16 lg:py-24`: left `text-eyebrow` `PRICING.pass`, h1 `text-h1` `PRICING.headline`, sub `PRICING.subline`; right **price card** `Card class="rounded-xl border-primary/30 shadow-elevated"` → `p.text-eyebrow uppercase text-primary` `PRICING.pass` · `div class="mt-3 flex items-baseline gap-2"` → `span class="text-display tabular-nums text-foreground"` `PRICING.price` + `span class="text-sm text-muted-foreground"` `PRICING.priceNote` · `p class="mt-4 text-eyebrow uppercase text-muted-foreground"` `PRICING.included` · `ul class="mt-3 space-y-2"` of the Pass-only rows `rows.poa/critic/replyAnalysis/devices/refund .feature` (AM-21: the vault and the interview are free with an account) with `Check` icons · `Button asChild size="lg" class="mt-6 w-full"` → `<a href="#purchase">{PRICING.jumpToPurchase}</a>` · `p class="mt-3 text-center text-xs text-muted-foreground"` `PRICING.trust.submit.desc`.
- Comparison table inside a `Card class="overflow-hidden p-0"`: **three** column headers `Free` / `Free account` / `Appeal Pass` (AM-21 — `th` keeps the visible text exactly; Playwright asserts the three `columnheader` names with `exact: true`); Pass column `bg-primary/[0.04]`; cell values: `Yes` → `<span class="inline-flex items-center gap-1.5 text-foreground"><Check class="size-4 text-success"/>{value}</span>`; text values (`First steps`, `Draft only`, `Yes, daily cap`) → `text-sm text-foreground`; `—` → `text-muted-foreground/60`. Row label `font-medium text-foreground`. Twelve rows (AM-21 spec 07 §7). **Delete the `PRICING.samplePoa.watermark` caption under the table** (B7).
- Trust grid `grid gap-4 sm:grid-cols-2`: `Card` with `div class="flex items-start gap-3"` → icon tile `grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary` (icons: `ShieldCheck`, `MonitorSmartphone`, `Lock`, `RotateCcw`) + `p class="text-sm font-medium text-foreground"` label + `p class="mt-1 text-sm text-muted-foreground"` desc. No badges.
- FAQ: `SectionHeading` + `Card class="px-6"` around `FaqAccordion`.
- Purchase: `section id="purchase"` → `Card` with `CardHeader` (`PRICING.purchaseTitle` + `CardDescription` `LEGAL.consent.deliveryNote`) and `PurchasePanel`: consent row (`Checkbox` + label `text-sm text-foreground`), then buttons row: primary `CheckoutButton size="lg"` or the disabled `outline` prompt, and the sample dialog trigger as `variant="link"`. Then `HonestExpectationsCard` two-column.

### 7.3 `/decode`
- `MarketingShell width="tool"`. Page head: h1 `text-h1` + sub `text-base text-muted-foreground max-w-prose`; `LocalFirstBadge` inline in the head row on `sm+`.
- Form `Card` (`p-6`): label row (`Label` + counter `text-xs tabular-nums text-muted-foreground` right-aligned, single line); `Textarea class="min-h-[14rem] font-mono text-sm leading-relaxed"`; helper line under it only when the sample is loaded (`Badge variant="info"` `DECODE.sampleBadge` + `Button variant="link" size="sm"` Clear); the "Before you decode" `Alert` renders **only when `text.trim().length >= 40 && likeness.hint`** (B12) and the small grey duplicate line is removed; actions row `Button lg` Decode + `Button variant="ghost"` Try a sample notice. No `motion.div` around buttons.
- Under the result card (AM-21, restyle only): the `CasePreview` panel — `rounded-lg border border-border/80 bg-surface-2 p-5`, `text-eyebrow uppercase text-muted-foreground` for its two headings, requirement rows with `Check`/`Minus` glyphs and a `Badge variant="secondary"` Required/Optional — followed by one `Button asChild size="lg"` → `/case?kind=<KIND>` (`APP.access.casePreview.startCta`) and `p class="mt-2 text-xs text-muted-foreground"` (`startNote`). This is the funnel's next step, not a second primary: the page's primary is Decode until a result exists, then this CTA.
- Result (`ResultView`): `Card` → header `flex flex-wrap items-center gap-3` (`SeverityBadge`, `CaseStateBadge`, `h2 class="text-h3"` `guidance.title`) · `p class="text-base leading-relaxed text-muted-foreground"` summary · `DeadlineChipList` · triage `grid gap-4 md:grid-cols-2` of two nested panels: "Do now" (`text-eyebrow text-success`, items with `Check`) and "Do not" (`text-eyebrow text-warning`, items with `Ban`) · `HonestExpectationsCard` · CTA panel `rounded-md border border-border/70 bg-surface-2 p-5` (`DECODE.result.ctaTitle`, `ctaDesc`, `Button size="sm"` → `/pricing`, `p.text-xs` `ctaNote`) · `CopyButton` for the summary in the header's right corner. Heading is an `h2`. Strings move to `DECODE.result.*` (§14).
- Empty state under the form: `EmptyState` inside a dashed panel `rounded-lg border border-dashed border-border p-8`.
- Sample notice: `src/content/sampleNotice.ts` exports the realistic fictional text in §14 (founder box B) instead of re-exporting the 167-character fixture (B1). The fixture stays for tests.
- Loading: skeleton shaped like the result card (badge row, two lines, two panels).

### 7.4 `/faq`
`MarketingShell width="reading"`, h1 `text-h1`, description; groups as `section` with `h2 class="text-eyebrow uppercase text-primary"` and a `Card class="mt-4 divide-y divide-border/70 p-0"` whose items are `div class="p-5"` → `h3 class="text-base font-medium text-foreground" id={slug}` + `p class="mt-2 text-sm leading-relaxed text-muted-foreground"`. Closing card reuses the existing CTA strings.

### 7.5 Legal pages (`LegalPage.tsx`)
`MarketingShell` with the grid `lg:grid-cols-[14rem_minmax(0,1fr)] gap-12`; prose column `max-w-reading`; h1 `text-h1`; "Last updated" as `Badge variant="secondary"` under the h1; TOC links `text-sm text-muted-foreground hover:text-foreground` with an `aria-current`/active class driven by `IntersectionObserver` (client sub-component `LegalToc`, `border-l-2 border-primary pl-3 text-foreground` when active).

### 7.6 Auth (`AuthCard.tsx` `AuthShell`)
Centre column `max-w-form` in `min-h-[calc(100svh-4rem)]`; `<LogoMark size={36} />` centred above the card with `mt-4 text-h3` title and `text-sm text-muted-foreground` sub-line; the `Card` gets `shadow-elevated p-8`; Google button `outline lg`, divider, fields with `space-y-4`; mode toggle as `Button variant="link" size="sm"`; footer prompt as before. Remove the 350 ms fade (spec cap); use `animate-fade-in` (200 ms) on the card only.

### 7.7 App pages (behind auth)
- Page heads (`dashboard`, `case`, `compose`, `vault`, `billing`): `div class="flex flex-wrap items-end justify-between gap-4"` → `h1 class="text-h2"` + `p class="mt-1 text-sm text-muted-foreground"`; right side holds contextual badges (`CaseStateBadge`, `LocalFirstBadge`).
- Dashboard: `ReadinessCard` shows the score as `span class="text-2xl font-semibold tabular-nums"` next to the label row above the `Progress` (still labelled exactly with `READINESS_COPY`); "Next best actions" card is the only card with a primary button; the two secondary cards (Amazon replied, Submitted) share a `grid gap-6 lg:grid-cols-2`. **Locked cards no longer exist (AM-21):** signed in without a Pass the dashboard is complete; signed out it renders the draft summary (state badge, chips, readiness, `CasePreview`, "Sign in to keep your case" as the only primary) or the teaching `EmptyState` (icon tile, three buttons: Decode / Start your case as `outline`, Sign in as default). Restyle these states; change no string or link.
- Signed-out and gate panels (AM-21, restyle only): `SignInGate` = `Card class="border-primary/30 bg-surface-2 p-6"` with `text-eyebrow` "Saved on this device", `text-h3` title, one paragraph, buttons row (default Sign in, outline Create an account); `CasePreview` = `surface-2` panel with two `SectionHeading`-style eyebrows, requirement rows `flex gap-2.5 text-sm` with `Check`(required, `text-success`) / `Minus`(optional, `text-muted-foreground/70`) glyphs and a `Badge variant="secondary"` for Required/Optional; `ComposeGate` = the compose page's only card: title `text-h2`, body, price line `text-2xl font-semibold tabular-nums`, `ConsentRow`, `CheckoutButton size="lg"`, activation state as an `Alert variant="info"` with a `Skeleton` line while polling; vault teaching state = `EmptyState` with `Lock` icon tile and two buttons.
- Case: drop the outer `Card` around `InterviewFlow`; the "how it works" panel becomes a nested `surface-2` panel above the stepper; the engine badge is a `Badge variant="secondary"`; the `CasePreview` column from AM-21 stays (`lg:grid-cols-[1fr_20rem] gap-8`; below the interview on small screens).
- Vault: remove the inner duplicated h2/subtitle (B9); toolbar row = search (`Input` with icon) + `NativeSelect` for evidence kind + icon buttons (`outline icon-sm` with tooltips); record rows `Card class="p-4"` with file icon tile `grid size-10 place-items-center rounded-md bg-surface-2`, name + `EvidenceStatusBadge`, meta line `text-xs tabular-nums text-muted-foreground`, actions `ghost icon-sm`, delete `ghost icon-sm text-muted-foreground hover:text-destructive` (no solid red per row).
- `EvidenceSlotPanel`: labels via `APP.evidenceKinds[req.kind]`; "attached" chip → `EvidenceStatusBadge status="present"`; all eight hard-coded strings → `APP.evidenceSlots.*`.
- Compose: back link as `Button variant="link"`; `PoaSection` header `flex items-start justify-between gap-4`; the critic aside `w-60 rounded-md border border-border/70 bg-surface-2 p-3`.
- Billing: unchanged structure; device cards on the new `Card` tokens.

### 7.8 System pages
`not-found.tsx` and `error.tsx` render inside `MarketingShell width="reading"` with a centred `EmptyState`-style block (icon tile, `text-h2`, one paragraph, one primary button + one ghost). `loading.tsx` skeletons match the header heights and widths (§6.3).

### 7.9 Dev gallery `/dev/ui`
Move the JSX into `src/app/dev/ui/DevUiGallery.tsx` with `"use client"` (fixes B3; `page.tsx` keeps `notFound()` in production and renders `<DevUiGallery />`). Add sections: Logo (sm/md/lg, light and dark strips), NativeSelect, HonestExpectationsCard two-column, HeroArtifact, SectionHeading, tinted vs solid badges, Alert quartet with icons, Tooltip on an inverse surface, Sheet/Dialog triggers (to check the new motion).

---

## 8. Motion (final rules)
- Allowed: `animate-fade-in`/`fade-up` on content the user requested (decode result, compose result, dialog/sheet panels, tooltip); accordion height; progress width; button press scale; theme colours never transition (`disableTransitionOnChange`).
- Forbidden: animating buttons/controls into view (remove the `motion.div` wrappers around the decode buttons and around the CTA panel); hover lift; anything > 320 ms (`login` fade 350 ms → 200 ms); decorative or looping motion; stagger on marketing paint beyond one `listStagger` of the decode result.
- Framer Motion stays only where `AnimatePresence`/layout animation is needed (interview step swap, vault list); everything else uses the CSS keyframes above.

## 9. Dark-mode checklist (verify in the gallery and on `/`, `/pricing`, `/decode`)
Header glass shows the page tint through it · cards separate from the page by tone, not glow · the mint primary is used for the CTA and the mark only (no mint text paragraphs) · tinted badges stay readable (≥ 4.5:1 — tokens in §2) · inputs have a visible edge (`--input` 24 % vs `--border` 18 %) · tooltips are light on dark · the hero glow is a soft mint halo, not a green block · toasts are `surface-1` on `background`.

## 10. Icons
lucide only. Sizes: `size-4` (16 px) inline with text and in buttons, `size-5` (20 px) in tiles and empty states, `size-6` only in the 404/error tile. Stroke 1.5 globally (§2.1). Icon-only buttons always have `aria-label` + `Tooltip`. Icon tiles: `grid size-8|9|10|12 place-items-center rounded-md bg-primary/10 text-primary` (brand) or `bg-surface-2 text-muted-foreground` (neutral). Replace `h-4 w-4` etc. with `size-*` as files are touched.

## 11. Acceptance — what the screenshots must show (prompt task V11 checks these)
1. Header: mark + single-word wordmark, pill nav with one active pill, theme toggle, Sign in; 64 px tall; content edge aligned with the hero and footer at 1280.
2. Hero: headline on ≤ 3 lines at 1280 (`text-display`, 16ch), sub-line ≤ 3 lines, two buttons, panel with badge row / summary / two chips / two do-now lines, soft glow behind it; the panel's height ≈ the text column's height.
3. How it works: three cards with numbered tiles, icons at one stroke, equal heights.
4. Expectations: two columns, check vs minus glyphs.
5. Footer: three columns + a bounded legal strip, no line longer than 65ch at 1280.
6. Pricing: price card on the right at 1280 (stacked first on mobile), Pass column tinted, check glyphs, no stray caption, trust tiles with icons, accordion in a card, purchase card with `id="purchase"`.
7. Decode: header and footer present; empty state dashed; hint appears only after typing; sample loads and **decodes**; result card with h2, two-tone triage panels, one CTA.
8. Dark mode of 1, 2, 6 and 7 with tokens from §2 — no `#10b981` anywhere (`grep -rn 10b981 src public` → 0).
9. `/dev/ui` renders without error and shows the new sections.
10. Lighthouse a11y 1.0 on `/`, `/pricing`, `/decode`, `/faq`, `/login` (existing gate).

## 12. AM-20 (draft for founder ratification — the prompt's Task V0 appends it once box A is ticked)
```markdown
### AM-20 — Visual system v3: brand mark v2, tokens v3, tinted semantics, hero-as-product, shell rebuild (ratified <DD> Sep 2026)

**Provenance:** founder direction 9 Sep 2026 ("premium, advanced appearance — logo, icons, colour theme, fonts, spacing, layout"); reviewing AI's localhost audit `docs/handoffs/2026-09-09-visual-audit.md` (2 P0, 15 P1, 27 P2) and spec `docs/handoffs/2026-09-09-visual-refresh-spec.md`.

**Scope guard:** presentation, assets and metadata routes only; strings in `src/content/*`; D6 unchanged; no engine changes. The decode API marker alignment (box C) is the only backend line and is a bug fix, not a feature.

**What changes:** one brand green (`#1C7D5E`) and a new mark ("deck with a check") generated as a complete kit in `public/brand/` (SVG/ICO/PNG favicons, 180 apple icon, 192/512/maskable manifest icons, static OG image, outlined horizontal logos) and wired into favicon, apple icon, manifest, OG image and header; colour tokens v3 with tinted semantic badges/alerts and tinted shadows; Inter variable with optical sizing; a Tailwind type scale wired to the fluid tokens; width tokens applied to every container; rebuilt header (pill nav on the five-slot AM-21 header, Sign in, mobile sheet) and footer (three columns + legal strip); primitives restyled (button, badge, card, alert, fields, tooltip, skeleton, accordion, sheet, dialog, tabs, table, checkbox, toaster) with real keyframes; home hero-as-product; pricing price card + table emphasis; decode page inside the marketing shell with a decodable sample; FAQ/legal/auth/system pages on the same system; app pages on the new primitives with the vault/dashboard/evidence fixes; dev gallery repaired.

**Copy:** value-first marketing copy per `docs/handoffs/2026-09-09-copy-deck.md` (founder direction 9 Sep: lead with what the seller gets; boundaries stated as control; who-decides stated once at the purchase point and in the FAQ; every D6 line kept).

- [ ] **AA-32** Visual refresh v3 per `docs/handoffs/2026-09-09-visual-refresh-prompt.md` Tasks V0–V11, evidence in `docs/handoffs/2026-09-09-visual-refresh.md`. — **Owner:** AI assistant (build), Founder (mark + sample-notice approval, screenshot sign-off) · **Cost:** $0 · **Deadline:** before first deploy · **Blocks:** M-W gate (rides the AM-18 gate).
```

## 13. Explicitly not in this pass (so nobody does it "while in there")
Illustration system · custom typeface purchase · command palette · onboarding tour · testimonials or logos wall · pricing toggles/plans · Tailwind v4 / OKLCH migration · Storybook · any new dependency (`tailwindcss-animate`, `@radix-ui/react-select`, `geist`) · animated backgrounds or 3D · SP-API, chat, or any AM-17 rejected item.

## 14. Strings to add (verbatim; all pass `lint-copy`)

> **Wording authority:** marketing wording is governed by `docs/handoffs/2026-09-09-copy-deck.md` (prompt Task V10, founder box D). This section lists the structural keys the layout needs; where a string below differs from the copy deck, the copy deck wins.

`src/content/shared.ts`
```ts
brand: { name: "AppealDeck" },
// nav.* EXISTS since AM-21 Task A1 (primary, decode, case, dashboard, vault, pricing, billing, faq,
// signIn, signOut, menu, openMenu, themeToggle, lockedHint) — do not re-add or rename.
footer: { …existing, groups: { product: "Product", legal: "Legal" }, copyright: "© {year} Hawlton" },
expectations: { weDo: "We do", weDoNot: "We do not" },
metadata: { …existing, ogTagline: "Decode your Amazon notice. Draft your POA. You submit yourself.", ogSub: "Free decoder in your browser. $199 one-time Appeal Pass." },
```
`src/content/marketing.ts`
```ts
HOME.hero.eyebrow: "For suspended and flagged Amazon sellers",
HOME.hero.reassuranceLine: "Nothing you paste leaves your browser. You submit in Seller Central yourself.",
HOME.hero.artwork.label: "Decoded notice",
HOME.howItWorks.eyebrow: "How it works",
HOME.howItWorks.step1.title: "Paste your notice",        // was "1. Paste your notice"
HOME.howItWorks.step2.title: "Get the plain-English result",
HOME.howItWorks.step3.title: "Draft your POA",
HOME.expectations.eyebrow: "Honest expectations",
HOME.closing: {
  title: "Start with the free decoder",
  desc: "Paste the notice. Read the plain-English result. Decide what to do next.",
},
PRICING.price: "$199",
PRICING.priceNote: "One-time. One case.",
PRICING.included: "Included",
PRICING.jumpToPurchase: "Continue to purchase",
DECODE.result: {
  doNow: "Do now",
  doNot: "Do not",
  ctaTitle: "Need more than the decoder?",
  ctaDesc: "The Appeal Pass drafts and critic-checks a full Plan of Action from your notice and evidence.",
  ctaNote: "No timers. No scarcity. Read the FAQ.",
  copySummary: "Copy plain-English summary",
  errorTitle: "Could not decode",
  errorFallback: "Something went wrong.",
  errorNetwork: "Network error. Try again.",
  errorHint: "Paste the full Amazon notice and try again.",
},
```
`src/content/app.ts` (`access.*` and `checkout.*` exist since AM-21 — keep them; add only the block below)
```ts
evidenceSlots: {
  title: "Required evidence",
  refresh: "Refresh",
  attach: "Attach",
  attached: "Attached",
  noneRequired: "No required evidence for this violation kind.",
  availableKinds: "Available kinds: {kinds}",
  encryptedNote: "Files are encrypted on this device before being saved to the vault.",
  openVault: "Open the vault",
},
```
`src/content/sampleNotice.ts` — **founder box B** — replace the fixture re-export with this fictional, generic notice (mentions Amazon, Seller Central, ASIN, notice, policy → passes both marker lists; uses only the appeal window the FAQ already states):
```
Subject: Notice of account deactivation — action required

Hello,

Your Amazon seller account has been deactivated. Your listings have been removed and funds in your account are on hold while we review your account.

Why is this happening?
We have taken this action because your account has repeated violations of our policies on listing practices and product condition. For example, ASIN B0EXAMPLE1 was listed as new while customers reported receiving used items, and detail pages contained claims we could not verify.

How do I reactivate my account?
To appeal, submit a Plan of Action in Seller Central that explains the root cause of the violations, the actions you have taken to resolve them, and the steps you have taken to prevent them going forward. Include supporting documents, such as supplier invoices for the ASINs listed above.

You can appeal within 90 days of this notice from Account Health in Seller Central.

Amazon.com Seller Performance
```
Keep the sample clearly labelled by the existing `DECODE.sampleBadge` ("Sample notice — not yours").
