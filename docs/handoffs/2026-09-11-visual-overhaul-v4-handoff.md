# 2026-09-11 — Visual overhaul v4: locked plan for a fresh session

**Status: PLANNING ONLY. No application code has been changed by this document.** The founder approved the design direction below and asked for it to be locked in as the next working step, then said explicitly: *"not now"* — implementation happens in a future session, starting from this file. This session only wrote docs, copied the approved mockup source into the repo, and committed/pushed.

---

## 0. Answer to the founder's direct question

> *"are we using a unified color theme file etc? if we update that and all other will look updated? or we have hardcoded colors and appearance etc into each file independently into our real project?"*

**Yes — the real app already has one unified token file.** There is no hardcoded-per-file color/appearance problem in the real codebase:

- **`src/app/globals.css`** is the single source of truth. It defines every color as an HSL CSS custom property on `:root` (light) with a `.dark { }` override block (dark mode), plus a radius scale (`--radius-sm/md/lg/xl` = 6/10/14/20px), width tokens (`--w-reading/form/tool/app/marketing`), fluid type tokens (`--text-display/h1/h2/h3`), and motion tokens (`--dur-*`, `--ease-*`).
- **`tailwind.config.ts`** maps every one of those CSS variables to a Tailwind color/radius/font/shadow name (`bg-primary`, `text-foreground`, `rounded-lg`, `shadow-elevated`, …). Every component in `src/` is written against these Tailwind classes, never a raw hex.
- **`src/lib/fonts.ts`** loads the real typefaces via `next/font/google` (Inter for `--font-sans`, JetBrains Mono for `--font-mono`) and wires them into the same CSS-variable system.
- **`src/components/ui/*`** (Badge, Card, Button, Alert, Skeleton, Tabs, Dialog, …) are shadcn-style primitives already built on those tokens.

**Practical consequence: changing `globals.css` + `tailwind.config.ts` centrally cascades everywhere** — every page and component picks it up automatically, with zero per-file hunting. This is exactly the "update once, everything updates" architecture the founder was hoping for, and it is why the plan below is written as *token changes first, then component/page work*, not the other way around.

