import { CREDITS, MARQUEE } from "@/content/credits";
import { creditGrotesque, creditHumanist, creditSerif } from "@/lib/creditFonts";
import { splitAccent } from "@/lib/splitAccent";
import { cn } from "@/lib/utils";
import { AccentWord } from "@/components/ui/accent-word";
import { CreditsMarquee } from "./CreditsMarquee";

/**
 * The acknowledgment band on the home page (27 Oct 2026), between the plans and the questions.
 *
 * Marks and names, nothing else: an expanded list of what each tool does is a description of our
 * vendors on a marketing page, and the privacy policy already keeps its own account of what the
 * services receive — one home per claim. The three substitute typefaces are loaded here only, since
 * nothing else on the site uses them (see `src/lib/creditFonts.ts`). The heading follows the site's
 * pattern: plain "With" beside "thanks to:" in the italic serif accent face.
 */
export function ThanksBand() {
  const parts = splitAccent(CREDITS.heading, CREDITS.accent);
  return (
    <section
      className={cn(
        "stage dark text-foreground",
        creditSerif.variable,
        creditGrotesque.variable,
        creditHumanist.variable,
      )}
      aria-labelledby="thanks-heading"
    >
      <div className="mx-auto w-full max-w-marketing px-4 pb-24 pt-20 sm:px-8 sm:pt-24">
        <h2
          id="thanks-heading"
          className="text-balance text-[clamp(2.1rem,1.4rem+2.4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground"
        >
          {parts ? (
            <>
              {parts.pre}
              <AccentWord className="text-primary">{parts.accent}</AccentWord>
              {parts.post}
            </>
          ) : (
            CREDITS.heading
          )}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          {CREDITS.line}
        </p>

        <div className="mt-12">
          <CreditsMarquee names={MARQUEE} />
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {CREDITS.disclaimer}
        </p>
      </div>
    </section>
  );
}
