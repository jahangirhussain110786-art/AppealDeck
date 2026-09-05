import Link from "next/link";
import { CheckCircle2, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isLicenseActive, fetchLicenseByEmail } from "@/lib/license";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeviceManager } from "@/components/DeviceManager";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  const active = await isLicenseActive(email);
  const license = await fetchLicenseByEmail(email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Appeal Pass purchase and license status.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          {active ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-medium text-foreground">Appeal Pass — active</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan: {license.plan} · Purchased{" "}
                  {license.createdAt ? new Date(license.createdAt).toLocaleDateString() : ""}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Receipts and subscription management are handled by Paddle, our merchant of
                  record.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-medium text-foreground">No active plan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You have not purchased the Appeal Pass yet.
              </p>
              <Button asChild className="mt-4">
                <Link href="/pricing">
                  <CreditCard className="h-4 w-4" /> Buy the Appeal Pass
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {active ? <DeviceManager /> : null}
    </div>
  );
}
