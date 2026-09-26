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
import { ConsentRow } from "@/components/pricing/ConsentRow";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";
import { PRICING } from "@/content/marketing";
import type { Vault } from "@/core/vault/vault";
import { pollLicenseStatus } from "@/lib/licensePoll";

type Phase = "idle" | "activating" | "active" | "timeout";

export function ComposeGate({
  email,
  vault,
  caseId,
  onActivated,
}: {
  email?: string | null;
  vault?: Vault;
  caseId?: string;
  onActivated?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [consent, setConsent] = useState(false);
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;

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
        <p className="text-sm text-muted-foreground">{APP.access.composeGate.body}</p>
        <p className="font-mono text-xl font-medium tabular-nums text-foreground">
          {APP.access.composeGate.price}
        </p>
        <ConsentRow checked={consent} onCheckedChange={setConsent} idPrefix="compose-eu-consent" />
        {consent ? (
          <CheckoutButton
            vault={vault}
            consent={consent}
            priceId={priceId}
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
            {SHARED.consentPrompt}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
