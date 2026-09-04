"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const BREADCRUMB_MAP: Record<string, string> = {
  "/case": "Case",
  "/compose": "Compose",
  "/vault": "Vault",
  "/billing": "Billing",
};

export function AppBreadcrumb() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  const segments = Object.keys(BREADCRUMB_MAP).filter(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3 w-3" />
        Home
      </Link>
      {segments.map((seg) => (
        <span key={seg} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <Link
            href={seg}
            aria-current={pathname === seg ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              pathname === seg && "text-foreground",
            )}
          >
            {BREADCRUMB_MAP[seg]}
          </Link>
        </span>
      ))}
    </nav>
  );
}
