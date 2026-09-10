"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <MarketingShell width="reading">
      <div className="flex min-h-[60svh] flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-2 text-h2 text-foreground">This page hit an error</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page. You can try again.
        </p>
        <div className="mt-2 flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </MarketingShell>
  );
}
