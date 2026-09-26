"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { APP } from "@/content/app";

export function VaultLockedState({
  title,
  description,
  ctaHref,
  ctaLabel,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    // v5 (26 Sep 2026): the navy card with the vault drawing, like the signed-in vault's header.
    <section className="next-card dark p-7 text-foreground sm:p-10">
      <Image
        src="/illustrations/vault.svg"
        alt=""
        width={120}
        height={100}
        className="h-auto w-24 drop-shadow-[0_16px_30px_rgba(0,0,0,0.45)] sm:w-28"
        unoptimized
      />
      <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
        <Lock aria-hidden className="size-4" />
        {APP.vault.eyebrow}
      </p>
      <h1 className="mt-2 text-balance text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
        {title}
      </h1>
      <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="h-auto min-h-11 whitespace-normal py-2">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
