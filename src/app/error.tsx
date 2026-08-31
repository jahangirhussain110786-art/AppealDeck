"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/15 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="mt-6 text-sm font-medium text-destructive">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">This page hit an error</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page. You can try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
