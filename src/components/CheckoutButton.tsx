"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getBrowserVault } from "@/lib/vault/browser";
import { loadCaseFile } from "@/lib/caseStore";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import type { Vault } from "@/core/vault/vault";
import { APP } from "@/content/app";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";

declare global {
  interface Window {
    // Paddle.js v2 global
    Paddle?: {
      Initialize: (opts: {
        token: string;
        eventCallback?: (event: { name: string; data?: { transaction_id?: string } }) => void;
      }) => void;
      Environment: { set: (env: "sandbox" | "production") => void };
      Checkout: {
        open: (opts: {
          items: { priceId: string }[];
          settings?: { displayMode?: "overlay" | "inline" };
          customer?: { email?: string };
          customData?: { checkout_intent_id: string };
        }) => void;
      };
    };
  }
}

/**
 * Transactions already counted on this page. Module-level, so a remounted button or a second
 * Paddle callback for the same transaction is not counted twice.
 */
const countedTransactions = new Set<string>();

/**
 * `pass_purchased`, sent from here since 23 Sep 2026. It was sent by `PurchasePanel` on /pricing
 * only, so a Pass bought through the compose gate — the path a seller in the middle of a case
 * takes — was never counted, and a retried completion on /pricing could count one twice. This is
 * the one place both paths pass through. Revenue itself is reported from the Paddle webhook; this
 * event is only the funnel step.
 */
function countPurchaseOnce(transactionId: string | undefined): void {
  const key = transactionId ?? "unidentified";
  if (countedTransactions.has(key)) return;
  countedTransactions.add(key);
  trackFunnelEvent(FUNNEL_EVENTS.passPurchased);
}

export function CheckoutButton({
  children,
  className,
  size,
  variant,
  customerEmail,
  onCompleted,
  consent = false,
  vault: sharedVault,
}: {
  priceId?: string;
  children: React.ReactNode;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  customerEmail?: string;
  onCompleted?: () => void;
  consent?: boolean;
  vault?: Vault;
}) {
  // Kept current in an effect, never written during render; Paddle calls it long after either.
  const completedRef = useRef(onCompleted);
  useEffect(() => {
    completedRef.current = onCompleted;
  }, [onCompleted]);
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Inlined at build time, so a missing token is known during render rather than set from an
  // effect one render later.
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const error = token ? loadError : APP.checkout.unavailableTitle;

  useEffect(() => {
    const env = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";
    if (!token) return;

    function init(tk: string) {
      if (!window.Paddle) return;
      window.Paddle.Environment.set(env);
      window.Paddle.Initialize({
        token: tk,
        eventCallback: (event) => {
          if (event.name === "checkout.completed") {
            countPurchaseOnce(event.data?.transaction_id);
            completedRef.current?.();
          }
        },
      });
      setReady(true);
    }

    if (window.Paddle) {
      init(token);
      return;
    }

    const existing = document.getElementById("paddle-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => init(token));
      return;
    }

    const script = document.createElement("script");
    script.id = "paddle-js";
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => init(token);
    script.onerror = () => {
      setLoadError(APP.checkout.loadFailedTitle);
      toast.error(APP.checkout.loadFailedTitle, {
        description: APP.checkout.loadFailedDesc,
      });
    };
    document.body.appendChild(script);
    // onCompleted is read through completedRef when Paddle fires, so this effect does not re-run
    // (and reload the Paddle script) whenever the callback identity changes.
  }, [token]);

  async function openCheckout() {
    if (opening || !consent || !window.Paddle) return;
    setOpening(true);
    const vault = sharedVault ?? getBrowserVault();
    try {
      if (!(await openVaultForVisitor(vault))) throw new Error("Unlock your case before checkout.");
      const file = await loadCaseFile(vault);
      if (!file)
        throw new Error("Start your case before buying an Appeal Pass. Each Pass covers one case.");
      const response = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: file.id,
          kind: file.kind,
          consent,
          workspace: file.workspace,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 401 ? "Sign in before buying your case's Appeal Pass." : data.error,
        );
      // B-12: fired here rather than on the button click, so the gap between this and
      // `pass_purchased` is abandonment at the payment step and nothing else. A click that fails
      // to reach Paddle (locked vault, no case, intent rejected) is a different problem and must
      // not be counted as an opened checkout.
      trackFunnelEvent(FUNNEL_EVENTS.checkoutOpened);
      window.Paddle.Checkout.open({
        items: [{ priceId: data.priceId }],
        customer: customerEmail ? { email: customerEmail } : undefined,
        customData: { checkout_intent_id: data.intentId },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout could not open.");
    } finally {
      setOpening(false);
      if (!sharedVault) await vault.close();
    }
  }

  return (
    <Button
      onClick={openCheckout}
      disabled={!ready || opening || !consent}
      className={className}
      size={size}
      variant={variant}
    >
      {opening ? "Preparing checkout…" : error ? error : children}
    </Button>
  );
}
