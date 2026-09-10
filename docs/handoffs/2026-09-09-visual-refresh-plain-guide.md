# The visual refresh, in plain words (for Jhangir, 9 Sep 2026)

You asked me to run the tool on localhost, look at it the way a visitor would, and say what would make it look like a serious, modern product. I did that on every public page at desktop and phone widths, in light and dark mode, and I read the code behind the pages I could not open without logging in. This page tells you what I found and what will change. The detailed files are listed at the end.

## What I looked at
- Home, Pricing, Decode, FAQ, Terms, Login — full-page screenshots at 1280 px and 375 px, light and dark.
- The decoder end to end, using its own "Try a sample notice" button.
- The design-system gallery at `/dev/ui`.
- The code for the dashboard, case, compose, vault and billing pages (I do not log in to your account).

## The short version
The tool is honest and it works, but it looks like a default component kit that nobody finished styling. The header is thin, the footer is two grey lines, the hero is a headline next to a small floating card, the pricing page is a plain table, badges are loud blue and red pills, and the brand green in the logo is a different green from the buttons. Nothing looks broken at first glance. Nothing looks designed either.

I also found **two things that are actually broken** for a first-time visitor, which matter more than any colour:

1. **"Try a sample notice" does not decode.** The sample text is a tiny test fixture that never mentions Amazon, so the decoder rejects it with "This doesn't look like an Amazon notice." The first thing a curious visitor clicks fails.
2. **The Decode page has no header, no logo and no footer.** It is the page every ad and every link will send people to, and it is a bare form with no way back.

