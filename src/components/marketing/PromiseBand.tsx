import Link from "next/link";
import { Check } from "lucide-react";
import { POSITIONING } from "@/content/positioning";
import { cn } from "@/lib/utils";

const WRAP = "mx-auto w-full max-w-marketing px-4 sm:px-8";

/**
 * The division of labour and the five promises that can be checked (24 Oct 2026). `full` is the
 * home page band; `inline` sits inside /pricing's wrapper, immediately before the purchase section,
 * so the promises are read before the pay button without repeating the band's outer padding.
 */
export function PromiseBand({
  variant = "full",
  className,
}: {
  variant?: "full" | "inline";
  className?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-semibold text-primary sm:text-sm">
        {POSITIONING.promises.eyebrow}
      </p>
      <h2
        id="promise-band-title"
        className={cn(
          "mt-1.5 max-w-[24ch] text-balance font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:mt-3",
          variant === "full"
            ? "text-[clamp(1.85rem,1.4rem+2.4vw,3.4rem)]"
            : "text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)]",
        )}
      >
        {POSITIONING.triad.sentence}
      </h2>
      <p
        className={cn(
          "mt-2 max-w-2xl leading-relaxed text-muted-foreground sm:mt-4",
          variant === "full" ? "text-base sm:text-lg" : "text-sm sm:text-base",
        )}
      >
        {POSITIONING.mechanism} {POSITIONING.promises.note}
      </p>
      {/* Two columns from the narrowest phone, so five promises cost three rows before the pay
          button rather than five full-width ones (24 Oct 2026; it added ~700px on a 375px screen).
          A phone also gets the one-line `short` body; the full sentence returns from sm. */}
      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:mt-8 sm:gap-x-8 sm:gap-y-6 lg:grid-cols-5">
        {POSITIONING.promises.items.map((promise) => (
          <li key={promise.title} className="flex flex-col gap-1 sm:gap-2">
            <span className="grid size-5 place-items-center rounded-full bg-success/15">
              <Check aria-hidden className="size-3 text-success" strokeWidth={3.5} />
            </span>
            <span className="text-sm font-semibold text-foreground">{promise.title}</span>
            <span className="text-xs leading-snug text-muted-foreground sm:hidden">
              {promise.short}
            </span>
            <span className="hidden text-sm leading-relaxed text-muted-foreground sm:block">
              {promise.body}
            </span>
            <Link
              href={promise.href}
              className="mt-auto inline-flex min-h-6 items-center py-0.5 text-[11px] font-medium text-link underline-offset-4 hover:underline sm:py-1 sm:text-xs"
            >
              {promise.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (variant === "inline") {
    return (
      <section
        aria-labelledby="promise-band-title"
        className={cn("my-6 border-y border-border py-6 sm:my-12 sm:py-10", className)}
      >
        {content}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="promise-band-title"
      className={cn("border-y border-border bg-surface-2/40", className)}
    >
      <div className={cn(WRAP, "py-10 sm:py-28")}>{content}</div>
    </section>
  );
}
