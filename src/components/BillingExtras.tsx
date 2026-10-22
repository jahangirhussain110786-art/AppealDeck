"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ConsentRow } from "@/components/pricing/ConsentRow";
import { PRODUCTS } from "@/content/purchases";
import { formatDate } from "@/lib/format";
import { professionalsEnabled, renewalEnabled } from "@/lib/plans";
import { coverHasEnded, renewalClosesOn, renewalOpensOn, renewalWindow } from "@/lib/renewal";

type ProStatus = {
  verified: boolean;
  creditsLeft: number;
  creditsEndAt: string | null;
  proPlanActive: boolean;
};

const card = "space-y-3 rounded-[18px] bg-card p-6 shadow-card ring-1 ring-inset ring-border";

/**
 * The parts of Billing for the newer products (22 Oct 2026): renewing an Account Pass that is ending,
 * and, for a verified professional, the case credits and a way to cancel the Pro plan. Each shows only
 * when it applies, so a seller with one Appeal Pass sees exactly the page they always have.
 */
export function BillingExtras({
  accountExpiresAt,
  isAccountPass,
  email,
}: {
  accountExpiresAt: string | null;
  isAccountPass: boolean;
  email?: string;
}) {
  return (
    <>
      {isAccountPass && accountExpiresAt && (
        <RenewalCard expiresAt={accountExpiresAt} email={email} />
      )}
      <ProCard />
    </>
  );
}

function RenewalCard({ expiresAt, email }: { expiresAt: string; email?: string }) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  if (!renewalEnabled()) return null;
  const r = PRODUCTS.renewal;
  const phase = renewalWindow(expiresAt);
  const text =
    phase === "early"
      ? r.ending
          .replace("{date}", formatDate(expiresAt))
          .replace("{opens}", formatDate(renewalOpensOn(expiresAt)))
      : phase === "open" && !coverHasEnded(expiresAt)
        ? r.open.replace("{date}", formatDate(expiresAt))
        : r.ended
            .replace("{date}", formatDate(expiresAt))
            .replace("{closes}", formatDate(renewalClosesOn(expiresAt)));
  return (
    <section className={card} aria-labelledby="renewal-title">
      <h2 id="renewal-title" className="text-[0.9375rem] font-semibold text-foreground">
        {PRODUCTS.billing.renewalTitle}
      </h2>
      <p className="text-sm text-muted-foreground">{text}</p>
      {phase !== "closed" &&
        (done ? (
          <p role="status" className="text-sm text-foreground">
            Thank you. Your renewal is being added; this page updates in a moment.
          </p>
        ) : (
          phase === "open" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.summary}</p>
              <ConsentRow
                checked={consent}
                onCheckedChange={setConsent}
                plan="renewal"
                idPrefix="renewal-consent"
              />
              <CheckoutButton
                plan="renewal"
                consent={consent}
                customerEmail={email}
                onCompleted={() => {
                  setDone(true);
                  window_refresh(router.refresh);
                }}
                className="h-auto min-h-11 whitespace-normal py-2"
              >
                {r.cta} · {r.price}
              </CheckoutButton>
            </div>
          )
        ))}
    </section>
  );
}

/** Refresh the page a few times, since the renewal is added by the payment webhook a moment later. */
function window_refresh(refresh: () => void) {
  for (const ms of [3000, 8000, 20000]) setTimeout(refresh, ms);
}

function ProCard() {
  const [status, setStatus] = useState<ProStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
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
  }, []);

  // Someone who holds credits or a subscription keeps seeing them even if sales are switched off.
  if (!status?.verified) return null;
  if (!professionalsEnabled() && status.creditsLeft <= 0 && !status.proPlanActive) return null;
  const c = PRODUCTS.credits;
  const b = PRODUCTS.billing;

  const manage = async () => {
    setBusy(true);
    setFallback(false);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { url?: string } | null;
      if (res.ok && body?.url) {
        window.open(body.url, "_blank", "noopener,noreferrer");
        return;
      }
      setFallback(true);
    } catch {
      setFallback(true);
      toast.error(b.manageFallback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={card} aria-labelledby="credits-title">
      <h2 id="credits-title" className="text-[0.9375rem] font-semibold text-foreground">
        {b.creditsTitle}
      </h2>
      <p className="text-lg font-semibold tabular-nums tracking-[-0.02em]">
        {status.creditsLeft === 0
          ? c.none
          : status.creditsLeft === 1
            ? c.leftOne
            : c.left.replace("{n}", String(status.creditsLeft))}
      </p>
      <p className="text-sm text-muted-foreground">
        {c.what}
        {status.creditsEndAt
          ? ` ${c.endsOn.replace("{date}", formatDate(status.creditsEndAt))}`
          : ""}
      </p>
      {status.proPlanActive && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">{b.proActive}</p>
          <Button variant="outline" onClick={manage} disabled={busy} className="min-h-11">
            {busy ? b.managing : b.manage}
          </Button>
          {fallback && (
            <p role="status" className="text-sm text-muted-foreground">
              {b.manageFallback}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