The **only place hardcoded, per-file hex values exist** is the four `.dc.html` design-mockup files built this session for the visual-direction-v2 approval pass (see §2) — those are a deliberately self-contained static-HTML mockup format (Claude's "Design Components" canvas tool), completely disconnected from the real app's build. That disconnection is *why* small inconsistencies crept in between the four mockup files during iteration (each one owns its own copy of every value) — it is not a property of the real codebase, and the plan below exists specifically so the real overhaul does not repeat that mistake: every value gets set once, in the token file, and every real component already inherits from there.

---

## 1. What the founder approved

Across several iterations this session (fixing copy/data accuracy errors, adding real custom illustrations in place of stock photos, fixing font choice, fixing two specifically-flagged bad elements, and fixing cross-artboard consistency), the founder signed off on a new visual direction — inspired by Stripe Atlas / Ironclad / 1Password / Linear (*"inspired," never cloned*) — and said:

> *"everything else looks great... i would like to overhaul our entire application in all means to look even strong, perfect, well designed masterpiece."*
> *"if you want to enhance and improve these further you can do from the sites you are inspired, while also considering our brand's authenticity, quality, premium feel, and everything professionally and perfectly."*

**Approved reference artifact (published, view/export only — does not persist mockup edits across sessions, treat as a snapshot):**
~~https://claude.ai/code/artifact/020b42eb-325e-412d-a378-8838d1917a1e~~ — **dead 12 Sep 2026** (returns "not found" — likely tied to the authoring session's own account/context, not this repo). Superseded by the republished canvas below, which now includes a fifth artboard.

**Republished reference artifact (12 Sep 2026, adds the Login artboard + a typography sweep):**
https://claude.ai/code/artifact/a1305de4-04bf-4dc4-a2f6-658cd62c1337

**Approved mockup source, copied into this repo so a fresh session has it without depending on this session's temp scratchpad** (the scratchpad directory a Claude session uses does *not* survive to a new session — copying these in was necessary, not optional):
- [docs/handoffs/2026-09-11-visual-direction-v2-mockup/Main.dc.html](2026-09-11-visual-direction-v2-mockup/Main.dc.html) — home hero + "how it works"
- [docs/handoffs/2026-09-11-visual-direction-v2-mockup/Interview.dc.html](2026-09-11-visual-direction-v2-mockup/Interview.dc.html) — split-screen guided interview
- [docs/handoffs/2026-09-11-visual-direction-v2-mockup/Decode.dc.html](2026-09-11-visual-direction-v2-mockup/Decode.dc.html) — annotated decode result
- [docs/handoffs/2026-09-11-visual-direction-v2-mockup/Vault.dc.html](2026-09-11-visual-direction-v2-mockup/Vault.dc.html) — obsidian vault surface
- [docs/handoffs/2026-09-11-visual-direction-v2-mockup/Login.dc.html](2026-09-11-visual-direction-v2-mockup/Login.dc.html) — **added 12 Sep 2026**: sign-in split-screen, right panel a framed product-preview mock (labelled sample data, not a real screenshot — see §2.8)
- [docs/handoffs/2026-09-11-visual-direction-v2-mockup/canvas.json](2026-09-11-visual-direction-v2-mockup/canvas.json) — layout manifest for re-seeding the canvas if further mockup edits are wanted

Each `.dc.html` is a plain static HTML file (view it directly in any browser) — open it to see the exact approved markup, not just this document's description of it.

### 12 Sep 2026 addendum — real screenshots + typography, answered in chat

The founder asked two things directly: (1) should product screenshots be used the way Apollo/Linear/Stripe use them (e.g. on the login page), and (2) should font sizing/hierarchy get explicit attention across the whole app. Both were answered and acted on in this pass — see §2.8 and §2.9 below for what changed and why. Net effect: a new Login artboard, and an eyebrow-label/button type-scale sweep across all five screens (three different eyebrow sizes found — 12px/12.5px/11.5px with two different letter-spacings — unified to one).

**Important limitation to disclose to the founder before implementation starts:** live site-browsing (Linear, Stripe, Ironclad, etc.) was blocked for most of this session, so the later refinement rounds (font choice, consistency fixes) were reasoned from earlier-session observations and first-party design judgment, not fresh live inspection. If a fresh session has working browser access, it is worth a quick re-look at the inspiration sites before finalizing font/spacing choices below — nothing here is so locked that a small justified adjustment should be blocked.

---

## 2. What the mockup actually decided (source of truth for implementation)

### 2.1 Typography
- **Inter** stays the single primary UI/body typeface — **already loaded in the real app** (`src/lib/fonts.ts`, `--font-sans`). No change needed here beyond weight range if the overhaul wants 800-weight display headlines (currently only default Inter weights are pulled in via variable font `axes: ["opsz"]`, which should already cover it — verify.)
- **NEW: Newsreader**, italic, weight 500, as a serif *accent* — used for exactly one word per major headline (e.g., "Understand your Amazon notice **_today._**", "From notice to **_plan_** in three steps"). This is **not loaded in the real app yet**. Add it in `src/lib/fonts.ts` via `next/font/google` (`Newsreader`, `style: ["italic"]`, `weight: ["500"]`, `variable: "--font-accent"`), wire `--font-accent` into `globals.css`/`tailwind.config.ts` as a new `fontFamily.accent` entry, and use it sparingly — a class like `.accent` in the mockup, or a small `<AccentWord>` component wrapping the styling so every use is consistent (avoids the drift the mockup itself hit before the consistency-fix pass).
- **JetBrains Mono** — already loaded (`--font-mono`) — used in the mockup for vault filenames/technical strings (`AES-GCM`, file names). No change needed; just make sure `font-mono` utility classes get applied to the real vault's technical text (case IDs, filenames, envelope-version strings) the way `formatDateTime`-style precision copy already gets `tabular-nums`.
- Rejected during this session: Space Grotesk for display headlines (read as "crypto/dev-tool," not "bank/legal" — see the evidence log's design-audit note if this decision is ever revisited).

### 2.2 Color
The mockup's palette is a warm-neutral, single-brand-green system:
- Background `#FBFBFA`, foreground `#14201C`/`#0E1815`, muted text `#4B5A54`/`#7A867F`, borders `#EDEDEA` (unified — was `#EEEEEC` in one file before the consistency fix).
- Brand green `#1C7D5E` (with a `#229070 → #1C7D5E` gradient on primary buttons), amber warning `#D9A406`/`#8A6300`, a small indigo accent `#6366F1` used only in the aurora background and one deadline icon.
- Vault surface only: near-black `#090C0B → #0B0F0E` gradient with a `#4FDBA6` bright-mint accent and translucent-white rows — a deliberately different, "obsidian" register from the rest of the app.

**Reconciliation needed (Task 1 in §3):** the real app's `--primary`/`--brand` token is already an HSL green (`161 64% 30%`), which is close in hue to the mockup's `#1C7D5E` but not necessarily an exact match, and the real `--background`/`--border`/`--muted-foreground` values are a cooler, bluer neutral (`224 32% 11%` foreground, `220 16% 90%` border) versus the mockup's warmer near-neutral. A fresh session should **convert the mockup's approved hex values to HSL and either adopt them as the new `--primary`/`--background`/`--border`/`--muted-foreground` tokens directly, or make a deliberate, documented call to keep the current cooler neutral and only adopt the mockup's brand-green hue** — this is a real design decision, not just a mechanical port, and should get a one-line founder confirmation before or right after making it (screenshot before/after is cheap and worth doing here).

### 2.3 Radius scale
- Cards: **20px** — this already equals the real `--radius-xl` token exactly. No new token needed; just make sure `Card` and page sections consistently use `rounded-xl`, not a mix of `rounded-lg`/`rounded-2xl`.
- Buttons: **13px** — the real scale has `--radius-md` (10px) and `--radius-lg` (14px) but nothing at 13px. Two options: nudge `--radius-lg` from 14→13px (cheap, likely invisible elsewhere), or add a fifth token (`--radius-btn: 13px`) if 14px is load-bearing elsewhere. Prefer the first unless a screenshot pass shows 14px mattering somewhere.
- Row items / radio-cards / compact list rows: **16px** — between the current `--radius-lg` (14px) and `--radius-xl` (20px). Same choice as above: either accept 14px is close enough, or add a token.
- **Do this reconciliation once, in `globals.css`, and every component picks it up** — this is the whole point of the token architecture per §0.

### 2.4 Badge / pill system
Mockup uses two sizes: `.pill` (12.5px text, 5×12px padding) for primary status badges, `.pill-sm` (11px text, 3×10px padding) for compact/inline chips. The real app already has a `Badge` component (`src/components/ui/badge.tsx`) with a contrast-fixed default variant (see `13c3b9f` — `bg-primary/[0.07]` fix). **Task:** add a `size="sm"` variant to the real `Badge` component matching `.pill-sm`'s proportions, rather than inventing a parallel class system — this keeps the real app's "no duplicate badge systems" property that the mockup itself had to fix after drifting.

### 2.5 Backgrounds: aurora + dot-grid
The mockup's marketing hero uses a layered background: a dot-grid (radial-gradient dot pattern, masked to fade out by ~78% down the page) plus two large blurred radial-gradient "aurora" blobs (green + a small indigo one) positioned top-right. The real app already has a single-radial `.marketing-surface` utility in `globals.css` (light + dark variants). **Task:** extend `.marketing-surface` (or add a new `.marketing-surface-aurora` variant used only on the home hero, not every marketing page — the mockup's effect is a hero-specific flourish, not a page-wide texture) with the dot-grid mask layer and the second blob. Keep it purely decorative/`pointer-events: none`, exactly as the mockup does, and respect `prefers-reduced-motion` (static image, no animation was used, so this is already safe).

### 2.6 Original illustrations, not stock photography
This session explicitly rejected the founder-shared Gemini stock-photo/Unsplash suggestions as generic "AI-slop" risk and cheap-looking for a legal/compliance-adjacent product, and instead built small **layered custom SVGs** using gradient `<defs>` + 2–3 stacked shapes (never a single flat icon):
- Hero: a layered shield-check (gradient-filled shield, subton highlight, checkmark)
- Vault: a "vault-door" glyph (radial glow + ringed dial + handle) instead of a flat lock icon
- Decode: a layered magnifier-over-document illustration
- Removed after founder feedback: a large standalone "compass" illustration for "Why we ask" (replaced with a small icon-in-circle inline with the label — the founder called the compass "not good")

**Task for the overhaul:** build a small internal library of these (e.g. `src/components/illustrations/`) as real React SVG components with the same layered-gradient technique, reused across `/`, `/vault`, `/decode`, rather than one-off inline SVGs per page — this avoids the exact consistency drift the mockup had to fix by hand.

**On the founder's Gemini-sourced stock-photo list:** recommendation stands from this session — skip nearly all of it (generic desk/laptop/handshake stock photography reads as filler on a product whose whole pitch is precision and honesty). The one idea worth pursuing was a subtle grain/noise texture overlay (a technique actually seen on Ironclad's real site) — if the founder still wants to capture and hand over an asset for that, it's a single small tileable PNG/SVG noise texture, low effort, real payoff.

