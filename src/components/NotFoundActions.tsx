"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SURFACES } from "@/content/surfaces";
import { useSessionState } from "@/lib/useSessionState";

/**
 * The two ways out of a 404 (G-106, 12 Oct 2026). A signed-in seller is mid-case and wants their
 * dashboard; someone who is not signed in has no dashboard to open, so the primary action is the
 * free decoder, which is also what brought most of them here. While the session is still being
 * read, the decoder is shown: it is right for both, and never wrong to offer.
 */
export function NotFoundActions() {
  const signedIn = useSessionState() === "signed-in";
  return (
    <>
      <Button asChild>
        {signedIn ? (
          <Link href="/dashboard">{SURFACES.notFound.primary}</Link>
        ) : (
          <Link href="/decode">{SURFACES.notFound.primarySignedOut}</Link>
        )}
      </Button>
      <Button asChild variant="outline">
        <Link href="/">{SURFACES.notFound.secondary}</Link>
      </Button>
    </>
  );
}
