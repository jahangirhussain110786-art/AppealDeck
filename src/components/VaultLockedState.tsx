"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

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
    <EmptyState
      icon={Lock}
      titleAs="h1"
      title={title}
      description={description}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      }
    />
  );
}
