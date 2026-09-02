import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ComposeView from "@/components/ComposeView";

export const dynamic = "force-dynamic";

type LicenseRow = { status: string };

export default async function ComposePage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  let license: LicenseRow | null = null;
  if (supabaseAdmin && email) {
    const { data } = await supabaseAdmin
      .from("licenses")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    license = (data as LicenseRow) ?? null;
  }

  const hasPass = license?.status === "active";

  if (!hasPass) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your POA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drafts are generated from your case file. Review, copy, and submit through Seller
            Central.
          </p>
        </div>

        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h2 className="font-medium text-foreground">Appeal Pass required</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The POA composer requires an active Appeal Pass.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/pricing">Get the Appeal Pass</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ComposeView />;
}
