import Link from "next/link";
import { CheckCircle2, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeviceManager } from "@/components/DeviceManager";

export const dynamic = "force-dynamic";

import { SITE_URL as MARKETING_URL } from "@/lib/urls";

type LicenseRow = {
  plan: string;
  status: string;
  created_at: string;
};

export default async function BillingPage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  let license: LicenseRow | null = null;
  if (supabaseAdmin && email) {
    const { data } = await supabaseAdmin
      .from("licenses")
      .select("plan, status, created_at")
      .eq("email", email)
      .maybeSingle();
    license = (data as LicenseRow) ?? null;
  }

  const active = !!license && license.status === "active";

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
                  Plan: {license?.plan} · Purchased{" "}
                  {license ? new Date(license.created_at).toLocaleDateString() : ""}
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
                <Link href={`${MARKETING_URL}/pricing`}>
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
