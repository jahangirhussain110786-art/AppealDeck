import Link from "next/link";
import { Lock } from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import VaultView from "@/components/VaultView";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-tool flex-col gap-4 py-10">
        <EmptyState
          icon={Lock}
          title={APP.access.vaultSignedOut.title}
          description={APP.access.vaultSignedOut.desc}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/login?next=/vault">{APP.access.vaultSignedOut.cta}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/case">{APP.access.vaultSignedOut.back}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const active = await isLicenseActive(user.email);

  if (!active) {
    return (
      <div className="mx-auto flex w-full max-w-tool flex-col gap-4 py-10">
        <EmptyState
          icon={Lock}
          title={APP.access.vaultSignedOut.title}
          description={APP.access.vaultSignedOut.desc}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/pricing">{APP.access.vaultSignedOut.cta}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/case">{APP.access.vaultSignedOut.back}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-tool flex-col gap-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 text-foreground">{APP.vault.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP.vault.subtitle}</p>
        </div>
      </div>
      <VaultView userId={user.id} />
    </div>
  );
}
