import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = { label: string; onClick: () => void };

/**
 * The way on at the foot of a case view (29 Sep 2026). The four tabs are the only map of the case,
 * and a seller who finished the last document found the page simply ended: nothing said the
 * answers came next, or that preparing the response lived there. `children` is what to settle
 * before moving on, said where the seller already is.
 */
export function StepNav({
  back,
  next,
  children,
}: {
  back?: Step;
  next?: Step;
  children?: ReactNode;
}) {
  return (
    <div
      className={
        // A card only when there is something to settle; a lone Back button needs no frame.
        children
          ? "space-y-4 rounded-[18px] bg-card p-5 shadow-card ring-1 ring-inset ring-border"
          : undefined
      }
    >
      {children}
      {/* Stacked full width on a phone, Back on the left and Next on the right from there up. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {back && (
          <Button variant="outline" className="w-full sm:w-auto" onClick={back.onClick}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            {back.label}
          </Button>
        )}
        {next && (
          <Button className="w-full sm:ml-auto sm:w-auto" onClick={next.onClick}>
            {next.label}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
