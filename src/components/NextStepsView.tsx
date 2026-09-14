"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EvidenceSlotPanel } from "@/components/EvidenceSlotPanel";
import {
  computeReadiness,
  isNarrativeSufficient,
  isNarrativeTextSufficient,
  ROOT_CAUSE_GAP_MESSAGE,
  PREVENTIVE_MEASURES_GAP_MESSAGE,
} from "@/core";
import type { CaseFile } from "@/core";
import { APP } from "@/content/app";

/**
 * Replaces the structured POA render whenever `composerModeFor()` reports `"gap-draft"` — i.e.
 * whenever any one of the three pillars (required evidence, root-cause narrative,
 * preventive-measures narrative) is incomplete (founder direction, 14 Sep 2026: never show the
 * structured POA "until and unless it is a successful POA" — show only what's left to do
 * instead). This is a deliberately different shape from `PoaSection`, not a watermarked copy of
 * it: no Copy button, no print view, no "before you submit" checklist — none of those make sense
 * for something that isn't a draft yet.
 */
export function NextStepsView({ caseFile }: { caseFile: CaseFile }) {
  const copy = APP.compose.nextSteps;
  const readiness = computeReadiness(caseFile);
  const evidenceDone = readiness.missing.length === 0 && readiness.disqualifiedPresent.length === 0;
  const rootCauseDone = isNarrativeSufficient(caseFile);
  const preventiveMeasuresDone = isNarrativeTextSufficient(caseFile.preventiveMeasures);

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <AlertTitle>{copy.title}</AlertTitle>
          <AlertDescription>{copy.description}</AlertDescription>
        </div>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PillarIcon done={evidenceDone} />
            {copy.pillars.evidence.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evidenceDone ? (
            <p className="text-sm text-muted-foreground">{copy.pillars.evidence.complete}</p>
          ) : (
            <EvidenceSlotPanel kind={caseFile.kind} />
          )}
        </CardContent>
      </Card>

      <NarrativePillarCard
        title={copy.pillars.rootCause.title}
        done={rootCauseDone}
        completeCopy={copy.pillars.rootCause.complete}
        gapMessage={ROOT_CAUSE_GAP_MESSAGE}
        fixLabel={copy.fixInInterview}
      />

      <NarrativePillarCard
        title={copy.pillars.preventiveMeasures.title}
        done={preventiveMeasuresDone}
        completeCopy={copy.pillars.preventiveMeasures.complete}
        gapMessage={PREVENTIVE_MEASURES_GAP_MESSAGE}
        fixLabel={copy.fixInInterview}
      />
    </div>
  );
}

function PillarIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
  ) : (
    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
  );
}

function NarrativePillarCard({
  title,
  done,
  completeCopy,
  gapMessage,
  fixLabel,
}: {
  title: string;
  done: boolean;
  completeCopy: string;
  gapMessage: string;
  fixLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PillarIcon done={done} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{done ? completeCopy : gapMessage}</p>
        {!done && (
          <Button asChild variant="outline" size="sm">
            <Link href="/case">{fixLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
