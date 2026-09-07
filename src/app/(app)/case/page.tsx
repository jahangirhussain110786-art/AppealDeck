import Link from "next/link";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterviewFlow } from "@/components/InterviewFlow";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function CasePage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  const hasPass = await isLicenseActive(email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{APP.case.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP.case.subtitle}</p>
      </div>

      {!hasPass ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h2 className="font-medium text-foreground">{APP.case.noPass.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{APP.case.noPass.desc}</p>
                <Button asChild className="mt-4">
                  <Link href="/pricing">{APP.case.noPass.cta}</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{APP.case.guidedInterview}</span>
              <span className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {APP.interview.engineBadge}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{APP.case.guidedDesc}</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="flex items-center gap-2 font-medium text-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                {APP.case.howItWorks.title}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {APP.case.howItWorks.bullet1}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {APP.case.howItWorks.bullet2}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {APP.case.howItWorks.bullet3}
                </li>
              </ul>
            </div>
            <InterviewFlow />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{APP.case.quickLinks.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/decode">{APP.case.quickLinks.decode}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/billing">{APP.case.quickLinks.billing}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
