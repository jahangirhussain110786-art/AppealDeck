import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

const WIDTH = {
  marketing: "max-w-marketing",
  tool: "max-w-tool",
  reading: "max-w-reading",
  form: "max-w-form",
} as const;

export function MarketingShell({
  children,
  width = "marketing",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
}) {
  return (
    <div className="marketing-surface flex min-h-svh flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className={cn("mx-auto w-full flex-1 px-4 sm:px-6", WIDTH[width], className)}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
