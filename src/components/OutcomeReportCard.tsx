"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PRODUCTS } from "@/content/purchases";
import { formatDate } from "@/lib/format";
import { rebateEnabled } from "@/lib/plans";

type Info = { offered: boolean; eligible: boolean; deadline: string | null };
const RESULTS = ["approved", "rejected", "no_response", "withdrawn"] as const;

/**
 * The $25 outcome-report rebate (22 Oct 2026), on the dashboard of someone who paid for a Pass in
 * the last 120 days. It appears only while the offer is switched on and the account has a payment to
 * refund against. The report is tied to the account, which the card says in its first lines; it is
 * separate from the anonymous share, and the same $25 is refunded whatever the result.
 */
export function OutcomeReportCard() {
  const [info, setInfo] = useState<Info | null>(null);
  const [result, setResult] = useState<string>("");
  const [days, setDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!rebateEnabled()) return;
    let alive = true;
    fetch("/api/outcome/report", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Info>) : null))
      .then((data) => {
        if (alive && data) setInfo(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const c = PRODUCTS.rebate;
  if (done)
    return (
      <p
        role="status"
        className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-foreground"
      >
        {c.done}
      </p>
    );
  if (!rebateEnabled() || !info?.offered || !info.eligible) return null;

  const send = async () => {
    if (!result) return;
    setBusy(true);
    try {
      const n = days.trim() === "" ? undefined : Number(days);
      const res = await fetch("/api/outcome/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          ...(n !== undefined && Number.isInteger(n) && n >= 0 ? { daysToOutcome: n } : {}),
        }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const body = (await res.json().catch(() => null)) as { code?: string } | null;
      toast.error(
        body?.code === "already_reported"
          ? c.already
          : body?.code === "not_eligible"
            ? c.notEligible
            : c.failed,
      );
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">{c.title}</p>
          <p className="text-sm text-muted-foreground">{c.body}</p>
          {info.deadline && (
            <p className="text-xs text-muted-foreground">
              {c.deadline.replace("{date}", formatDate(info.deadline))}
            </p>
          )}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">{c.resultLabel}</legend>
          <div className="grid gap-2">
            {RESULTS.map((value) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-1 px-3.5 py-2 text-sm has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <input
                  type="radio"
                  name="outcome-report-result"
                  value={value}
                  checked={result === value}
                  onChange={() => setResult(value)}
                  className="size-4 accent-[hsl(var(--primary))]"
                />
                {c.results[value]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor="outcome-report-days" className="text-sm font-medium text-foreground">
            {c.days}
          </label>
          <Input
            id="outcome-report-days"
            type="number"
            inputMode="numeric"
            min={0}
            max={3650}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="max-w-[10rem]"
          />
        </div>
        <Button onClick={send} disabled={!result || busy} className="min-h-11">
          {busy ? (
            <>
              <Loader2 aria-hidden className="animate-spin" />
              {c.sending}
            </>
          ) : (
            c.submit
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
