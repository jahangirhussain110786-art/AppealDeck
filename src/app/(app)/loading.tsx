import { SURFACES } from "@/content/surfaces";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div role="status" aria-label={SURFACES.loading} className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-full max-w-sm" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
      </div>
    </div>
  );
}
