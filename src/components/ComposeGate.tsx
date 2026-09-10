"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ConsentRow } from "@/components/pricing/ConsentRow";
import ComposeView from "@/components/ComposeView";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";
import { PRICING } from "@/content/marketing";
import { pollLicenseStatus, LicensePollTimeoutError } from "@/lib/licensePoll";

type Phase = "idle" | "activating" | "active" | "timeout";

export function ComposeGate({ email }: { email?: string | null }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [consent, setConsent] = useState(false);
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;

  const startPolling = useCallback(() => {
    setPhase("activating");
    void pollLicenseStatus()
      .then(() => setPhase("active"))
      .catch((e) => {
        if (e instanceof LicensePollTimeoutError) {
          setPhase("timeout");
        }
      });
  }, []);

  if (phase === "active") {
    return <ComposeView />;
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
      <CardHeader>
        <CardTitle className="text-h2">{APP.access.composeGate.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{APP.access.composeGate.body}</p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {APP.access.composeGate.price}
        </p>
        <ConsentRow checked={consent} onCheckedChange={setConsent} idPrefix="compose-eu-consent" />
        {consent ? (
          <CheckoutButton
            priceId={priceId}
            size="lg"
            customerEmail={email ?? undefined}
            onCompleted={startPolling}
          >
            {PRICING.cta}
          </CheckoutButton>
        ) : (
          <Button size="lg" variant="outline" disabled>
            {SHARED.consentPrompt}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
