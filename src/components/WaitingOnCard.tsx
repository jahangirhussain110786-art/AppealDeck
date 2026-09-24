"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP } from "@/content/app";
import { formatDate } from "@/lib/format";
import type { CaseLog } from "@/lib/caseStore";

const inputStyle =
  "h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * AA-40: a case blocked on a supplier used to sit in "Evidence gathering", which reads as the
 * seller not having done their homework. Recording who they are waiting on gives the clock a date
 * to chase.
 *
 * Extracted from the dashboard on 23 Sep 2026, where it rendered only for classic cases — so no
 * workspace case, which is every case started since the interview was retired, could record it.
 */
export function WaitingOnCard({
  log,
  onSaveLog,
}: {
  log: CaseLog;
  /** Resolves false when the write failed, having already told the seller. */
  onSaveLog: (log: CaseLog) => Promise<boolean>;
}) {
  const copy = APP.dashboard.clock;

  // Passing `undefined` clears the note entirely, which is why the field is spread away rather than
  // set to undefined — a stored `waitingOn: undefined` would still satisfy `log.waitingOn` checks
  // after a round trip through the vault.
  const save = async (waitingOn: CaseLog["waitingOn"]) => {
    const { waitingOn: _drop, ...rest } = log;
    void _drop;
    const ok = await onSaveLog(waitingOn ? { ...rest, waitingOn } : rest);
    if (ok) toast.success(waitingOn ? copy.waitingSaved : copy.waitingCleared);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{copy.waitingTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{copy.waitingDescription}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block">{copy.waitingPartyLabel}</span>
            <input
              className={inputStyle}
              type="text"
              defaultValue={log.waitingOn?.party ?? ""}
              placeholder={copy.waitingPartyPlaceholder}
              onBlur={(event) => {
                const party = event.target.value.trim();
                if (!party || party === log.waitingOn?.party) return;
                void save({
                  party,
                  since: log.waitingOn?.since ?? new Date().toISOString(),
                  followUpAt: log.waitingOn?.followUpAt,
                });
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">{copy.waitingFollowUpLabel}</span>
            <input
              className={inputStyle}
              type="date"
              // Disabled rather than silently ignored until there is someone to chase.
              disabled={!log.waitingOn?.party}
              value={log.waitingOn?.followUpAt?.slice(0, 10) ?? ""}
              onChange={(event) => {
                const party = log.waitingOn?.party;
                // Without a named party there is nothing to chase; the date alone would produce a
                // clock item reading "Chase undefined".
                if (!party) return;
                const value = event.target.value;
                void save({
                  party,
                  since: log.waitingOn?.since ?? new Date().toISOString(),
                  followUpAt: value ? `${value}T00:00:00Z` : undefined,
                });
              }}
            />
          </label>
          {log.waitingOn && (
            <Button type="button" variant="outline" onClick={() => void save(undefined)}>
              {copy.waitingClear}
            </Button>
          )}
        </div>
        {log.waitingOn && (
          <p className="text-xs text-muted-foreground">
            {copy.waitingSince} {formatDate(log.waitingOn.since)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
