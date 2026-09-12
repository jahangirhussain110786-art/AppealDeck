"use client";

import Link from "next/link";
import { CreditCard, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SHARED } from "@/content/shared";
import { useSignOut } from "@/lib/useSignOut";

/**
 * AM-25 (12 Sep 2026, founder direction): the header shows only Decode, Dashboard, Vault for a
 * signed-in seller — Billing and Sign out move here, behind one account-level control, instead
 * of taking their own nav slots.
 */
export function ProfileMenu({ email }: { email?: string | null }) {
  const { signOut, pending } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={SHARED.nav.profileMenu}>
          <User className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {email && <DropdownMenuLabel className="max-w-[14rem] truncate">{email}</DropdownMenuLabel>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/billing">
            <CreditCard className="mr-2 size-4" aria-hidden />
            {SHARED.nav.billing}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void signOut();
          }}
          aria-disabled={pending}
          className={pending ? "pointer-events-none opacity-50" : undefined}
        >
          <LogOut className="mr-2 size-4" aria-hidden />
          {SHARED.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
