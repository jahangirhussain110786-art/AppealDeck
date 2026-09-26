"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Where the seller is, in the app's top bar (v5). A section page names itself; the case page is
 * "Cases / <this case>", and the case supplies its own name through the title slot, since only it
 * knows what the case is about.
 */
const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/compose": "Compose",
  "/vault": "Vault",
  "/billing": "Billing",
};

export function AppBreadcrumb({ titleSlotId }: { titleSlotId: string }) {
  const pathname = usePathname() ?? "";
  const isCase = pathname === "/case" || pathname.startsWith("/case/");
  const page = Object.keys(PAGE_NAMES).find((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
    >
      {isCase ? (
        <>
          <Link href="/dashboard" className="shrink-0 hover:text-foreground">
            Cases
          </Link>
          <span aria-hidden>/</span>
        </>
      ) : (
        page && (
          <span aria-current="page" className="text-[0.9375rem] font-semibold text-foreground">
            {PAGE_NAMES[page]}
          </span>
        )
      )}
      <span id={titleSlotId} className="flex min-w-0 items-center gap-2" />
    </nav>
  );
}
