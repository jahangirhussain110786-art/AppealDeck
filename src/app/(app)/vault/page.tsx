import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { VaultLockedState } from "@/components/VaultLockedState";
import VaultView from "@/components/VaultView";
import { APP } from "@/content/app";
import Image from "next/image";
import Link from "next/link";

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
    <div className="max-w-[71.25rem] space-y-6">
      {/* v5 (26 Sep 2026, prototype vault.html): what the vault is, in one sentence, on navy. */}
      <section
        aria-labelledby="vault-title"
        className="next-card dark flex flex-wrap items-center gap-6 px-6 py-6 text-foreground sm:px-8"
      >
        <Image
          src="/illustrations/vault.svg"
          alt={APP.vault.illustrationAlt}
          width={120}
          height={100}
          className="hidden h-auto w-[7.5rem] shrink-0 drop-shadow-[0_16px_30px_rgba(0,0,0,0.45)] sm:block"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <h1
            id="vault-title"
            className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em]"
          >
            {APP.vault.heroTitle}
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            {APP.vault.heroBody}{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-4">
              {APP.vault.heroLink}
            </Link>
          </p>
        </div>
      </section>
      <VaultView userId={user.id} />
    </div>
  );
}
