"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP } from "@/content/app";
import { formatTime } from "@/lib/format";

export interface SignInGateProps {
  next?: string;
  savedAt?: Date;
}

export function SignInGate({ next, savedAt }: SignInGateProps) {
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  const savedNote = savedAt
    ? `${APP.access.signInGate.savedNote} · ${formatTime(savedAt)}`
    : APP.access.signInGate.savedNote;
  return (
    <Card className="border-primary/30 bg-surface-2 p-6">
      <CardContent className="space-y-3 p-0">
        <p className="text-eyebrow uppercase text-muted-foreground">{savedNote}</p>
        <h3 className="text-h3 text-foreground">{APP.access.signInGate.title}</h3>
        <p className="text-sm text-muted-foreground">{APP.access.signInGate.body}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={loginHref}>{APP.access.signInGate.signIn}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={signupHref}>{APP.access.signInGate.createAccount}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
