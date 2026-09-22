import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { DetailDisclosure } from "@/components/workspace/WorkspaceVisuals";
import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isViolationKind, type ViolationKind } from "@/core";
import { InterviewFlow } from "@/components/InterviewFlow";
import { CasePreview } from "@/components/CasePreview";
import { APP } from "@/content/app";
import { CaseWorkspace } from "@/components/workspace/CaseWorkspace";

// AA-39: this page used to restate the kind union and a matching literal array, both of which
// silently drifted from core. `?kind=VERIFICATION` would have been dropped as invalid.
function isValidKind(value: string | undefined): value is ViolationKind {
  return isViolationKind(value);
}

export default async function CasePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; mode?: string; view?: string }>;
}) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const signedIn = Boolean(user);
  const hasPass = user ? await isLicenseActive(user.id) : false;
  const initialKind = isValidKind(params.kind) ? params.kind : undefined;

  if (params.mode !== "classic")
    return (
      <CaseWorkspace
        signedIn={signedIn}
        hasPass={hasPass}
        initialKind={initialKind}
        initialView={params.view}
      />
    );

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-6">
        <PageIntro
          icon={ClipboardList}
          eyebrow={APP.case.guidedInterview}
          title={APP.case.title}
          description={APP.case.subtitle}
        />

        <div className="flex items-center gap-2">
          <h2 className="text-h3 text-foreground">{APP.case.guidedInterview}</h2>
          <Badge variant="secondary">{APP.interview.engineBadge}</Badge>
        </div>

        <DetailDisclosure title={APP.case.howItWorks.title}>
          <ul className="list-disc space-y-2 pl-4">
            <li>{APP.case.howItWorks.bullet1}</li>
            <li>{APP.case.howItWorks.bullet2}</li>
            <li>{APP.case.howItWorks.bullet3}</li>
          </ul>
        </DetailDisclosure>

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
