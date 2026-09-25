"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AuthShell,
  GoogleButton,
  Divider,
  SubmitButton,
  StatusMessage,
  FieldError,
} from "@/components/AuthCard";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/urls";
import { safeNext } from "@/lib/safeNext";
import { AUTH } from "@/content/auth";
import { isValidEmail, validatePasswordLength } from "@/lib/validation";
import type { AuthStatus } from "@/components/AuthCard";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = safeNext(nextParam, APP_URL);
  const showContinue = next.startsWith("/case");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  /*
    `?error=` means a sign-in link failed (auth/callback, reset-password). It is read once, as the
    initial state, and only ever shown as our own sentence: until 24 Sep 2026 the parameter's text
    was rendered as the error, so a link to this page could make it display anything — for sellers
    who are targeted by scammers, that is a phishing surface. The text was also decoded a second
    time, so any message containing a percent sign threw and crashed the page.
  */
  const linkFailed = searchParams.get("error") !== null;
  const [status, setStatus] = useState<AuthStatus>(linkFailed ? "error" : "idle");
  const [message, setMessage] = useState(linkFailed ? AUTH.login.messages.linkFailed : "");

  const validateEmailError = (value: string) => {
    if (value.length > 0 && !isValidEmail(value)) {
      return AUTH.login.messages.invalidEmail;
    }
    return "";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmailError(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePasswordLength(password));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmailError(email);
    setEmailError(emailErr);
    if (emailErr) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(AUTH.login.messages.notConfigured);
      return;
    }
    setStatus("loading");
    setMessage("");

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("sent");
        setMessage(AUTH.login.messages.magicSent);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("idle");
    setMessage("");
    window.location.href = next;
  }

  async function handleGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(AUTH.login.messages.notConfigured);
      return;
    }
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  const toggleLabel =
    mode === "password" ? AUTH.login.messages.togglePassword : AUTH.login.messages.toggleMagic;
  const submitLabel =
    mode === "password" ? AUTH.login.messages.submitPassword : AUTH.login.messages.submitMagic;

  return (
    <AuthShell
      title={AUTH.login.title}
      subtitle={showContinue ? AUTH.login.subtitleContinue : AUTH.login.subtitle}
      footerPrompt={AUTH.login.footer.prompt}
      footerAction={AUTH.login.footer.action}
      footerHref={nextParam ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
    >
      <div className="w-full">
        <GoogleButton
          onClick={handleGoogle}
          disabled={status === "loading"}
          label={AUTH.login.google}
        />
        <Divider label={AUTH.login.divider} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {AUTH.login.fields.email}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={!!emailError}
              className="mt-1"
            />
            <FieldError id="email" message={emailError} />
          </div>

          {mode === "password" && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {AUTH.login.fields.password}
                </label>
                <a
                  href={
                    nextParam
                      ? `/forgot-password?next=${encodeURIComponent(next)}`
                      : "/forgot-password"
                  }
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-link"
                >
                  {AUTH.login.fields.forgot}
                </a>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                aria-describedby={passwordError ? "password-error" : undefined}
                aria-invalid={!!passwordError}
                className="mt-1"
                showToggle
              />
              <FieldError id="password" message={passwordError} />
            </div>
          )}

          <StatusMessage status={status} message={message} />
          <SubmitButton status={status} label={submitLabel} />
        </form>

        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-4"
          onClick={() => {
            setMode((m) => (m === "password" ? "magic" : "password"));
            setStatus("idle");
            setMessage("");
          }}
        >
          {toggleLabel}
        </Button>
      </div>
    </AuthShell>
  );
}
