"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PageState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { SURFACES } from "@/content/surfaces";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageState icon={RefreshCw} {...SURFACES.appError}>
      <Button onClick={reset}>{SURFACES.appError.primary}</Button>
      <Button asChild variant="outline">
        <Link href="/dashboard">{SURFACES.appError.secondary}</Link>
      </Button>
    </PageState>
  );
}
