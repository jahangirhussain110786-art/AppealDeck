import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-app items-center justify-between gap-4 px-4 sm:px-6">
          <Skeleton className="h-7 w-28" />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </nav>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md md:hidden" />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-app flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="mb-6 h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-4 h-4 w-3/4" />
      </main>
    </div>
  );
}