### 2.7 Page-level layout decisions
- **Home hero** (`Main.dc.html`): pill nav badge, headline with one accent word, subline exactly matching `src/content/marketing.ts` (verbatim — the mockup had this drift once and it was fixed), a "decoded notice" artifact panel on the right showing two deadline rows + a "Do now" list, three-card "how it works" strip below.
- **Guided interview** (`Interview.dc.html`): a three-column split — a narrow step-rail (numbered circles + connecting lines, current step highlighted) — the question itself (radio-cards, save & exit / continue footer) — a "Why we ask" context panel with an example-answer card and a "never sent to Amazon" privacy note. This is a real layout change to `InterviewFlow.tsx`, which today does not have the step-rail or the right-column context panel.
- **Decode result** (`Decode.dc.html`): two-column — the decoded notice text with inline `hl-risk`/`hl-clear` highlighted spans — floating annotation cards on the right explaining specific highlighted phrases, each tagged clear/risky, ending in a "Start your Plan of Action" CTA. This is new relative to the real `/decode` page's current single-column result card.
- **Vault** (`Vault.dc.html`): the app header stays on the light theme (deliberate contrast), but the vault content area itself renders as a permanently dark "obsidian" surface (`#090C0B` gradient, mint accents) **regardless of the site-wide light/dark toggle**. **This is a real architectural decision the founder should explicitly confirm before implementation**: does `/vault` deliberately override the user's light/dark preference (mockup's choice — vault-as-a-distinct-space metaphor), or should it respect `next-themes`/the `.dark` class like the rest of the app? Flag this clearly; don't build it silently either way.

