"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  GoogleButton,
  Divider,
  SubmitButton,
  StatusMessage,
  FieldError,
  SuccessBanner,
} from "@/components/AuthCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidEmail, validatePasswordLength } from "@/lib/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/urls";
import { safeNext } from "@/lib/safeNext";
import { AUTH } from "@/content/auth";
import type { AuthStatus } from "@/components/AuthCard";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = safeNext(nextParam, APP_URL);
  const showContinue = next.startsWith("/case");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");

  const validateEmailError = (value: string) => {
    if (value.length > 0 && !isValidEmail(value)) {
      return AUTH.signup.messages.invalidEmail;
    }
    return "";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmailError(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePasswordLength(password));
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmailError(email);
    const pwErr = validatePasswordLength(password);
    setEmailError(emailErr);
    setPasswordError(pwErr);
    if (emailErr || pwErr) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(AUTH.signup.messages.notConfigured);
      return;
    }
    setStatus("loading");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    if (data.session) {
      window.location.href = next;
      return;
    }

    setStatus("sent");
    setMessage(AUTH.signup.messages.sent);
  }

  async function handleGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(AUTH.signup.messages.notConfigured);
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

  return (
    <AuthShell
      title={AUTH.signup.title}
      subtitle={showContinue ? AUTH.signup.subtitleContinue : AUTH.signup.subtitle}
      footerPrompt={AUTH.signup.footer.prompt}
      footerAction={AUTH.signup.footer.action}
      footerHref="/login"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="-mt-4"
      >
        <GoogleButton
          onClick={handleGoogle}
          disabled={status === "loading"}
          label={AUTH.signup.google}
        />
        <Divider label={AUTH.signup.divider} />

        {status === "sent" ? (
          <>
            <SuccessBanner message={message} />
            <p className="mt-2 text-sm text-muted-foreground">{AUTH.signup.messages.sentDetail}</p>
            <Button asChild size="lg" className="mt-4 w-full">
              <a href="/login">{AUTH.signup.messages.backToSignIn}</a>
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 space-y-3">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {AUTH.signup.fields.email}
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
            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {AUTH.signup.fields.password}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                aria-describedby={passwordError ? "password-error" : undefined}
                aria-invalid={!!passwordError}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {AUTH.signup.fields.passwordHint}
              </p>
              <FieldError id="password" message={passwordError} />
            </div>

            <StatusMessage status={status} message={message} />
            <SubmitButton status={status} label={AUTH.signup.messages.submit} />
          </form>
        )}
      </motion.div>
    </AuthShell>
  );
}
