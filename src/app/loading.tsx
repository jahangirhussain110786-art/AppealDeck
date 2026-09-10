import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-marketing items-center justify-between gap-4 px-4 sm:px-6">
          <Skeleton className="h-7 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md md:hidden" />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-marketing flex-1 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="mt-4 h-4 w-full max-w-lg" />
        <Skeleton className="mt-4 h-4 w-full max-w-sm" />
      </main>
    </div>
  );
}
