import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterviewFlow } from "@/components/InterviewFlow";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{APP.case.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP.case.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{APP.case.guidedInterview}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{APP.case.guidedDesc}</p>
          <InterviewFlow signedIn={signedIn} hasPass={hasPass} initialKind={initialKind} />
        </CardContent>
      </Card>

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
