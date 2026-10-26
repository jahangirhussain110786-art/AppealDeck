import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GROWTH } from "@/content/growth";
import { OPENS_SOON } from "@/content/purchases";
import { PlanCta } from "@/components/pricing/PlanCta";
import { accountPassEnabled, listedPaidPlans, singleEnabled, type ListedPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * "Choose for the work ahead": the same plans the cards and the comparison table show, in the same
 * order and with the same availability (`listedPaidPlans()`). A listed plan whose Paddle price is
 * not configured says "Opens soon" instead of offering a purchase that cannot complete.
 */
export function PlanFit() {
  const c = GROWTH.fit;
  const plans = listedPaidPlans();
  const enabled: Record<ListedPlan, boolean> = {
    single: singleEnabled(),
    case: true,
    account: accountPassEnabled(),
  };
  const buy = (plan: ListedPlan, label: string, featured: boolean) =>
    enabled[plan] ? (
      <PlanCta plan={plan} featured={featured}>
        {label}
      </PlanCta>
    ) : (
      <Button size="lg" variant="outline" disabled className="w-full">
        {OPENS_SOON.label}
      </Button>
    );

  return (
    <section aria-labelledby="plan-fit-title" className="border-b border-border py-10">
      <h2 id="plan-fit-title" className="text-xl font-semibold tracking-tight">
        {c.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{c.note}</p>
      <div
        className={cn(
          "mt-5 grid gap-5",
          plans.length === 1 && "sm:grid-cols-2",
          plans.length === 2 && "sm:grid-cols-3",
          plans.length === 3 && "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        <div className="space-y-3">
          <h3 className="font-medium">{c.free.title}</h3>
          <p className="text-sm text-muted-foreground">{c.free.body}</p>
          <Button variant="outline" asChild className="w-full">
            <Link href="/decode">{c.free.cta}</Link>
          </Button>
        </div>
        {plans.includes("single") && (
          <div className="space-y-3">
            <h3 className="font-medium">{c.single.title}</h3>
            <p className="text-sm text-muted-foreground">{c.single.body}</p>
            {buy("single", c.single.cta, false)}
          </div>
        )}
        <div className="space-y-3">
          <h3 className="font-medium">{c.pass.title}</h3>
          <p className="text-sm text-muted-foreground">{c.pass.body}</p>
          <PlanCta plan="case" featured>
            {c.pass.cta}
          </PlanCta>
        </div>
        {plans.includes("account") && (
          <div className="space-y-3">
            <h3 className="font-medium">{c.account.title}</h3>
            <p className="text-sm text-muted-foreground">{c.account.body}</p>
            {buy("account", c.account.cta, false)}
          </div>
        )}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {c.refund}{" "}
        <Link href="/refund" className="text-link underline underline-offset-4">
          {c.refundCta}
        </Link>
      </p>
    </section>
  );
}
