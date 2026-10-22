"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/content/purchases";
import { formatDate } from "@/lib/format";

type ProStatus = { verified: boolean; creditsLeft: number; creditsEndAt: string | null };

/**
 * For a verified professional with case credits, on a case that has no Pass: spend one credit to
 * give this case an Appeal Pass. It is a button the professional presses, never something a draft
 * or a check does on its own, so a credit is never spent by accident. Everyone else, and anyone with
 * no credits, sees nothing here (the Pass offer beside it is unchanged).
 */
export function CaseCreditCard({ caseId, onUsed }: { caseId?: string; onUsed: () => void }) {
  const [status, setStatus] = useState<ProStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    let alive = true;
    fetch("/api/pro/status", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<ProStatus>) : null))
      .then((data) => {
        if (alive && data) setStatus(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [caseId]);

  if (!caseId || !status?.verified) return null;
  const c = PRODUCTS.credits;
  if (status.creditsLeft <= 0)
    return (
      <p className="rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-muted-foreground">
        {c.none}.{" "}
        <Link href={c.page} className="text-link underline underline-offset-4">
          {c.buyMore}
        </Link>
      </p>
    );

  const spend = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/credits/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const body = (await res.json().catch(() => null)) as { result?: string } | null;
      if (res.ok && (body?.result === "used" || body?.result === "covered")) {
        toast.success(body.result === "used" ? c.used : c.covered);
        onUsed();
        return;
      }
      toast.error(
        body?.result === "no_credit"
          ? c.noCredit
          : body?.result === "already_used"
            ? c.alreadyUsed
            : body?.result === "not_verified"
              ? c.notVerified
              : c.failed,
      );
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Ticket aria-hidden className="size-4 text-primary" />
        {status.creditsLeft === 1 ? c.leftOne : c.left.replace("{n}", String(status.creditsLeft))}
      </p>
      <p className="text-sm text-muted-foreground">
        {c.what}
        {status.creditsEndAt
          ? ` ${c.endsOn.replace("{date}", formatDate(status.creditsEndAt))}`
          : ""}
      </p>
      <Button onClick={spend} disabled={busy} className="h-auto min-h-11 whitespace-normal py-2">
        {busy ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            {c.using}
          </>
        ) : (
          c.use
        )}
      </Button>
    </div>
  );
}
