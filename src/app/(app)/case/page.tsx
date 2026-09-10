import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterviewFlow } from "@/components/InterviewFlow";
import { CasePreview } from "@/components/CasePreview";
import { APP } from "@/content/app";

type ViolationKind =
  | "INAUTHENTIC_DOCUMENTS"
  | "RELATED_ACCOUNT"
  | "POLICY"
  | "INTELLECTUAL_PROPERTY"
  | "LISTING"
  | "FUNDS"
  | "UNKNOWN";

function isValidKind(value: string | undefined): value is ViolationKind {
  return (
    value !== undefined &&
    [
      "INAUTHENTIC_DOCUMENTS",
      "RELATED_ACCOUNT",
      "POLICY",
      "INTELLECTUAL_PROPERTY",
      "LISTING",
      "FUNDS",
      "UNKNOWN",
    ].includes(value)
  );
}

export default async function CasePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const signedIn = Boolean(user);
  const email = (user?.email ?? "").trim().toLowerCase();
  const hasPass = user ? await isLicenseActive(email) : false;
  const initialKind = isValidKind(params.kind) ? params.kind : undefined;

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-h2 text-foreground">{APP.case.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{APP.case.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-h3 text-foreground">{APP.case.guidedInterview}</h2>
          <Badge variant="secondary">{APP.interview.engineBadge}</Badge>
        </div>

        <div className="rounded-md border border-border/70 bg-surface-2 p-4">
          <p className="text-eyebrow uppercase text-muted-foreground">
            {APP.case.howItWorks.title}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>{APP.case.howItWorks.bullet1}</li>
            <li>{APP.case.howItWorks.bullet2}</li>
            <li>{APP.case.howItWorks.bullet3}</li>
          </ul>
        </div>

        <InterviewFlow signedIn={signedIn} hasPass={hasPass} initialKind={initialKind} />
      </div>

      <div className="mt-6 lg:mt-0">
        <CasePreview kind={initialKind ?? "UNKNOWN"} />

        <Card className="mt-6">
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
    </div>
  );
}
