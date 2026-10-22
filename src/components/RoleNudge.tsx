"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AUDIENCE_SWITCH } from "@/content/audiences";
import { ROLE_HOME, useRole } from "@/lib/role";

/**
 * On the sellers' pricing page, a visitor who said earlier that they write appeals or send sellers
 * is pointed to their own page. A seller, or someone who said nothing, sees nothing: the nudge is
 * never shown to the people the page is written for.
 */
export function RoleNudge() {
  const role = useRole();
  if (role !== "pro" && role !== "partner") return null;
  const copy = AUDIENCE_SWITCH.nudge[role];
  return (
    <p className="mx-auto mt-6 max-w-prose rounded-2xl bg-white/[0.06] px-5 py-3 text-center text-sm text-foreground ring-1 ring-inset ring-white/[0.12]">
      {copy.text}{" "}
      <Link
        href={ROLE_HOME[role]}
        className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4"
      >
        {copy.link}
        <ArrowRight aria-hidden className="size-3.5" />
      </Link>
    </p>
  );
}
