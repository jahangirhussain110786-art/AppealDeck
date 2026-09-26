# Ten reference websites for the AppealDeck look (26 Sep 2026)

Purpose: the founder wants to raise the current look to a professional standard and asked for ten of the most praised, best-crafted websites to study. Apple was the founder's own pick; the other nine were chosen on two tests, in this order:

1. **Praised by the design community, verifiably** (cited as benchmarks in 2025–26 roundups, design-token teardowns, or awards), not just liked by me.
2. **Relevant to AppealDeck's job.** A frightened, deactivated seller must trust a one-person tool with their case, then act inside a deadline. So the shortlist favours calm, clarity and trust over spectacle. Awwwards Site-of-the-Year winners (Lando Norris, Messenger, Ponpon Mania) are brilliant but are WebGL experiences for a different job; they are listed at the end as "study the craft, do not copy the mood".

Each entry: what it is praised for → what to borrow → what to leave. "Borrow" always means the principle, never the assets or code (§3 of CLAUDE.md on forbidden sources applies to everything; these sites are proprietary too).

Current AppealDeck baseline for comparison (AM-30): Inter + Newsreader italic accent + JetBrains Mono; navy 216° neutrals, charcoal dark theme, Amazon-adjacent orange for action only, `--link` blue; shadcn primitives; tokens in `src/app/globals.css` + `tailwind.config.ts`.

---

## 1. Apple — apple.com

**Praised for:** the discipline of one idea per screen; enormous, quiet product photography with a single line of copy; a type scale where each step is clearly bigger than the last; white space that reads as confidence, not emptiness; motion used only to reveal the product.

**Borrow:**
- One message per section, full width, then stop. AppealDeck's home page already made "each point once" in the 25 Sep rewrite; hold that line on every marketing page.
- A real type hierarchy with big jumps. Apple's headline-to-body ratio is roughly 4–5×; ours is closer to 2.5×. The 12 Sep type-scale reconciliation (handoff §2.9) was a good start; audit it against this.
- Product-as-hero with no chrome around it. Our `HeroArtifact` deadline panel is the right idea; give it more room and less frame.

**Leave:** Apple's density of imagery needs a photo budget we do not have; do not substitute stock (rejected, spec 06 §2.6). Apple's scroll-driven animation is decorative by our own rule (≤320 ms, no decorative motion).

## 2. Linear — linear.app

**Praised for:** the strictest restraint on the web: near-black canvas, no second colour, no gradients, hierarchy carried entirely by surface lift and hairline borders. Inter Variable at unusual weights (510 as the "signature" medium). Only real product screens, never illustrations. The term "Linear-style" is now a named aesthetic.

**Borrow:**
- **The surface ladder.** Four charcoal steps plus three hairline tones is how a dark theme gets depth without colour. Our dark theme just went charcoal (`2381ce8`); define the ladder explicitly as tokens instead of relying on one `--card` and one `--border`.
- **Weight instead of colour for emphasis.** Linear's 300/510/590 trio is the model for a page that stays calm. We currently reach for the orange or a badge tint where a weight change would do.
- **Real product screens only.** This is our D6 honesty rule made visual. The AuthShell's labelled sample-data preview (V3b) already does this; extend it to the home page once `/case` looks the part.
- Negative tracking on display sizes (about −0.02em), tighter heading line-height.

**Leave:** Linear's page is dark-first for developers. Our seller arrives in daylight, in a panic, often on a phone. Light is the default; the ladder applies to both themes.

## 3. Stripe — stripe.com

**Praised for:** the most recognisable hero on the web (the WebGL mesh gradient), but the real reason designers cite it is everything below: typographic rhythm, a documentation site that is a design object in itself, code shown as a first-class visual, and an unbroken feel across marketing, docs, dashboard and email.

**Borrow:**
- **One system across every surface.** Stripe's marketing, docs and product feel like one company. Our marketing shell and the app shell should share the exact same header, type, and spacing tokens; today they are close but not identical (one `AppHeader` was the AM-18 goal).
- **Monospace as a design element.** Case IDs, ASINs, dates and file hashes in JetBrains Mono, set deliberately, the way Stripe shows code. We already render vault filenames in mono; do it wherever an identifier appears.
- The "gradient as a single moment" principle: one atmospheric surface on the home hero only (our aurora), nowhere else.

**Leave:** the mesh gradient itself (both a trademark-adjacent signature and a decorative animation).

## 4. Mercury — mercury.com

