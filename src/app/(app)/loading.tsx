import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Skeleton className="h-8 w-32" />
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Primary">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </nav>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md sm:hidden" />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <Skeleton className="mb-4 h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-4 h-4 w-3/4" />
      </main>
    </div>
  );
}
