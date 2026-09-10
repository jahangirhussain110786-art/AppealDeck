"use client";

import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/Logo";
import type { ReactNode } from "react";

export type AuthStatus = "idle" | "loading" | "sent" | "done" | "error";

export function AuthShell({
  title,
  subtitle,
  footerPrompt,
  footerAction,
  footerHref,
  children,
}: {
  title: string;
  subtitle: string;
  footerPrompt: string;
  footerAction: string;
  footerHref: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <main id="main" className="mx-auto flex w-full max-w-form flex-1 items-center px-4 py-12">
        <div className="w-full">
          <div className="flex flex-col items-center">
            <LogoMark size={36} />
            <h1 className="mt-4 text-h3 text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Card className="mt-6 animate-fade-in shadow-elevated">
            <CardContent className="p-8">
              {children}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {footerPrompt}{" "}
                <a
                  href={footerHref}
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {footerAction}
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export function GoogleButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="mt-6 w-full"
      onClick={onClick}
      disabled={disabled}
    >
      <GoogleIcon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function SubmitButton({ status, label }: { status: AuthStatus; label: string }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
      {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function StatusMessage({ status, message }: { status: AuthStatus; message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
    >
      {message}
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/5 p-3 text-sm text-foreground">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        {message}
      </div>
    </div>
  );
}

export { Input };