**Praised for:** "calm is credibility." A bank for startups that borrowed luxury-brand cues: generous whitespace, a single custom type family (Arcadia) doing all the work through weight, monochrome canvas with one cobalt accent, dense financial tables kept scannable purely by type discipline. Widely cited as the fintech benchmark in 2026 roundups.

**Borrow:**
- **This is the closest emotional target for AppealDeck.** Money and deactivation both put people in fear; Mercury shows what "we are competent and unhurried" looks like on a screen.
- One accent colour used as punctuation. Mercury's cobalt does what our orange should do: appear rarely, so it means something. Audit every orange element and demote any that are not a primary action.
- Dense data, quiet presentation: the case workspace, evidence list and facts ledger are our "transaction tables". Tabular numbers, hairline rows, no zebra striping, weight for hierarchy.
- Delicate light weights (Mercury uses ~360) for sub-headings instead of small caps or grey.

**Leave:** Mercury can afford a bespoke typeface; Inter at deliberate weights gets 80% of the way.

## 5. Vercel — vercel.com

**Praised for:** pure black-and-white geometry; the triangle mark; a grid you can feel; Geist type designed for the purpose; "the product is the demo" pages; a design system (Geist) that is published and admired in its own right.

**Borrow:**
- **Visible structure.** Vercel's sections sit on an evident grid with hairline dividers; nothing floats. Our marketing pages use rounded cards for almost every group; try dividers and alignment instead of boxes for at least half of them.
- Black/white first, colour last. Vercel proves you can be memorable with no brand colour at all; it is a good stress test: if a section only works because of the orange, the layout is weak.
- The "deploy in seconds" style demo: a live, real interaction on the home page. Our decoder is exactly this. The sample notice → decode result is the demo; make it the hero's centrepiece rather than a link.

**Leave:** the developer-tool coldness. Sellers are not developers; keep the warm-neutral direction the AM-22 tokens set.

## 6. Wise — wise.com

**Praised for:** transparency as design. The rate, the fee and the comparison to banks are on the home page before any claim; the bold green owns a category; the copy is blunt and specific. Cited as the model for "trust through showing numbers, not adjectives".

**Borrow:**
- **Show the mechanism, do not describe it.** This is spec 06 §10's "trust shown by mechanism, never requested" and Wise is its best public example. Our equivalent numbers: the deadline maths, the +60-day funds window, the $249 flat price with what it covers, the "no server copy" fact. Put them in the first screen, in large tabular numerals.
- A calculator-like widget above the fold. Wise's converter is the product; our decode box is the product.
- Plain, slightly blunt headline voice. Wise writes "Send money abroad. Cheaply." AppealDeck's copy deck already leans this way; go further.

**Leave:** the loud green as a full-bleed background. Our orange is an action colour, not a canvas.

## 7. Notion — notion.com

**Praised for:** warmth. Hand-drawn monochrome illustrations, serif accents, off-white paper canvas, a human tone that makes a database feel like a notebook. It leads with the reader's problem ("stop jumping between apps") rather than features.

**Borrow:**
- **Warmth without losing seriousness.** Our Newsreader italic accent word and the warm neutrals are Notion-adjacent choices already; this is confirmation the direction has a top-tier precedent.
- A single illustration style, monochrome, used sparingly. We have three layered SVG illustrations (V2) and the vault door; keep them line-based and in one ink colour so they read as a family.
- Problem-first headlines. "Amazon deactivated your account. Here is what to do today." beats any feature list.

**Leave:** Notion's playful looseness. A deactivated seller does not want whimsy; keep illustrations still and few.

## 8. GOV.UK — gov.uk and design-system.service.gov.uk

**Praised for:** the most respected service-design system in the world for clarity under stress. D&AD Black Pencil (the highest award in the field) for the original site; Wood Pencil for the step-by-step pattern; WCAG-tested components; a plain-language style guide used far outside government. Built specifically for people who are anxious, in a hurry, and often on a phone.

**Borrow:**
- **This is the best reference for the case workspace and interview, not the marketing page.** Every pattern we need exists here and has been tested on millions of frightened people: step-by-step navigation, "check your answers" pages, error summaries at the top of the form, one question per page, task lists with statuses, date inputs as three boxes.
- **Error and status language.** GOV.UK's "There is a problem" summary, and its rule that an error message says what to do next, is exactly what the workspace gaps and "Not checked" states should read like.
- Large body type (19px) and a 66-character measure. Our fluid type is close; verify the measure on the workspace.
- Black text on white, one link blue, one focus yellow. Note how little colour a trusted, clear service needs.

**Leave:** the deliberately plain visual style. GOV.UK is not trying to look premium; take its structure and language, and style them with our tokens.

