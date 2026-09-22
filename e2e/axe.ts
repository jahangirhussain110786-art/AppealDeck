import { expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/** The conformance level the product commits to (AM-18: WCAG 2.2 AA). */
export const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

/**
 * Wait until the page has stopped changing colour, so axe measures pixels the palette can
 * actually produce.
 *
 * Two things move. **Entry fades**: framer-motion writes an inline opacity, and a scan taken
 * mid-fade reports blended foregrounds that exist in no theme (e.g. #aaabaf for
 * text-foreground on white). Elements below the fold are ignored — scroll-triggered
 * animations stay at opacity 0 until they enter the viewport, by design.
 *
 * **Colour transitions**: this is the one that produced the long-standing "order-dependent"
 * contrast failure. A spec flips the theme with `emulateMedia({ colorScheme: "dark" })`, the
 * background repaints immediately, but every element carrying `transition-colors` eases its
 * text colour across --dur-fast. Scan inside that window and axe compares the *light* theme's
 * #4a5953 against the *dark* theme's #0e1613 and reports 1.08:1 — a pairing the product never
 * renders. Under load the transition is still running when the scan starts, which is exactly
 * why it looked like flakiness. Only CSSTransition is awaited: a CSSAnimation may loop
 * forever (spinners) and would never settle.
 *
 * Bounded deliberately. Transitions here are ≤320 ms (--dur-slow), so anything still moving
 * after five seconds is not a transition and waiting longer will not settle it. An unbounded
 * wait burns the whole test budget and then reports a timeout inside this helper, which says
 * nothing about the page. On expiry we scan anyway: axe then reports the colours it actually
 * measured, which is a real lead.
 */
export async function waitForEntryAnimations(page: Page) {
  await page
    .waitForFunction(
      () => {
        const viewportHeight = window.innerHeight;
        const fadesSettled = Array.from(
          document.querySelectorAll<HTMLElement>('[style*="opacity"]'),
        ).every((el) => {
          const rect = el.getBoundingClientRect();
          const inViewport = rect.bottom > 0 && rect.top < viewportHeight;
          return !inViewport || getComputedStyle(el).opacity === "1";
        });
        const coloursSettled = !document
          .getAnimations()
          .some((a) => a instanceof CSSTransition && a.playState === "running");
        return fadesSettled && coloursSettled;
      },
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => undefined);
}

/**
 * Scans the page and fails with the colours, selector and rule that broke — not a bare
 * `expected [] to equal []`.
 *
 * The app specs used to call AxeBuilder directly and assert `toEqual([])`, which reported a
 * failure without saying which element or which ratio, and skipped the fade wait the
 * marketing spec already had. A contrast failure then read as an unexplained flake. The
 * palette itself is now gated far earlier by src/app/__tests__/contrast.test.ts; this stays
 * as the check on what the page composites in a real browser.
 *
 * `impacts` narrows to those severities (the marketing surfaces gate on serious + critical);
 * omit it to assert on every violation the chosen tags produce.
 */
export async function expectNoAxeViolations(
  page: Page,
  { tags, impacts }: { tags?: string[]; impacts?: string[] } = {},
) {
  await waitForEntryAnimations(page);
  const builder = new AxeBuilder({ page });
  const results = await (tags ? builder.withTags(tags) : builder).analyze();
  const violations = results.violations.filter((v) => !impacts || impacts.includes(v.impact ?? ""));
  expect(
    violations,
    JSON.stringify(
      violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        // `failureSummary` carries the measured contrast ratio and both colours.
        nodes: v.nodes.map((n) => ({ html: n.html, why: n.failureSummary })),
      })),
      null,
      2,
    ),
  ).toEqual([]);
}
