"use client";

import { BadgeCheck, CircleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { verificationChecklist, VERIFICATION_FLAVOUR_LABELS } from "@/core/verificationTrack";

/**
 * AA-42: the verification track's preparation checklist.
 *
 * Shown instead of a drafting surface, because verification has nothing to draft. The steps are
 * ordered cheapest-first, and the ones that cause most failures are marked — a seller in a hurry
 * reads the marked ones and still avoids the common mistakes.
 */
export function VerificationChecklistCard({ notice }: { notice: string }) {
  const { flavour, steps } = verificationChecklist(notice);

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">Preparing your verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            {VERIFICATION_FLAVOUR_LABELS[flavour]}. There is nothing to draft here — Amazon wants a
            document or a step, not an argument.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step.id} className="flex gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium tabular-nums text-muted-foreground"
              >
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  {step.title}
                  {step.critical && (
                    <Badge variant="warning" className="text-xs">
                      <CircleAlert className="mr-1 size-3" aria-hidden />
                      Commonly missed
                    </Badge>
                  )}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
