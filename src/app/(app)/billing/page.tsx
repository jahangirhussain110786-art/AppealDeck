import Link from "next/link";
import { CheckCircle2, CreditCard, ArrowRight, ReceiptText, ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { fetchLicenseForUser } from "@/lib/license";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/PageIntro";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
import { DeviceManager } from "@/components/DeviceManager";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser("/billing");

  const license = await fetchLicenseForUser(user.id);
  const active = license.status === "active";

  return (
    <div className="space-y-6">
      <PageIntro
        icon={CreditCard}
        eyebrow={APP.billing.eyebrow}
        title={APP.billing.title}
        description={APP.billing.subtitle}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">
              {APP.billing.continue}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          {active ? (
            <div className="flex items-start gap-3">
              <IconTile icon={CheckCircle2} />
              <div>
                <h2 className="font-medium text-foreground">{APP.billing.active.title}</h2>
                <dl className="my-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {APP.billing.active.planLabel}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {license.plan === "appeal_pass"
                        ? APP.billing.planName
                        : license.plan?.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {APP.billing.active.purchasedLabel}
                    </dt>
                    <dd className="mt-1 font-mono text-sm">
                      {license.createdAt
                        ? formatDate(license.createdAt)
                        : APP.billing.dateUnavailable}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm text-muted-foreground">
                  {APP.billing.active.receiptText}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-medium text-foreground">{APP.billing.inactive.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{APP.billing.inactive.desc}</p>
              <Button asChild className="mt-4">
                <Link href="/pricing">
                  <CreditCard className="size-4" /> {APP.billing.inactive.cta}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {active ? <DeviceManager /> : null}

      <Card>
        <CardContent className="flex items-start gap-4 p-5 sm:p-6">
          <IconTile icon={ReceiptText} tone="info" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{APP.billing.supportTitle}</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {APP.billing.supportDesc}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/refund"
                className="inline-flex min-h-9 items-center gap-2 rounded-sm text-sm underline"
              >
                {APP.billing.refundLink}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex min-h-9 items-center gap-2 rounded-sm text-sm underline"
              >
                {APP.billing.policyLink}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
