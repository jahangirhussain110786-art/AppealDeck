"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
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
    <Card className="border-warning/40 bg-warning/5">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">{APP.access.signInGate.title}</h3>
            <p className="text-sm text-muted-foreground">{APP.access.signInGate.body}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={loginHref}>{APP.access.signInGate.signIn}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={signupHref}>{APP.access.signInGate.createAccount}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{savedNote}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
