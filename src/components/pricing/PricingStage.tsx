import type { ReactNode } from "react";
import { AudienceSwitch } from "@/components/AudienceSwitch";
import { AccentWord } from "@/components/ui/accent-word";
import { splitAccent } from "@/lib/splitAccent";

/**
 * The dark hero every pricing page opens with: the headline, one line under it, and the switch
 * between the three audiences. Sellers, writers and VA teams, and partners all use it, and the
 * price cards overlap its lower edge (`-mt-28` on the section that follows), so the three pages
 * look like one pricing system (22 Oct 2026).
 */
export function PricingStage({
  title,
  accent,
  subline,
  note,
  children,
}: {
  title: string;
  accent: string;
  subline: string;
  note?: string;
  /** Under the switch: a call-to-action, a nudge. */
  children?: ReactNode;
}) {
  const parts = splitAccent(title, accent);
  return (
    <section className="stage dark text-foreground">
      <div className="mx-auto flex max-w-[56rem] flex-col items-center px-4 pb-40 pt-16 text-center sm:px-8 sm:pt-20">
        <h1 className="text-balance text-[clamp(2.4rem,1.3rem+3.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground">
          {parts ? (
            <>
              {parts.pre}
              <AccentWord className="text-primary">{parts.accent}</AccentWord>
              {parts.post}
            </>
          ) : (
            title
          )}
        </h1>
        <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">{subline}</p>
        {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
        <AudienceSwitch className="mt-8 justify-center" />
        {children}
      </div>
    </section>
  );
}
