import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * A page that could not be shown (404, an error). v5 (26 Sep 2026): the navy card the rest of the
 * product uses for "what now", so even a dead end looks like the same product and offers the way on.
 */
export function PageState({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="next-card dark mx-auto my-8 w-full max-w-tool p-8 text-foreground sm:my-14 sm:p-12">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/[0.08] text-primary">
        <Icon aria-hidden className="size-5" />
      </span>
      <p className="mt-6 text-sm font-semibold text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-balance text-[clamp(2rem,1.3rem+2.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
        {title}
      </h1>
      <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-7 flex flex-wrap gap-3">{children}</div>
    </section>
  );
}
