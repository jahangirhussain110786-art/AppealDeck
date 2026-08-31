import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
        <Compass className="h-6 w-6" />
      </span>
      <p className="mt-6 text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you were looking for does not exist or has moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
