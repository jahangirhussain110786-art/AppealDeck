import Link from "next/link";
import { CheckCircle2, KeyRound, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

import { SITE_URL as MARKETING_URL } from "@/lib/urls";

type LicenseRow = {
  license_key: string;
  plan: string;
  status: string;
  created_at: string;
};

function maskKey(key: string): string {
  if (key.length <= 4) return key;
  return `${"•".repeat(Math.max(0, key.length - 4))}${key.slice(-4)}`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  let license: LicenseRow | null = null;

  if (supabaseAdmin && email) {
    const { data } = await supabaseAdmin
      .from("licenses")
      .select("license_key, plan, status, created_at")
      .eq("email", email)
      .maybeSingle();
    license = (data as LicenseRow) ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your AppealDeck services and seller-account tools here.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          {license && license.status === "active" ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-medium text-foreground">Appeal Pass active</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan: {license.plan} · Granted {new Date(license.created_at).toLocaleDateString()}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  License: <span className="font-mono">{maskKey(license.license_key)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-medium text-foreground">No active Appeal Pass</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Buy the $199 one-time Appeal Pass to unlock your drafted Plan of Action and tools.
              </p>
              <Button asChild className="mt-4">
                <Link href={`${MARKETING_URL}/pricing`}>
                  <Sparkles className="h-4 w-4" /> Get the Appeal Pass
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
