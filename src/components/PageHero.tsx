import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The navy header band of a public page (v5, 26 Sep 2026): eyebrow, the title in the display
 * face, an intro, and optional detail under it. Passed to `MarketingShell`'s `hero` slot so the
 * band spans the full width while the page's content keeps its reading width below.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  width = "max-w-app",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  width?: string;
}) {
  return (
    <section className="stage dark text-foreground">
      <div className={cn("mx-auto w-full px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16", width)}>
        {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 className="mt-3 max-w-[20ch] text-balance text-[clamp(2.1rem,1.3rem+2.8vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{intro}</p>
        )}
        {children}
      </div>
    </section>
  );
}