### 2.8 Real screenshots vs. custom illustrations — not a contradiction

§2.6 rejected **stock photography** (generic desk/laptop/handshake images) as filler that reads as "AI-slop" on a precision/honesty product. Real **screenshots of AppealDeck's own interface** are a different category — evidence, not decoration — and fit this product's positioning better than illustration would, the same way Linear/Stripe/Apollo/1Password use their own UI as marketing material. Decided 12 Sep 2026: use them, at concrete product moments, alongside (not instead of) the illustration library from §2.6:

- **Login/signup split screen** — one side auth, the other a framed view of the product. `Login.dc.html` (new artboard) builds this now.
- **Home hero** — once the home page is rebuilt (Task V3), the "decoded notice artifact panel" is a strong candidate to become a real framed screenshot instead of the current hand-styled illustration-panel.
- Illustrations (shield-check, vault-door, magnifier) stay illustration — those are abstract concepts with no screen to show.

**The sequencing catch:** the real app doesn't carry this visual language yet (V1–V8 haven't been built), so there is nothing genuine to screenshot today — capturing the *current* UI would just reimport the look this pass is replacing. `Login.dc.html` therefore uses a **labelled sample-data preview** inside a browser-chrome frame (traffic-light dots, a fake URL bar, the same deadline-row/do-now components already designed for `Main.dc.html`), with an explicit caption ("A preview with sample data — your dashboard, once signed in, shows your own case") rather than presenting mock content as if it were real. **Task for the overhaul (folds into V3/V6):** once the home page and dashboard are actually rebuilt in code, capture genuine screenshots of those pages and swap them into the framed panel — the frame/chrome treatment from `Login.dc.html` is the pattern to reuse, not the sample content inside it.

