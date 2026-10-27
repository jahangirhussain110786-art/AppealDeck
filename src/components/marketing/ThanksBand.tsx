import { CREDITS, MARQUEE_NAMES } from "@/content/credits";
import { CreditsMarquee } from "./CreditsMarquee";

/**
 * The acknowledgment band on the home page (27 Oct 2026). Names only — no third-party logo artwork:
 * the brands we use gate their marks behind permission we do not hold, and a strip where some names
 * have logos and others do not reads as an incomplete claim rather than a generous one.
 *
 * There is no separate credits page and no expanded list. The row is the whole statement; what each
 * tool does is either obvious from its name or belongs to the privacy policy, which keeps its own
 * account of what the services receive — one home per claim.
 */
export function ThanksBand() {
  return (
    <section className="stage dark text-foreground" aria-labelledby="thanks-heading">
      <div className="mx-auto w-full max-w-marketing px-4 pb-20 pt-16 sm:px-8">
        <h2
          id="thanks-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50"
        >
          {CREDITS.heading}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          {CREDITS.line}
        </p>

        <div className="mt-10">
          <CreditsMarquee names={MARQUEE_NAMES} />
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {CREDITS.disclaimer}
        </p>
      </div>
    </section>
  );
}
