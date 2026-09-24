"use client";

import { ScrollText, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  describeContradiction,
  describeSource,
  FACT_STATUS_LABELS,
  type FactsLedger,
  type FactStatus,
} from "@/core/factsLedger";

/**
 * AA-41/AA-42 carry-forward: what this case actually knows, and where each piece came from.
 *
 * Contradictions are shown first and framed as a question for the seller, never as a correction.
 * The product has no way to know whether the invoice or the seller's memory is right — only that
 * an appeal whose narrative disagrees with its own exhibit is an appeal with a hole in it.
 */
export function FactsLedgerCard({ ledger }: { ledger: FactsLedger }) {
  if (ledger.facts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <ScrollText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">What this case knows</CardTitle>
          <p className="text-sm text-muted-foreground">
            Every line below came from your notice, your own answers, or a document you uploaded.
            Nothing here was assumed.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ledger.contradictions.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert className="size-4" aria-hidden />
            <AlertTitle>
              {ledger.contradictions.length === 1
                ? "One thing does not match"
                : `${ledger.contradictions.length} things do not match`}
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-2">
                {ledger.contradictions.map((fact, i) => (
                  // A label is not unique: a document can disagree with the notice about a field
                  // that another document also reports, so the position is part of the key.
                  <li key={`${fact.label}-${i}`}>{describeContradiction(fact)}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <ul className="space-y-3">
          {ledger.facts.map((fact, i) => (
            <li key={`${fact.label}-${fact.status}-${i}`} className="space-y-1">
              <p className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="font-medium text-foreground">{fact.label}</span>
                <Badge variant={badgeVariant(fact.status)} className="text-xs">
                  {FACT_STATUS_LABELS[fact.status]}
                </Badge>
              </p>
              {fact.value ? (
                <p className="font-mono text-sm text-foreground">{fact.value}</p>
              ) : (
                // No agreed value on a contradiction — showing one would be picking a winner.
                <ul className="space-y-0.5">
                  {fact.entries.map((e, i) => (
                    <li key={i} className="font-mono text-sm text-foreground">
                      {e.value}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                {fact.entries.map((e) => describeSource(e.source)).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function badgeVariant(status: FactStatus): "success" | "warning" | "secondary" {
  if (status === "corroborated") return "success";
  if (status === "contradicted") return "warning";
  return "secondary";
}
