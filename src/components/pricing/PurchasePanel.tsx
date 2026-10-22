"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGuideSituation } from "@/lib/guideSignal";
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
import { PartnerCodeNote } from "@/components/pricing/PartnerCodeNote";
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
import { formatDate } from "@/lib/format";
import { PRODUCTS } from "@/content/purchases";
import type { PassPlan } from "@/lib/plans";

type CompletionPhase = "idle" | "activating" | "timeout";
type CaseCheck =
  | { status: "checking" }
  | { status: "none" }
  | { status: "locked" }
  | { status: "ineligible"; label: string }
  | { status: "covered"; label: string; coveredBy: string | null; expiresAt: string | null }
  | { status: "ok"; label: string };

function caseCheckLabel(kind: string, id: string): string {
  return `${kind.toLowerCase().replaceAll("_", " ")} · #${id.slice(0, 6)}`;
}

export function PurchasePanel({
  plan = "case",
  onReviewState,
}: {
  plan?: PassPlan;
  /** Told whether the case already has a document review, which takes its price off the Appeal Pass. */
  onReviewState?: (hasReview: boolean) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<CompletionPhase>("idle");
  useGuideSituation(
    phase === "timeout"
      ? "pricing.delayed"
      : phase === "activating"
        ? "pricing.activating"
        : consent
          ? "pricing.ready"
          : null,
  );
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [caseCheck, setCaseCheck] = useState<CaseCheck>({ status: "checking" });
  const [hasPass, setHasPass] = useState(false);
  // Whether this case already has a document review (the AI reading), asked of the same lookup.
  const [caseHasReview, setCaseHasReview] = useState(false);
  // The case the checkout is for, so activation is asked about THAT case and not any Pass on the account.
  const [checkedCaseId, setCheckedCaseId] = useState<string | undefined>(undefined);
  const pollAbort = useRef<AbortController | null>(null);
  useEffect(() => () => pollAbort.current?.abort(), []);
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
        setCheckedCaseId(file.id);
        const label = caseCheckLabel(file.kind, file.id);
        // A case that already has its Pass must not be offered a second one (the server refuses it
        // too). A failed lookup falls through to the normal offer, and the server decides.
        const license = await fetch(`/api/license/status?caseId=${encodeURIComponent(file.id)}`)
          .then((r) =>
            r.ok
              ? (r.json() as Promise<{
                  status?: string;
                  plan?: string | null;
                  expiresAt?: string | null;
                  hasReview?: boolean;
                }>)
              : null,
          )
          .catch(() => null);
        if (!alive) return;
        setCaseHasReview(license?.hasReview === true);
        onReviewState?.(license?.hasReview === true);
        if (license?.status === "active") {
          setCaseCheck({
            status: "covered",
            label,
            coveredBy: license.plan ?? null,
            expiresAt: license.expiresAt ?? null,
          });
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
  }, [sessionState, onReviewState]);

  const activeCase: CaseCheck = sessionState === "signed-in" ? caseCheck : { status: "none" };

  const handleCompleted = useCallback(() => {
    if (sessionState !== "signed-in") return;
    // `pass_purchased` is counted by CheckoutButton, the one place every purchase passes through.
    setPhase("activating");
    pollAbort.current?.abort();
    const abort = new AbortController();
    pollAbort.current = abort;
    // A document review is not a Pass: its activation is the AI reading becoming available, and the
    // seller goes to their documents, not to the response.
    const review = plan === "review";
    void pollLicenseStatus({
      caseId: checkedCaseId,
      signal: abort.signal,
      ...(review ? { forDocuments: true } : {}),
    })
      .then(() => {
        // Not if the seller has left this page meanwhile: the poll must not pull them back out.
        if (!abort.signal.aborted) router.push(review ? "/case?view=evidence" : "/compose");
      })
      .catch(() => {
        if (!abort.signal.aborted) setPhase("timeout");
      });
  }, [sessionState, router, checkedCaseId, plan]);

  if (phase === "activating") {
    return (
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">{APP.access.composeGate.activating}</p>
          <p className="text-xs text-muted-foreground">{APP.access.composeGate.activatingHint}</p>
        </div>
      </div>
    );
  }

  if (phase === "timeout") {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
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

  // A case Pass covers one case, so its holder may still buy the Account Pass; an Account Pass
  // covers every case, so nothing more is sold to its holder (the server refuses it too).
  // A document review is bought to read documents, so it asks nothing of whether a response can be
  // drafted; and a case already covered by any Pass, or already reviewed, has no use for one.
  const coveredAgainstThisPlan =
    activeCase.status === "covered" &&
    (plan === "case" || plan === "review" || activeCase.coveredBy === "account_pass");
  const reviewAlreadyBought = plan === "review" && caseHasReview && activeCase.status !== "covered";
  const ineligibleForThis = activeCase.status === "ineligible" && plan !== "review";
  const blocked =
    sessionState === "signed-in" &&
    (activeCase.status === "checking" ||
      activeCase.status === "none" ||
      activeCase.status === "locked" ||
      ineligibleForThis ||
      reviewAlreadyBought ||
      coveredAgainstThisPlan);

  return (
    <div className="space-y-6">
      <ConsentRow checked={consent} onCheckedChange={setConsent} plan={plan} />
      <PartnerCodeNote />

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

      {sessionState === "signed-in" &&
        (activeCase.status === "ok" ||
          (activeCase.status === "ineligible" && plan === "review")) && (
          <p className="text-xs text-muted-foreground">
            {plan === "review"
              ? `The AI reading will cover your active case, ${activeCase.label}: up to five documents. The review's price comes off the Appeal Pass for this case later.`
              : plan === "account"
                ? `This Account Pass will cover your active case, ${activeCase.label}, and every other case on your account for 12 months.`
                : hasPass
                  ? `Your Appeal Pass is already used on another case. A new Pass would cover this one: ${activeCase.label}.`
                  : `This Pass will cover your active case: ${activeCase.label}.`}
          </p>
        )}

      {sessionState === "signed-in" && activeCase.status === "none" && (
        <p className="text-xs text-muted-foreground">
          {hasPass
            ? "Your Appeal Pass is tied to the case it was bought for. If you deleted that case or cleared your browser without a backup, a new case needs its own Pass."
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

      {sessionState === "signed-in" &&
        activeCase.status === "covered" &&
        plan === "account" &&
        activeCase.coveredBy !== "account_pass" && (
          <p className="text-xs text-muted-foreground">
            Your Appeal Pass covers one case: {activeCase.label}. The Account Pass would cover every
            other case on your account too.
          </p>
        )}

      {sessionState === "signed-in" && reviewAlreadyBought && (
        <p className="text-xs text-muted-foreground">
          This case already has an AI document review.{" "}
          <Link href="/case?view=evidence" className="text-link underline underline-offset-4">
            Open your documents
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && coveredAgainstThisPlan && (
        <p className="text-xs text-muted-foreground">
          {plan === "review"
            ? "This case already has a Pass, which includes the AI reading of your documents."
            : activeCase.status === "covered" && activeCase.coveredBy === "account_pass"
              ? PRICING.account.covered.until.replace(
                  "{date}",
                  activeCase.expiresAt
                    ? formatDate(activeCase.expiresAt)
                    : "the end of its 12 months",
                )
              : `Your Appeal Pass covers one case: ${activeCase.label}. It covers every revision of that case, so there is nothing more to buy.`}{" "}
          <Link href="/case" className="text-link underline underline-offset-4">
            Open your case
          </Link>
        </p>
      )}

      {sessionState === "signed-in" && ineligibleForThis && (
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
            plan={plan}
            size="lg"
            className="h-auto min-h-11 flex-1 whitespace-normal py-2"
            variant="default"
            customerEmail={email}
            onCompleted={handleCompleted}
          >
            {plan === "review"
              ? PRODUCTS.review.cta
              : plan === "account"
                ? PRICING.account.cta
                : hasPass && activeCase.status === "ok"
                  ? "Buy another Pass for another case"
                  : PRICING.cta}
          </CheckoutButton>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-11 flex-1 cursor-not-allowed whitespace-normal py-2 opacity-60"
            // aria-disabled rather than disabled: the button stays reachable by keyboard, so its
            // label (which says what is missing) is read instead of being skipped.
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
          >
            {coveredAgainstThisPlan
              ? activeCase.status === "covered" && activeCase.coveredBy === "account_pass"
                ? "Account Pass active — covers every case"
                : "Appeal Pass active — covers one case"
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
