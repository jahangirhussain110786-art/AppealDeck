import Link from "next/link";
import { CheckCircle2, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isLicenseActive, fetchLicenseByEmail } from "@/lib/license";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeviceManager } from "@/components/DeviceManager";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser("/billing");
  const email = (user.email ?? "").trim().toLowerCase();

  const active = await isLicenseActive(email);
  const license = await fetchLicenseByEmail(email);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 text-foreground">{APP.billing.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP.billing.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {active ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-medium text-foreground">{APP.billing.active.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {APP.billing.active.planLabel}: {license.plan} ·{" "}
                  {APP.billing.active.purchasedLabel}{" "}
                  <span data-tn>{license.createdAt ? formatDate(license.createdAt) : ""}</span>
                </p>
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

      {active && (
        <Card>
          <CardContent className="pt-5">
            <Link
              href="/refund"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {APP.billing.refundLink}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