### 2.9 Typography — a real drift, now reconciled

Checked directly against `Main.dc.html` on 12 Sep 2026: every heading/label was a raw inline `font-size` with no named scale, and several near-duplicate values had drifted apart with no visual reason (eyebrow-style uppercase micro-labels alone used 12px/0.08em tracking in one place, 12px/0.06em in another, and 11.5px/0.06em in a third — same semantic role, three different renderings). The same audit across `Interview.dc.html`, `Decode.dc.html`, `Vault.dc.html` found the identical pattern (13px vs 13.5px body copy, 12px vs 12.5px captions, a header logo/wordmark sized differently on `Vault.dc.html` than the identical header on `Main.dc.html`).

**Fixed in the mockup source (12 Sep 2026), one named scale across all five artboards:**

```
Display 53/1.1/800        — hero H1 only
H1      40/1.15/800       — the Interview question headline
H2      28/1.2/700        — section headers ("How it works")
H3      20/1.3/700        — (reserved — no current use)
H4      16/1.4/700        — card titles
Body-lg 17.5/1.62/440     — hero subline
Body    15/1.5/500-600    — nav links, .btn label text
Body-sm 13.5/1.55/400-600 — card copy, deadline rows, annotation body text
Caption 12.5/1.4/600      — pills, muted meta-text (sentence case)
Eyebrow 11.5/1.3/700, uppercase, 0.06em tracking — every micro-label, no exceptions
```

`.pill-sm`'s 11px (§2.4) is a deliberate different value for a different component, not eyebrow drift — left unchanged. Each `.dc.html`'s `<style>` block now opens with a one-line comment recording this scale, so it doesn't drift again as the mockup is edited further. **Task for the overhaul:** carry the same discipline into `globals.css`'s fluid type tokens (Task V1) and treat any inline pixel value outside the named scale, in the real app, the same way the AA-31/sweep-pass convention already treats a duplicated color or radius — a bug, not a style choice.

---

## 3. Implementation plan for the fresh session (proposed task order)

This should almost certainly run as its own `AM-2x` amendment with its own prompt/spec/evidence-log, matching this repo's established pattern (see `06-PREMIUM-UI-UX-SPEC.md`, `08-WAVE-C-HANDOFF.md`, the visual-refresh-v3 prompt/spec/audit trio). A fresh session's **first task** should be exactly that paperwork step (spec + AM number + `docs/DECISIONS.md` entry), same as every prior visual pass — do not skip straight to code.

**Suggested task sequence** (token-first, so every later task inherits it — this is the whole point of §0):

