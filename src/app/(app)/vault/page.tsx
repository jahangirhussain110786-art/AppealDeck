import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { VaultLockedState } from "@/components/VaultLockedState";
import VaultView from "@/components/VaultView";
import { APP } from "@/content/app";
import { FolderLock } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: APP.metaTitles.vault };

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

  const active = await isLicenseActive(user.id);

  if (!active) {
    return (
      <div className="mx-auto flex w-full max-w-tool flex-col gap-4 py-10">
        <VaultLockedState
          title={APP.access.vaultNoPass.title}
          description={APP.access.vaultNoPass.desc}
          ctaHref="/pricing"
          ctaLabel={APP.access.vaultNoPass.cta}
          backHref="/case"
          backLabel={APP.access.vaultSignedOut.back}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        icon={FolderLock}
        eyebrow={APP.vault.eyebrow}
        title={APP.vault.title}
        description={APP.vault.subtitle}
        illustration={{ src: "/illustrations/vault.svg", alt: APP.vault.illustrationAlt }}
      />
      <VaultView userId={user.id} />
    </div>
  );
}
