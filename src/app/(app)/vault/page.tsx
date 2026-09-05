import { requireUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import VaultView from "@/components/VaultView";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await requireUser();
  const active = await isLicenseActive(user.email);

  if (!active) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {APP.vault.noPassTitle}
        </h1>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">{APP.vault.noPassDesc}</p>
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link href="/pricing">{APP.vault.noPassCta}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/case">{APP.vault.noPassBack}</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{APP.vault.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{APP.vault.subtitle}</p>
      <VaultView userId={user.id} />
    </div>
  );
}
