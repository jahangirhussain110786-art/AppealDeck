import Link from "next/link";
import { Compass } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingShell width="reading">
      <div className="flex min-h-[60svh] flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Compass className="size-6" />
        </div>
        <h1 className="mt-2 text-h2 text-foreground">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you were looking for does not exist or has moved.
        </p>
        <div className="mt-2 flex gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/faq">Visit the FAQ</Link>
          </Button>
        </div>
      </div>
    </MarketingShell>
  );
}
