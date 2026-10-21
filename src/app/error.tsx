"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageState } from "@/components/PageState";
import { SURFACES } from "@/content/surfaces";
import { Button } from "@/components/ui/button";
import { useGuideSituation } from "@/lib/guideSignal";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  useGuideSituation("error.crashed");
  return (
    <MarketingShell width="tool">
      <PageState icon={RefreshCw} {...SURFACES.error}>
        <Button onClick={reset}>{SURFACES.error.primary}</Button>
        <Button asChild variant="outline">
          <Link href="/">{SURFACES.error.secondary}</Link>
        </Button>
      </PageState>
    </MarketingShell>
  );
}