Both are fixed in the plan below (the sample becomes a realistic fictional notice you approve; the decoder gets the site's header and footer).

## The twelve things that make it look basic, in plain words
1. **The logo** is a green square with three lines and a magnifying glass. At small sizes it is a blob, and the word shows as "Appeal Deck" with a gap because of a layout bug.
2. **Three different greens.** Icon and share image use one green, the buttons another, dark mode a third mint.
3. **No depth.** In light mode everything is white boxes with thin grey lines. Premium products use slightly tinted panels and very soft shadows so the eye knows what is a card and what is the page.
4. **Loud badges.** "Low", "Policy violation", "You submit yourself" and friends are solid blue/red/green pills with white text. They shout. Tinted pills (pale background, coloured text) look calmer and read better.
5. **Headline sizes are random.** There is a proper type scale defined in the code, but pages do not use it; the home headline wraps into four ragged lines at desktop width.
6. **Widths are random.** There is a set of page widths defined, but eleven pages use one ad-hoc width, five another, three another. Header, content and footer do not line up.
7. **The header** has three tiny underlined links and no "Sign in", so a paying seller cannot find the app from the marketing site.
8. **The footer** is one 12 px line plus two 12 px disclaimer lines that run the full width of the screen.
9. **The hero** is a headline, two buttons and a small card in the top right with empty space under it. The spec says the hero should *be* the product — a real decoded notice, with the badge, the summary, the deadline chips and the first two "do now" lines.
10. **Pricing** is a headline and a plain table of "Yes / —". No price card, no emphasis on the Pass column, four blue badges pretending to be headings, and a stray caption under the table that belongs to the sample-POA dialog.
11. **Motion is missing where it should exist** (accordions and side menus snap open because the animation classes point to nothing) **and present where it should not** (the Decode button animates itself into view).
12. **Small things everywhere:** tooltips look like disabled grey boxes, the apple touch icon is a dead file with invalid markup, the design gallery page crashes, the vault page prints its title twice, the dashboard's lock icons float outside their cards, the evidence panel prints `supplier_invoice` as a label.

## What "premium" will mean here — and what it will never mean
Premium here is **calm authority**: one green, quiet type with a real scale, generous white space, soft tinted shadows, panels that sit on the page instead of floating, one obvious next step on every screen, a hero that shows the real product, motion only when you asked for something. The reference class is Linear, Vercel, Stripe docs, Mercury.

It will **never** mean countdown timers, "12 sellers bought today", testimonials we do not have, "trusted by" logos, confetti, animated backgrounds, a chat bubble, or any promise about outcomes. Those are ruled out by D6 and by the spec you ratified on 4 Sep. The refresh makes the tool look like it deserves $199; it does not make claims for it.

## What changes, page by page
- **Everywhere:** the new mark you locked (option E2: three stacked sheets with a check — "the deck, checked") in one green; single-word wordmark; new colour tokens tuned for light and dark; Inter loaded properly with optical sizing; a real type scale; five page widths used consistently; tinted badges and alerts; calmer buttons; layered cards; edged form fields; dark tooltips; working panel animations; icons at one stroke width.
- **Header:** 64 px, pill navigation with a visible active page, theme toggle, Sign in. Mobile menu is a proper side panel with a title.
- **Footer:** brand + description, Product and Legal columns, then the two disclaimer sentences in a bounded strip with the year.
- **Home:** the hero becomes a decoded-notice panel (real engine output) beside a shorter headline; three numbered step cards; "We do / We do not" side by side; a quiet closing band with the same free-decoder button.
- **Pricing:** a price card on the right ("$199 — One-time. One case." with what is included and a button that scrolls to the purchase box), the comparison table with the Pass column highlighted and check marks, trust items as icon tiles, FAQ in a card, the purchase card anchored so the button lands on it.
- **Decode:** inside the normal site shell; a form card with one hint line that appears only after you paste something; a result card with a proper heading, "Do now" in green and "Do not" in amber, the expectations card and one call to action; a sample notice that actually decodes.
- **FAQ, legal, sign-in, 404:** same system, readable widths, a live table of contents on legal pages, the mark above the sign-in card.
- **Inside the app:** page headers with badges, the readiness score shown as a number over the bar, the vault toolbar and rows tidied, the duplicate title removed, evidence labels in plain English.

## Copy: from disclaimers to value
You asked for marketing that sells wisely without ever promising falsely. The rule I wrote into `docs/handoffs/2026-09-09-copy-deck.md` is simple: every marketing surface says what the seller gets (a plain-English decode, the deadlines, a Plan of Action in the structure Amazon reads, an evidence checklist, a critic review, an encrypted vault, one payment, a 7-day refund). Boundaries are stated as control ("you submit it yourself in Seller Central"), never as incapacity ("we cannot promise"). The one truth about who decides appeals is said once, in the FAQ and on the card at the purchase button — not in the hero, the footer or the link image. Nothing false is added: no guarantee, no success rates, no fake urgency, no invented testimonials. The deck rewrites every string, current beside new, so you can read it line by line before ticking.

## Your decisions (tick in the prompt file)
- **A — the mark: locked.** You chose E2 ("the deck, checked") from the eleven candidates in `docs/handoffs/assets/2026-09-09-mark-options-v2.png`. The whole kit in `public/brand/` is now generated from it; see `docs/handoffs/assets/2026-09-09-brand-sheet.png` and `public/brand/og-1200x630.png`. Nothing to tick.
- **D — the copy deck.** Read `docs/handoffs/2026-09-09-copy-deck.md`; the two items marked ★ (the FAQ answer about reinstatement and the expectations-card wording) deserve your closest look. Tick D to have it applied.
- **B — the sample notice text.** It is fictional, generic, and only mentions the 90-day window your FAQ already states. I recommend yes; without it the sample keeps failing.
- **C — let the decoder API use the same "does this look like a notice" list as the page.** Small backend line, bug fix only. Optional; B alone fixes the sample.

## How to run it
1. Wait until your coding AI reports the **access and continuity pass** complete (its last commit is `docs(access/task-8)`; the fix pass finished on 10 Sep). Do not start the visual pass before that — both passes touch the same files. The visual pass now restyles the header, the signed-out pages, the compose gate and the three-column pricing table that the access pass built; it changes none of their behaviour.
2. Tick B and D, and optionally C, at the top of `docs/handoffs/2026-09-09-visual-refresh-prompt.md` (A is already locked).
3. Open `docs/handoffs/SESSION-START-PROMPT.md` and check that the two PATH lines already read as below (the access pass's last task sets them; change them yourself only if it did not):
   `PASS PROMPT PATH: docs/handoffs/2026-09-09-visual-refresh-prompt.md`
   `EVIDENCE LOG PATH: docs/handoffs/2026-09-09-visual-refresh.md`
4. Paste the session-start block into a fresh coding session as usual. Task V0 records the amendment (AM-20) and checks the baselines (these documents and the brand kit were committed on 10 Sep, so V0 no longer commits them); V1–V9 do the visual work; V10 applies the copy deck; V11 produces the screenshots you sign off.
5. Expect about two working days of coding-AI time. Every task ends with screenshots, so you can stop after any task and still have something better than today.

## Files
- Audit with every finding, evidence and severity: `docs/handoffs/2026-09-09-visual-audit.md`
- Design spec with exact colours, sizes, code and page layouts: `docs/handoffs/2026-09-09-visual-refresh-spec.md`
- Coding-agent prompt (Tasks V0–V10): `docs/handoffs/2026-09-09-visual-refresh-prompt.md`
- Evidence log the coding AI fills: `docs/handoffs/2026-09-09-visual-refresh.md`
- Brand kit, ready to wire (favicons, app icons, logos, link-preview image) with its placement map: `public/brand/` and `public/brand/README.md`; preview sheet `docs/handoffs/assets/2026-09-09-brand-sheet.png`; the eleven candidates you chose from: `docs/handoffs/assets/2026-09-09-mark-options-v2.png`
- Copy deck (strategy, voice rules, every string current → new): `docs/handoffs/2026-09-09-copy-deck.md`
