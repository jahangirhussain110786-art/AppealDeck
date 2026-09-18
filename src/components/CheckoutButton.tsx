"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getBrowserVault } from "@/lib/vault/browser";
import { loadCaseFile } from "@/lib/caseStore";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import type { Vault } from "@/core/vault/vault";
import { APP } from "@/content/app";

declare global {
  interface Window {
    // Paddle.js v2 global
    Paddle?: {
      Initialize: (opts: {
        token: string;
        eventCallback?: (event: { name: string }) => void;
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
  const completedRef = useRef(onCompleted);
  completedRef.current = onCompleted;
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const env = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";
    if (!token) {
      setError(APP.checkout.unavailableTitle);
      return;
    }

    function init(tk: string) {
      if (!window.Paddle) return;
      window.Paddle.Environment.set(env);
      window.Paddle.Initialize({
        token: tk,
        eventCallback: (event) => {
          if (event.name === "checkout.completed") {
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
      setError(APP.checkout.loadFailedTitle);
      toast.error(APP.checkout.loadFailedTitle, {
        description: APP.checkout.loadFailedDesc,
      });
    };
    document.body.appendChild(script);
    // onCompleted is read fresh via the eventCallback closure at init time;
    // re-running this effect on every onCompleted identity change would
    // reload the Paddle script unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({ caseId: file.id, kind: file.kind, consent }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 401 ? "Sign in before buying your case's Appeal Pass." : data.error,
        );
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
