import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
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
  bleed = false,
  hero,
}: {
  children: ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
  /** Full-width main: the page lays out its own bands (v5 stage sections) and inner widths. */
  bleed?: boolean;
  /** A full-width band under the header, above the constrained main (v5 PageHero). */
  hero?: ReactNode;
}) {
  return (
    <div className={cn("flex min-h-svh flex-col", !bleed && "marketing-surface")}>
      <AnnouncementBar />
      <AppHeader mode="marketing" />
      {hero}
      <main
        id="main"
        className={cn(
          "w-full flex-1",
          !bleed && "mx-auto px-4 sm:px-6",
          !bleed && WIDTH[width],
          className,
        )}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
