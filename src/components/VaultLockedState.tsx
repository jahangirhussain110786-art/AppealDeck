"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
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
    <section className="workspace-hero rounded-xl border border-border/80 p-6 sm:p-10">
      <IconTile icon={Lock} tone="info" />
      <p className="mt-6 text-eyebrow uppercase text-primary">{APP.vault.eyebrow}</p>
      <h1 className="mt-2 font-accent text-h2 font-medium text-foreground">{title}</h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
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
