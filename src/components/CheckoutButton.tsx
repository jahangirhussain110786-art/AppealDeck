"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
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
        }) => void;
      };
    };
  }
}

export function CheckoutButton({
  priceId,
  children,
  className,
  size,
  variant,
  customerEmail,
  onCompleted,
}: {
  priceId?: string;
  children: React.ReactNode;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  customerEmail?: string;
  onCompleted?: () => void;
}) {
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
            onCompleted?.();
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

  function openCheckout() {
    const id = priceId ?? process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;
    if (!window.Paddle || !id) {
      setError(APP.checkout.unavailableTitle);
      toast.error(APP.checkout.unavailableTitle, {
        description: APP.checkout.unavailableDesc,
      });
      return;
    }
    toast.info(APP.checkout.opening);
    window.Paddle.Checkout.open({
      items: [{ priceId: id }],
      customer: customerEmail ? { email: customerEmail } : undefined,
    });
  }

  return (
    <Button
      onClick={openCheckout}
      disabled={!ready}
      className={className}
      size={size}
      variant={variant}
    >
      {error ? error : children}
    </Button>
  );
}
