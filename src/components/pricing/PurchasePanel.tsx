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
import { getBrowserVault } from "@/lib/vault/browser";
import { loadCaseFile } from "@/lib/caseStore";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import { workspaceCanCompose } from "@/core/workspace";

type CompletionPhase = "idle" | "activating" | "timeout";
type CaseCheck =
  | { status: "checking" }
  | { status: "none" }
  | { status: "locked" }
  | { status: "ineligible"; label: string }
  | { status: "covered"; label: string }
  | { status: "ok"; label: string };

function caseCheckLabel(kind: string, id: string): string {
  return `${kind.toLowerCase().replaceAll("_", " ")} · #${id.slice(0, 6)}`;
}

export function PurchasePanel() {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<CompletionPhase>("idle");
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [caseCheck, setCaseCheck] = useState<CaseCheck>({ status: "checking" });
  const [hasPass, setHasPass] = useState(false);
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
    // Signed out, there is no case to check; `activeCase` below says so without an extra render.
    if (sessionState !== "signed-in") return;
    let alive = true;
    void (async () => {
      // Whether this account holds a Pass at all (any case). A Pass covers ONE case, so what the
      // page says depends on whether it is still free or already used on another case.
      const any = await fetch("/api/license/status")
        .then((r) => (r.ok ? (r.json() as Promise<{ status?: string }>) : null))
        .catch(() => null);
      if (alive) setHasPass(any?.status === "active");
      const vault = getBrowserVault();
      try {
        if (!(await openVaultForVisitor(vault))) {
          // A vault the seller protected with a passphrase cannot be read from here. That is not
          // "no case": saying so would tell someone with a case to start one.
          if (alive) setCaseCheck({ status: "locked" });
          return;
        }
        const file = await loadCaseFile(vault);
        if (!alive) return;
        if (!file) {
          setCaseCheck({ status: "none" });
          return;
        }
        const label = caseCheckLabel(file.kind, file.id);
        // A case that already has its Pass must not be offered a second one (the server refuses it
        // too). A failed lookup falls through to the normal offer, and the server decides.
        const license = await fetch(`/api/license/status?caseId=${encodeURIComponent(file.id)}`)
          .then((r) => (r.ok ? (r.json() as Promise<{ status?: string }>) : null))
          .catch(() => null);
        if (!alive) return;
        if (license?.status === "active") {
          setCaseCheck({ status: "covered", label });
          return;
        }
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

  const activeCase: CaseCheck = sessionState === "signed-in" ? caseCheck : { status: "none" };

  const handleCompleted = useCallback(() => {
    if (sessionState !== "signed-in") return;
    // `pass_purchased` is counted by CheckoutButton, the one place every purchase passes through.
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
    (activeCase.status === "checking" ||
      activeCase.status === "none" ||
      activeCase.status === "locked" ||
      activeCase.status === "ineligible" ||
      activeCase.status === "covered");

  return (
    <div className="space-y-6">
      <ConsentRow checked={consent} onCheckedChange={setConsent} />

      {sessionState === "signed-out" && (
        <p className="text-xs text-muted-foreground">
          {APP.access.composeGate.signInToActivate}{" "}
          <Link
            href="/login?next=/compose"
            className="text-link underline underline-offset-4 hover:text-link/80"
          >
            {SHARED.nav.signIn}
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && activeCase.status === "ok" && (
        <p className="text-xs text-muted-foreground">
          {hasPass
            ? `Your Appeal Pass is already used on another case. A new Pass would cover this one: ${activeCase.label}.`
            : `This Pass will cover your active case: ${activeCase.label}.`}
        </p>
      )}

      {sessionState === "signed-in" && activeCase.status === "none" && (
        <p className="text-xs text-muted-foreground">
          {hasPass
            ? "Your Appeal Pass covers one case, and it is still available. Start your case to use it."
            : "Start your case before buying a Pass — each Pass covers one case."}{" "}
          <Link href="/case" className="text-link underline underline-offset-4">
            Start your case
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && activeCase.status === "locked" && (
        <p className="text-xs text-muted-foreground">
          Your case is protected by your vault passphrase, so this page cannot see it. Unlock it,
          then come back to buy the Pass.{" "}
          <Link href="/case" className="text-link underline underline-offset-4">
            Open your case
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && activeCase.status === "covered" && (
        <p className="text-xs text-muted-foreground">
          Your Appeal Pass covers one case: {activeCase.label}. It covers every revision of that
          case, so there is nothing more to buy.{" "}
          <Link href="/case" className="text-link underline underline-offset-4">
            Open your case
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && activeCase.status === "ineligible" && (
        <p className="text-xs text-muted-foreground">
          Your active case ({activeCase.label}) does not currently need a drafted response — confirm
          its response route in the case workspace first.{" "}
          <Link href="/case" className="text-link underline underline-offset-4">
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
            {hasPass && activeCase.status === "ok"
              ? "Buy another Pass for another case"
              : PRICING.cta}
          </CheckoutButton>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-11 flex-1 whitespace-normal py-2"
            disabled
          >
            {activeCase.status === "covered"
              ? "Appeal Pass active — covers one case"
              : blocked && consent
                ? "Resolve your case first"
                : SHARED.consentPrompt}
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