1. **Tokens.** Reconcile mockup color hex → HSL tokens in `globals.css` (§2.2), radius reconciliation (§2.3), add `--font-accent`/Newsreader to `src/lib/fonts.ts` + Tailwind config (§2.1). Screenshot before/after on 2–3 representative pages to confirm nothing broke. This is the one task where a quick founder confirmation on the color reconciliation call is worth pausing for.
2. **Primitives.** `Badge` size variant (§2.4), aurora/dot-grid background utility (§2.5), a small illustrations library (§2.6). Unit/visual test each in isolation (the existing `DevUiGallery.tsx` dev route is the natural place to add a section for these — it already exists for exactly this purpose, see the visual-refresh-v3 pass).
3. **Home page** rebuild against `Main.dc.html` (§2.7) — verify hero copy stays byte-identical to `src/content/marketing.ts`/`app.ts`, verify deadline chips render from real `deadlinesModel` data (never a hardcoded date — this was a real defect the mockup itself had and fixed; the real page must get this from data, not marketing copy).
4. **Guided interview** layout rebuild against `Interview.dc.html` — this is the biggest structural change (new step-rail component, new two-column-plus-rail grid). Should ride alongside, not fight, the AM-21 access-and-continuity logic already built into `InterviewFlow.tsx`/`interviewEngine.ts` (save-first/gate-second/resume-third, signed-out flow) — a visual-only pass, not a behavior change.
5. **Decode result** layout rebuild against `Decode.dc.html` — new annotation-card pattern; must stay D6-compliant (the mockup itself had two D6/accuracy near-misses caught and fixed this session — a fabricated deadline and a false claim about the sample notice's "90 days" — so review real annotation copy for the same class of error before shipping, especially since annotations here would describe a *real* user's *real* notice, where accuracy matters even more than in a mockup).
6. **Vault** surface rebuild against `Vault.dc.html` **after the light/dark-override decision in §2.7 is confirmed**.
7. **Sweep pass** — a deliberate cross-page consistency check (radii, pill sizing, illustration reuse, accent-word usage) mirroring the consistency-fix pass this session had to do manually on the mockup — except this time it should mostly fall out for free because everything reads from the same tokens/components (§0's whole thesis — worth confirming it held).
8. **Gates** — same bar every pass in this repo has used: `tsc`, `lint`, `lint:copy`, `format:check`, `vitest`, `build`, Playwright, Lighthouse (≥ the visual-refresh-v3 baseline: 1.0 across all four categories on the pages it covered). Screenshot set for founder sign-off, same convention as every prior pass (`docs/handoffs/screenshots/<date>/`).

## 4. Everything else needed to start (per the founder's "take care everything else is setup" ask)

Checked as part of this session, so a fresh session does not need to re-verify:

- ✅ Working tree is clean at `HEAD` (`64df88d`) aside from this handoff's own new files — no half-finished work is sitting uncommitted.
- ✅ The approved mockup source is now inside the repo (§1), not only in a temp scratchpad or an external artifact link — a fresh session can open the four `.dc.html` files directly.
- ✅ The real token architecture was re-verified directly against source (`globals.css`, `tailwind.config.ts`, `src/lib/fonts.ts`) while writing this document — §2's reconciliation notes are grounded in the actual current values, not assumed ones.
- ✅ No blocking build/test issues: the repo was at all-green gates as of the visual-refresh-v3 and full-repo-audit passes completed earlier in this same session (see `CLAUDE.md` §4 for exact gate output at `d720bd2`/`64df88d`).
- ⚠️ **Not this pass's job, still outstanding from before:** the founder's AA-34 signed-in walkthrough + sandbox checkout, and the Task A8 auth-gated screenshot capture — both need real credentials a human must supply, unrelated to this visual work, and should not block starting it.
- ⚠️ **Decision needed from the founder before Task 6 (vault theme override), and ideally before Task 1 (color reconciliation)** — both are called out explicitly in §2 above so a fresh session knows to ask rather than guess.

**Bottom line:** nothing else is missing. A fresh session can start at Task 1 immediately with this document, the copied mockup files, and the real `globals.css`/`tailwind.config.ts`/`src/lib/fonts.ts` open side by side.

---

*Next: `SESSION-START-PROMPT.md`'s PATH lines should be repointed at this file once a formal AM-2x prompt/spec exists for it (Task 0 of the fresh session, per §3).*
