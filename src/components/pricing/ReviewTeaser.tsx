"use client";

import { PRODUCTS } from "@/content/purchases";
import { setPlanChoice } from "@/lib/planChoice";

/**
 * The smaller first step, under the plan cards (22 Oct 2026): for a seller who is not ready for the
 * whole Pass, the AI reading of one case's documents, whose price comes off the Pass later. Only
 * shown when it is on sale. It is a plain link to the purchase section that also chooses it there.
 */
export function ReviewTeaser() {
  return (
    <p className="mx-auto mt-6 max-w-prose text-center text-base text-muted-foreground">
      {PRODUCTS.review.teaser}{" "}
      <a
        href="#purchase"
        onClick={() => setPlanChoice("review")}
        className="font-medium text-link underline underline-offset-4"
      >
        {PRODUCTS.review.cta}
      </a>
    </p>
  );
}