## 9. Raycast — raycast.com

**Praised for:** a dark "power-tool cockpit" that still feels warm: near-black canvas, a single coral accent, gradient overlays used as atmosphere, crisp type, minimal copy, and product UI rendered as the illustration. A fixture of 2025–26 "best landing page" lists.

**Borrow:**
- **Warm accent on a dark canvas.** Raycast's coral on black is the closest public precedent for our orange on charcoal, and proves an orange accent can feel refined rather than "sale". Study its usage ratio: the coral is on maybe 2% of the pixels.
- Command-palette style focus: one input, one outcome. Our decode box and the interview's typed per-step inputs can carry that immediacy.
- Keyboard-key (`kbd`) styling and compact metadata rows done well; we have a `kbd` primitive that is gallery-only today.

**Leave:** dark-only, and the developer audience's tolerance for density.

## 10. Attio — attio.com

**Praised for:** an editorial, monochrome CRM site: bold typography, light-to-dark transitions between sections, real product UI as the hero, and a sense that a data-heavy tool can look like a magazine. Its onboarding and interaction work is widely shared on Dribbble.

**Borrow:**
- **Section rhythm through theme shifts.** Attio alternates light and dark bands to pace a long page instead of using cards. This is a strong answer to "how do we make the home page feel premium without more imagery".
- Editorial type: a large, tightly-tracked headline followed by a small, wide-measure paragraph. Our home hero is one line short of this.
- Product screenshots with generous margin and a hairline frame, not device mockups.

**Leave:** the black hero band as a default. Use the shift once, mid-page.

---

## What all ten share (the actual brief for our refresh)

1. **One accent colour, used as punctuation.** Never as a canvas. Our orange should be visibly rarer than it is today.
2. **Hierarchy from type weight and size, not from colour or boxes.** Bigger jumps between scale steps; light and medium weights doing real work.
3. **Hairlines and alignment instead of cards.** Cards are the default on our pages; the best sites use them sparingly.
4. **The product is the illustration.** Real screens, real interactions, honestly labelled. No stock, no abstract 3D.
5. **Show numbers and mechanisms, not adjectives.** Wise and GOV.UK for trust, Mercury for tone.
6. **Monospace for identifiers**, tabular numerals for anything counted.
7. **A published, explicit token ladder** (surfaces, hairlines, type scale, spacing) that marketing and app share exactly.
8. **Motion only to reveal state.** None of these sites needs decoration to feel expensive.

## Suggested order for applying this (no code changed in this note)

1. Tokens: define the surface and hairline ladder for both themes; rework the type scale to Apple-sized jumps; write down the orange usage rule.
2. Home and pricing: Attio-style light/dark band rhythm, Wise-style numbers up front, decoder as the live demo (Vercel).
3. Workspace and interview: GOV.UK patterns (task list, error summary, check-your-answers) styled with Mercury's table discipline.
4. Auth and vault: keep V3b's honest preview; apply the ladder.
5. Screenshots of the real product replace the labelled sample previews once 2–3 are done (the 12 Sep "Apollo/Linear screenshots" decision).

## Award-winning sites deliberately not on the list

Lando Norris (Awwwards Site of the Year, Annual Awards 2025), Messenger (Developer Site of the Year), Ponpon Mania: superb WebGL craft, worth ten minutes each for motion and loading polish, but their job is delight and ours is reassurance. Copying their mood would contradict the ethics spine (calm authority, no decorative animation).

## Sources consulted (26 Sep 2026)

- Linear teardown: https://designmd.cc/benchmarks/linear and https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md
- Mercury teardown: https://designmd.cc/benchmarks/mercury and https://blakecrosley.com/guides/design/mercury
- Raycast teardown: https://getdesign.md/raycast/design-md and https://siiimple.com/raycast/
- SaaS roundups citing Linear/Stripe/Vercel/Attio/Resend: https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples , https://azurodigital.com/saas-website-examples/ , https://www.pixeto.co/blog/15-best-designed-saas-websites
- Fintech roundups citing Mercury/Wise/Ramp: https://azurodigital.com/fintech-website-examples/ , https://www.blendb2b.com/blog/best-fintech-website-examples , https://www.utsubo.com/blog/fintech-website-trust-design-patterns
- GOV.UK awards and principles: https://en.wikipedia.org/wiki/Gov.uk , https://www.gov.uk/guidance/government-design-principles , https://design-system.service.gov.uk/accessibility/
- Awwwards annual winners: https://www.awwwards.com/websites/2025/ , https://www.hontran.dev/blog/best-award-winning-websites-2026
