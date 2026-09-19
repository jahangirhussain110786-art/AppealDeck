"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ConsentRow } from "@/components/pricing/ConsentRow";
import { PRICING, SAMPLE_POA } from "@/content/marketing";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";
import { useSessionState } from "@/lib/useSessionState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { pollLicenseStatus } from "@/lib/licensePoll";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";
import { getBrowserVault } from "@/lib/vault/browser";
import { loadCaseFile } from "@/lib/caseStore";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import { workspaceCanCompose } from "@/core/workspace";

type CompletionPhase = "idle" | "activating" | "timeout";
type CaseCheck =
  | { status: "checking" }
  | { status: "none" }
  | { status: "ineligible"; label: string }
  | { status: "ok"; label: string };

function caseCheckLabel(kind: string, id: string): string {
  return `${kind.toLowerCase().replaceAll("_", " ")} · #${id.slice(0, 6)}`;
}

export function PurchasePanel() {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<CompletionPhase>("idle");
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [caseCheck, setCaseCheck] = useState<CaseCheck>({ status: "checking" });
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;
  const sessionState = useSessionState();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? undefined);
    });
  }, []);

  useEffect(() => {
    if (sessionState !== "signed-in") {
      setCaseCheck({ status: "none" });
      return;
    }
    let alive = true;
    void (async () => {
      const vault = getBrowserVault();
      try {
        if (!(await openVaultForVisitor(vault))) {
          if (alive) setCaseCheck({ status: "none" });
          return;
        }
        const file = await loadCaseFile(vault);
        if (!alive) return;
        if (!file) {
          setCaseCheck({ status: "none" });
          return;
        }
        const label = caseCheckLabel(file.kind, file.id);
        setCaseCheck(
          file.workspace && !workspaceCanCompose(file.workspace)
            ? { status: "ineligible", label }
            : { status: "ok", label },
        );
      } catch {
        if (alive) setCaseCheck({ status: "none" });
      } finally {
        await vault.close();
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionState]);

  const handleCompleted = useCallback(() => {
    if (sessionState !== "signed-in") return;
    trackFunnelEvent(FUNNEL_EVENTS.purchaseCompleted);
    setPhase("activating");
    void pollLicenseStatus()
      .then(() => router.push("/compose"))
      .catch(() => setPhase("timeout"));
  }, [sessionState, router]);

  if (phase === "activating") {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">{APP.access.composeGate.activating}</p>
          <p className="text-xs text-muted-foreground">{APP.access.composeGate.activatingHint}</p>
        </div>
      </div>
    );
  }

  if (phase === "timeout") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{APP.access.composeGate.stillWaiting}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleCompleted}>
            {APP.access.composeGate.checkAgain}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/billing">{SHARED.nav.billing}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const blocked =
    sessionState === "signed-in" &&
    (caseCheck.status === "checking" ||
      caseCheck.status === "none" ||
      caseCheck.status === "ineligible");

  return (
    <div className="space-y-6">
      <ConsentRow checked={consent} onCheckedChange={setConsent} />

      {sessionState === "signed-out" && (
        <p className="text-xs text-muted-foreground">
          {APP.access.composeGate.signInToActivate}{" "}
          <Link
            href="/login?next=/compose"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {SHARED.nav.signIn}
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && caseCheck.status === "ok" && (
        <p className="text-xs text-muted-foreground">
          This Pass will cover your active case: {caseCheck.label}.
        </p>
      )}

      {sessionState === "signed-in" && caseCheck.status === "none" && (
        <p className="text-xs text-muted-foreground">
          Start your case before buying a Pass — each Pass covers one case.{" "}
          <Link href="/case" className="text-primary underline underline-offset-4">
            Start your case
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && caseCheck.status === "ineligible" && (
        <p className="text-xs text-muted-foreground">
          Your active case ({caseCheck.label}) does not currently need a drafted response — confirm
          its response route in the case workspace first.{" "}
          <Link href="/case" className="text-primary underline underline-offset-4">
            Open your case
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {consent && !blocked ? (
          <CheckoutButton
            consent={consent}
            priceId={priceId}
            size="lg"
            className="h-auto min-h-11 flex-1 whitespace-normal py-2"
            variant="default"
            customerEmail={email}
            onCompleted={handleCompleted}
          >
            {PRICING.cta}
          </CheckoutButton>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-11 flex-1 whitespace-normal py-2"
            disabled
          >
            {blocked && consent ? "Resolve your case first" : SHARED.consentPrompt}
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="link" className="whitespace-normal text-left">
              <FileText className="h-4 w-4" />
              {PRICING.samplePoa.trigger}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {SAMPLE_POA.title}
                <span className="text-xs font-normal text-muted-foreground">
                  ({SAMPLE_POA.watermark})
                </span>
              </DialogTitle>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
              {SAMPLE_POA.body}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
