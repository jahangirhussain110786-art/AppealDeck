"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GROWTH } from "@/content/growth";
import { PlanCta } from "@/components/pricing/PlanCta";

export function PlanFit({ singleOn }: { singleOn: boolean }) {
  const c = GROWTH.fit;
  return (
    <section aria-labelledby="plan-fit-title" className="border-b border-border py-10">
      <h2 id="plan-fit-title" className="text-xl font-semibold tracking-tight">
        {c.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{c.note}</p>
      <div className={`mt-5 grid gap-5 ${singleOn ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <div className="space-y-3">
          <h3 className="font-medium">{c.free.title}</h3>
          <p className="text-sm text-muted-foreground">{c.free.body}</p>
          <Button variant="outline" asChild className="w-full">
            <Link href="/decode">{c.free.cta}</Link>
          </Button>
        </div>
        {singleOn && (
          <div className="space-y-3">
            <h3 className="font-medium">{c.single.title}</h3>
            <p className="text-sm text-muted-foreground">{c.single.body}</p>
            <PlanCta plan="single" featured={false}>
              {c.single.cta}
            </PlanCta>
          </div>
        )}
        <div className="space-y-3">
          <h3 className="font-medium">{c.pass.title}</h3>
          <p className="text-sm text-muted-foreground">{c.pass.body}</p>
          <PlanCta plan="case" featured>
            {c.pass.cta}
          </PlanCta>
        </div>
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
