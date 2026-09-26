import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { fetchLicenseForUser } from "@/lib/license";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/workspace/CaseOverview";
import { DeviceManager } from "@/components/DeviceManager";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: APP.metaTitles.billing };

/**
 * Billing (v5, 26 Sep 2026): a navy header like every app page, the Pass as a white card with its
 * status, the devices it works on, and where receipts and refunds are handled.
 */
export default async function BillingPage() {
  const user = await requireUser("/billing");

  const license = await fetchLicenseForUser(user.id);
  const active = license.status === "active";

  return (
    <div className="max-w-[67.5rem] space-y-6">
      <section
        aria-labelledby="billing-title"
        className="next-card dark flex flex-wrap items-center justify-between gap-6 px-6 py-6 text-foreground sm:px-8 sm:py-7"
      >
        <div className="min-w-0">
          <p className="text-[0.8125rem] text-muted-foreground">{APP.billing.eyebrow}</p>
          <h1
            id="billing-title"
            className="mt-1 text-[clamp(1.5rem,1.2rem+1vw,1.75rem)] font-semibold tracking-[-0.035em]"
          >
            {APP.billing.title}
          </h1>
          <p className="mt-1.5 text-muted-foreground">{APP.billing.subtitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            {APP.billing.continue}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>

      <section className="overflow-hidden rounded-[18px] bg-card shadow-card ring-1 ring-inset ring-border">
        {active ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
              <h2 className="text-[0.9375rem] font-semibold text-foreground">
                {APP.billing.active.title}
              </h2>
              <StatusPill tone="ok" dot>
                {APP.billing.planName}
              </StatusPill>
            </div>
            <dl className="grid border-b border-border sm:grid-cols-2">
              <div className="px-6 py-4">
                <dt className="text-xs text-muted-foreground">{APP.billing.active.planLabel}</dt>
                <dd className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                  {license.plan === "appeal_pass"
                    ? APP.billing.planName
                    : license.plan?.replace(/_/g, " ")}
                </dd>
              </div>
              <div className="border-t border-border px-6 py-4 sm:border-l sm:border-t-0">
                <dt className="text-xs text-muted-foreground">
                  {APP.billing.active.purchasedLabel}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums tracking-[-0.02em]">
                  {license.createdAt ? formatDate(license.createdAt) : APP.billing.dateUnavailable}
                </dd>
              </div>
            </dl>
            <p className="px-6 py-4 text-sm text-muted-foreground">
              {APP.billing.active.receiptText}
            </p>
          </>
        ) : (
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-foreground">{APP.billing.inactive.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{APP.billing.inactive.desc}</p>
            <Button asChild className="mt-4">
              <Link href="/pricing">
                <CreditCard className="size-4" /> {APP.billing.inactive.cta}
              </Link>
            </Button>
          </div>
        )}
      </section>

      {active ? <DeviceManager /> : null}

      <section aria-labelledby="billing-support">
        <h2
          id="billing-support"
          className="text-lg font-semibold tracking-[-0.02em] text-foreground"
        >
          {APP.billing.supportTitle}
        </h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {APP.billing.supportDesc}
        </p>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          {[
            { href: "/refund", label: APP.billing.refundLink },
            { href: "/privacy", label: APP.billing.policyLink },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-2 rounded-[18px] bg-card p-5 font-semibold text-foreground shadow-card ring-1 ring-inset ring-border transition-shadow hover:shadow-lift"
            >
              {l.label}
              <ArrowRight
                aria-hidden
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
