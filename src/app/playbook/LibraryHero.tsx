import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";

/**
 * The navy band of a playbook page (2 Nov 2026). It is the same band the legal pages open with —
 * eyebrow, display title, the one paragraph that says what the page is for, and the facts that
 * date it — so the whole library reads as one set of documents rather than a set of cards.
 */
export function LibraryHero({
  eyebrow,
  title,
  intro,
  meta,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  intro: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className="stage dark text-foreground">
      <div className="mx-auto flex max-w-marketing flex-col gap-4 px-4 pb-20 pt-16 sm:px-8 sm:pt-20">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BookOpen aria-hidden className="size-4" />
          {eyebrow}
        </p>
        <h1 className="max-w-[26ch] text-balance text-[clamp(2.4rem,1.3rem+3.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
          {title}
        </h1>
        <p className="max-w-[42rem] text-lg leading-relaxed text-muted-foreground">{intro}</p>
        {meta}
      </div>
    </section>
  );
}
