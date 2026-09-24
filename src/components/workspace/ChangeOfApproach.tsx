import { Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTile } from "./WorkspaceVisuals";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * B-04, reduced (24 Sep 2026): what to do differently after repeated refusals.
 *
 * Shown by `shouldOfferChangeOfApproach`: two responses sent, and Amazon's latest reply is not
 * reinstatement. The steps are ordered and the sources dated, because a seller who writes to the
 * wrong address, or escalates too early, spends a window they may not get back.
 */
export function ChangeOfApproach() {
  const copy = C.changeOfApproach;
  return (
    <Card className="border-warning/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <IconTile icon={Route} tone="warning" />
          <div>
            <CardTitle className="text-base">{copy.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{copy.intro}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3">
          {copy.steps.map((step, i) => (
            <li key={step.title} className="flex gap-3 text-sm">
              <span className="font-mono text-muted-foreground tabular-nums">{i + 1}.</span>
              <span>
                <span className="font-medium text-foreground">{step.title}</span>
                <span className="block text-muted-foreground">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          <p>{copy.sourcesNote}</p>
          <ul className="mt-2 space-y-1">
            {copy.sources.map((s) => (
              <li key={s.href}>
                <a
                  className="underline underline-offset-2 hover:text-foreground"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
