"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUDIENCE_SWITCH } from "@/content/audiences";
import { parseRole, writeRole } from "@/lib/role";
import { cn } from "@/lib/utils";

/**
 * Sellers, writers and VA teams, partners: three pages of one pricing system, always all visible.
 * Choosing one remembers it on this device (see `src/lib/role.ts`) so the pricing page can point a
 * returning professional or partner to their own page. It only ever links; it hides nothing.
 * Sits on a dark hero, so its colours come from the dark tokens.
 */
export function AudienceSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={AUDIENCE_SWITCH.label} className={cn("flex flex-wrap gap-2", className)}>
      {AUDIENCE_SWITCH.items.map((item) => {
        const current = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            onClick={() => writeRole(parseRole(item.role))}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current
                ? "bg-foreground text-background ring-foreground"
                : "bg-white/[0.06] text-foreground ring-white/[0.14] hover:bg-white/[0.12]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
