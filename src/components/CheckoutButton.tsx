"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

declare global {
  interface Window {
    // Paddle.js v2 global
    Paddle?: {
      Initialize: (opts: { token: string }) => void;
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
}: {
  priceId?: string;
  children: React.ReactNode;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const env = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";
    if (!token) {
      setError("Checkout not configured");
      return;
    }

    function init(tk: string) {
      if (!window.Paddle) return;
      window.Paddle.Environment.set(env);
      window.Paddle.Initialize({ token: tk });
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
      setError("Could not load checkout");
      toast.error("Checkout failed to load", {
        description: "Check your network and disable ad blockers, then try again.",
      });
    };
    document.body.appendChild(script);
  }, []);

  function openCheckout() {
    const id = priceId ?? process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;
    if (!window.Paddle || !id) {
      setError("Checkout unavailable");
      toast.error("Checkout unavailable", {
        description: "Payment is temporarily offline. Please try again in a moment.",
      });
      return;
    }
    toast.info("Opening Paddle checkout…");
    window.Paddle.Checkout.open({ items: [{ priceId: id }] });
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
