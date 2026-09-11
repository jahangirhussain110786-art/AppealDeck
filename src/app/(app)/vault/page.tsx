import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { VaultLockedState } from "@/components/VaultLockedState";
import VaultView from "@/components/VaultView";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-tool flex-col gap-4 py-10">
        <VaultLockedState
          title={APP.access.vaultSignedOut.title}
          description={APP.access.vaultSignedOut.desc}
          ctaHref="/login?next=/vault"
          ctaLabel={APP.access.vaultSignedOut.cta}
          backHref="/case"
          backLabel={APP.access.vaultSignedOut.back}
        />
      </div>
    );
  }

  const active = await isLicenseActive(user.email);

  if (!active) {
    return (
      <div className="mx-auto flex w-full max-w-tool flex-col gap-4 py-10">
        <VaultLockedState
          title={APP.access.vaultSignedOut.title}
          description={APP.access.vaultSignedOut.desc}
          ctaHref="/pricing"
          ctaLabel={APP.access.vaultSignedOut.cta}
          backHref="/case"
          backLabel={APP.access.vaultSignedOut.back}
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
