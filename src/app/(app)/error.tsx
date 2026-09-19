"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PageState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { SURFACES } from "@/content/surfaces";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageState icon={RefreshCw} {...SURFACES.error}>
      <Button onClick={reset}>{SURFACES.error.primary}</Button>
      <Button asChild variant="outline">
        <Link href="/">{SURFACES.error.secondary}</Link>
      </Button>
    </PageState>
  );
}
