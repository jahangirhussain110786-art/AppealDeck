import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ComposeView from "@/components/ComposeView";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  const hasPass = await isLicenseActive(email);

  if (!hasPass) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {APP.compose.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP.compose.subtitle}</p>
        </div>

        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h2 className="font-medium text-foreground">{APP.compose.noPass.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{APP.compose.noPass.desc}</p>
                <Button asChild className="mt-4">
                  <Link href="/pricing">{APP.compose.noPass.cta}</Link>
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
