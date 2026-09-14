"use client";

// EF-5 opt-in outcome sharing (src/core/outcomeModel.ts). Shown once a case reaches a terminal
// reply category (reinstated / final decision negative) and the seller hasn't already answered
// this prompt. Declining is a real, respected choice — this never re-appears once resolved.

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP } from "@/content/app";
import type { OutcomeRecord } from "@/core/outcomeModel";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";

export function OutcomeShareCard({
  record,
  onResolved,
}: {
  record: OutcomeRecord;
  onResolved: (shared: boolean) => void | Promise<void>;
}) {
  // Which button is in flight, if any — so only the clicked one spins; the other only disables
  // (14 Sep 2026: a button click should show its own loading state, not an ambiguous shared one).
  const [busy, setBusy] = useState<"decline" | "accept" | null>(null);

  const decline = async () => {
    setBusy("decline");
    try {
      await onResolved(false);
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("accept");
    try {
      const res = await fetch("/api/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (res.ok) trackFunnelEvent(FUNNEL_EVENTS.outcomeShared, { outcome: record.outcome });
      await onResolved(res.ok);
    } catch {
      await onResolved(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{APP.dashboard.outcomeShare.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{APP.dashboard.outcomeShare.body}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void decline()}
            disabled={busy !== null}
          >
            {busy === "decline" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="size-4" />
            )}
            {APP.dashboard.outcomeShare.decline}
          </Button>
          <Button size="sm" onClick={() => void share()} disabled={busy !== null}>
            {busy === "accept" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" />
            )}
            {APP.dashboard.outcomeShare.accept}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
