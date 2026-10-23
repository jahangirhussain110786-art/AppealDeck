"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ConsentRow } from "@/components/pricing/ConsentRow";
import { Button } from "@/components/ui/button";
import { OPENS_SOON, PRODUCTS, PRO_VERIFICATION } from "@/content/purchases";
import { SUPPORT_EMAIL } from "@/content/support";
import { formatDate } from "@/lib/format";
import {
  pack10PriceId,
  pack30PriceId,
  previewPlans,
  proPlanPriceId,
  type PassPlan,
} from "@/lib/plans";
import { useSessionState } from "@/lib/useSessionState";

type ProStatus = {
  verified: boolean;
  creditsLeft: number;
  creditsEndAt: string | null;
  proPlanActive: boolean;
};

type ProPlan = Extract<PassPlan, "pack10" | "pack30" | "pro">;

// `sale`: its Paddle price is set, so it can be bought. A product that is only previewed is shown with
// its price and "Opens soon" (see `previewPlans()`), and nothing below lets anyone buy it.
const OPTIONS: { plan: ProPlan; sale: () => boolean }[] = [
  { plan: "pack10", sale: () => pack10PriceId() !== undefined },
  { plan: "pack30", sale: () => pack30PriceId() !== undefined },
  { plan: "pro", sale: () => proPlanPriceId() !== undefined },
];

const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Verify me as a professional")}`;

/**
 * The professionals' prices and the way to buy them, on /for-professionals (22 Oct 2026). Sign-in
 * and verification come first, because a pack or a Pro plan bought by someone we have not verified
 * is refused by the server and by the database: the page says so before a card is taken.
 */
export function ProPurchase() {
  const session = useSessionState();
  const [pro, setPro] = useState<ProStatus | null>(null);
  const [choice, setChoice] = useState<ProPlan | null>(null);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const before = useRef<ProStatus | null>(null);

  const available = OPTIONS.filter((o) => o.sale()).map((o) => o.plan);
  const listed = OPTIONS.filter((o) => o.sale() || previewPlans()).map((o) => o.plan);

  useEffect(() => {
    if (session !== "signed-in") return;
    let alive = true;
    fetch("/api/pro/status", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<ProStatus>) : null))
      .then((data) => {
        if (alive && data) setPro(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [session]);

  const selected: ProPlan | null =
    choice && available.includes(choice) ? choice : (available[0] ?? null);
  if (listed.length === 0) return null;

  const details = {
    pack10: {
      name: PRODUCTS.pack10.name,
      price: PRODUCTS.pack10.price,
      note: `${PRODUCTS.pack10.each} a case`,
      amount: PRODUCTS.pack10.amount,
      cta: PRODUCTS.pack10.cta,
    },
    pack30: {
      name: PRODUCTS.pack30.name,
      price: PRODUCTS.pack30.price,
      note: `${PRODUCTS.pack30.each} a case`,
      amount: PRODUCTS.pack30.amount,
      cta: PRODUCTS.pack30.cta,
    },
    pro: {
      name: PRODUCTS.pro.name,
      price: `${PRODUCTS.pro.price} ${PRODUCTS.pro.per}`,
      note: PRODUCTS.pro.summary,
      amount: PRODUCTS.pro.amount,
      cta: PRODUCTS.pro.cta,
    },
  } as const;

  // After a payment, ask until the credits (or the subscription) show up: the webhook adds them.
  const onCompleted = () => {
    before.current = pro;
    setMessage("Thank you. Your purchase is being added; this updates in a moment.");
    let tries = 0;
    const tick = async () => {
      tries += 1;
      const res = await fetch("/api/pro/status", { cache: "no-store" }).catch(() => null);
      const data = res?.ok ? ((await res.json().catch(() => null)) as ProStatus | null) : null;
      if (data) {
        setPro(data);
        const was = before.current;
        if (
          data.creditsLeft > (was?.creditsLeft ?? 0) ||
          (data.proPlanActive && !was?.proPlanActive)
        ) {
          setMessage("Done. Your credits are on your account.");
          return;
        }
      }
      if (tries < 30) setTimeout(tick, 3000);
      else
        setMessage(
          "It is taking longer than usual. Your credits will appear here and in Billing as soon as the payment is confirmed.",
        );
    };
    setTimeout(tick, 3000);
  };

  return (
    <section id="buy" aria-labelledby="pro-buy-title" className="scroll-mt-24 space-y-5">
      <h2 id="pro-buy-title" className="text-lg font-semibold tracking-[-0.02em] text-foreground">
        {PRO_VERIFICATION.title}
      </h2>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {PRO_VERIFICATION.body}
      </p>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {PRODUCTS.credits.what}
      </p>

      {available.length === 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-1 p-4">
          <p className="text-sm text-muted-foreground">{OPENS_SOON.professionals}</p>
          <Button asChild variant="outline">
            <a href={mailto}>Ask to be verified</a>
          </Button>
        </div>
      )}

      {available.length > 0 && session === "signed-out" && (
        <p className="text-sm text-muted-foreground">
          <Link
            href="/login?next=/for-professionals"
            className="text-link underline underline-offset-4"
          >
            {PRO_VERIFICATION.signIn}
          </Link>
        </p>
      )}

      {available.length > 0 && session === "signed-in" && pro && !pro.verified && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-1 p-4">
          <p className="text-sm font-medium text-foreground">{PRO_VERIFICATION.notVerified}</p>
          <p className="text-sm text-muted-foreground">{PRO_VERIFICATION.how}</p>
          <Button asChild variant="outline">
            <a href={mailto}>Ask to be verified</a>
          </Button>
        </div>
      )}

      {selected && session === "signed-in" && pro?.verified && (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Check aria-hidden className="size-4 text-success" />
            {PRO_VERIFICATION.verified}{" "}
            {pro.creditsLeft > 0
              ? pro.creditsLeft === 1
                ? PRODUCTS.credits.leftOne
                : PRODUCTS.credits.left.replace("{n}", String(pro.creditsLeft))
              : PRODUCTS.credits.none}
            {pro.creditsEndAt
              ? `. ${PRODUCTS.credits.endsOn.replace("{date}", formatDate(pro.creditsEndAt))}`
              : "."}
          </p>
          {available.length > 1 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">What to buy</legend>
              <div className="grid gap-2">
                {available.map((plan) => (
                  <label
                    key={plan}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-1 px-3.5 py-2.5 text-sm has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <input
                      type="radio"
                      name="pro-plan"
                      value={plan}
                      checked={selected === plan}
                      onChange={() => {
                        setChoice(plan);
                        setConsent(false);
                      }}
                      className="size-4 accent-[hsl(var(--primary))]"
                    />
                    <span className="flex flex-1 items-baseline justify-between gap-3">
                      <span className="font-medium text-foreground">{details[plan].name}</span>
                      <span className="font-semibold tabular-nums">{details[plan].price}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <ConsentRow
            checked={consent}
            onCheckedChange={setConsent}
            plan={selected}
            idPrefix="pro-consent"
          />
          <CheckoutButton
            key={selected}
            plan={selected}
            consent={consent}
            onCompleted={onCompleted}
            className="h-auto min-h-11 whitespace-normal py-2"
          >
            {details[selected].cta} · {details[selected].price}
          </CheckoutButton>
          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
