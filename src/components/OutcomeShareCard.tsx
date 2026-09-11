"use client";

// EF-5 opt-in outcome sharing (src/core/outcomeModel.ts). Shown once a case reaches a terminal
// reply category (reinstated / final decision negative) and the seller hasn't already answered
// this prompt. Declining is a real, respected choice — this never re-appears once resolved.

import { useState } from "react";
import { Check, X } from "lucide-react";
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
  onResolved: (shared: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  const share = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (res.ok) trackFunnelEvent(FUNNEL_EVENTS.outcomeShared, { outcome: record.outcome });
      onResolved(res.ok);
    } catch {
      onResolved(false);
    } finally {
      setBusy(false);
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
          <Button size="sm" variant="outline" onClick={() => onResolved(false)} disabled={busy}>
            <X className="size-4" />
            {APP.dashboard.outcomeShare.decline}
          </Button>
          <Button size="sm" onClick={share} disabled={busy}>
            <Check className="size-4" />
            {APP.dashboard.outcomeShare.accept}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
