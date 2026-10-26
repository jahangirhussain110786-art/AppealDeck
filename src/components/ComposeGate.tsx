"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PurchaseClock } from "@/components/pricing/PurchaseClock";
import { ConsentRow } from "@/components/pricing/ConsentRow";
import { CaseCreditCard } from "@/components/CaseCreditCard";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";
import { PRICING } from "@/content/marketing";
import { PRODUCTS } from "@/content/purchases";
import { upgradeEnabled } from "@/lib/plans";
import type { Vault } from "@/core/vault/vault";
import { pollLicenseStatus } from "@/lib/licensePoll";

type Phase = "idle" | "activating" | "active" | "timeout";

export function ComposeGate({
  email,
  vault,
  caseId,
  onActivated,
  note,
  deadline,
}: {
  email?: string | null;
  vault?: Vault;
  caseId?: string;
  onActivated?: () => void;
  /** Shown first: why the Pass is asked for now (a One Response that has covered its response). */
  note?: string;
  /** The case's own Amazon deadline while it is still ahead, shown beside the pay button. */
  deadline?: { label: string; day: string } | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [consent, setConsent] = useState(false);
  // The gate is shown with a note only when a One Response has covered its one response; the server then
  // offers the credited price (if it exists), so the price shown here must say so too.
  const credited = Boolean(note) && upgradeEnabled();

  const startPolling = useCallback(() => {
    setPhase("activating");
    void pollLicenseStatus({ caseId })
      .then(() => {
        if (onActivated) onActivated();
        else setPhase("active");
      })
      .catch(() => setPhase("timeout"));
  }, [caseId, onActivated]);

  if (phase === "active") {
    return (
      <Button asChild>
        {/* Points straight at the workspace's Response tab — `/compose` is a retired redirect. */}
        <Link href="/case?view=response">Continue to your draft</Link>
      </Button>
    );
  }

  if (phase === "activating") {
    return (
      <Alert variant="info">
        <AlertTitle>{APP.access.composeGate.activating}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{APP.access.composeGate.activatingHint}</p>
          <Skeleton className="h-3 w-40" />
        </AlertDescription>
      </Alert>
    );
  }

  if (phase === "timeout") {
    return (
      <Alert variant="warning">
        <AlertTitle>{APP.access.composeGate.title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{APP.access.composeGate.stillWaiting}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={startPolling}>
              {APP.access.composeGate.checkAgain}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/billing">{SHARED.nav.billing}</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="workspace-hero gap-3 border-b border-border/70">
        <IconTile icon={FilePenLine} tone="info" />
        <CardTitle className="tracking-[-0.03em] text-h2 font-semibold">
          {APP.access.composeGate.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {/* A verified professional with case credits can activate this case with one. */}
        <CaseCreditCard caseId={caseId} onUsed={startPolling} />
        {note && (
          <p role="status" className="text-sm font-medium text-foreground">
            {note}
          </p>
        )}
        <p className="text-sm text-muted-foreground">{APP.access.composeGate.body}</p>
        <p className="font-mono text-xl font-medium tabular-nums text-foreground">
          {credited
            ? `${PRODUCTS.single.creditedPassPrice}, once, for this case (the ${PRODUCTS.single.price} you paid is taken off)`
            : APP.access.composeGate.price}
        </p>
        <PurchaseClock deadline={deadline} />
        <ConsentRow checked={consent} onCheckedChange={setConsent} idPrefix="compose-eu-consent" />
        {consent ? (
          <CheckoutButton
            vault={vault}
            consent={consent}
            size="lg"
            className="h-auto min-h-11 whitespace-normal py-3"
            customerEmail={email ?? undefined}
            onCompleted={startPolling}
          >
            {PRICING.cta}
          </CheckoutButton>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal py-3"
            disabled
          >
            {credited
              ? `Continue to ${PRODUCTS.single.creditedPassPrice} checkout`
              : APP.access.composeGate.continueToCheckout}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
