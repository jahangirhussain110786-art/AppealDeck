import Link from "next/link";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isLicenseActive, fetchLicenseByEmail } from "@/lib/license";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterviewFlow } from "@/components/InterviewFlow";

export const dynamic = "force-dynamic";

type LicenseRow = {
  license_key: string;
  plan: string;
  status: string;
};

export default async function CasePage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  const hasPass = await isLicenseActive(email);
  const license = hasPass
    ? await fetchLicenseByEmail(email)
    : { status: "none", plan: null, licenseKey: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your case</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step through your appeal. Each step is chosen by the engine based on your case type and
          evidence.
        </p>
      </div>

      {!hasPass ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h2 className="font-medium text-foreground">Appeal Pass required</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The guided interview, evidence checklist, and POA composer require an active
                  Appeal Pass.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/pricing">Get the Appeal Pass</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Guided interview</span>
              <span className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                Engine: rules-first
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AppealDeck will guide you step by step. Each step is chosen by the engine — not a chat
              bot. You can decline any evidence request and the system will show you honest
              alternatives.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="flex items-center gap-2 font-medium text-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                How this works
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  The engine chooses each step based on your case type and evidence.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Decline any request — the system shows honest alternatives, never fabricates.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  When evidence is complete, the composer drafts your POA from real facts.
                </li>
              </ul>
            </div>
            <InterviewFlow />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/decode">Decode a notice</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/billing">Billing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
