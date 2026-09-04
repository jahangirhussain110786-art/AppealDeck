import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  intro,
  children,
  className,
  contentClassName,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className={cn("mx-auto w-full max-w-3xl flex-1 px-4 py-16", className)}>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {intro ? <p className="mt-2 text-sm text-muted-foreground">{intro}</p> : null}
        <div className={contentClassName}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
