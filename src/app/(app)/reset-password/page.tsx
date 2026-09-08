"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AuthShell,
  SubmitButton,
  StatusMessage,
  SuccessBanner,
  FieldError,
} from "@/components/AuthCard";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AUTH } from "@/content/auth";
import type { AuthStatus } from "@/components/AuthCard";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");

  const validatePassword = (value: string) => {
    if (value.length > 0 && value.length < 8) {
      return AUTH.resetPassword.messages.weakPassword;
    }
    return "";
  };

  const validateConfirm = (value: string) => {
    if (value.length > 0 && value !== password) {
      return AUTH.resetPassword.messages.mismatch;
    }
    return "";
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleConfirmBlur = () => {
    setConfirmError(validateConfirm(confirm));
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        const error = searchParams.get("error");
        window.location.href = error ? `/login?error=${encodeURIComponent(error)}` : "/login";
      }
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pwErr = validatePassword(password);
    const cfErr = validateConfirm(confirm);
    setPasswordError(pwErr);
    setConfirmError(cfErr);
    if (pwErr || cfErr) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(AUTH.resetPassword.messages.notConfigured);
      return;
    }
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("done");
    setMessage(AUTH.resetPassword.messages.updated);
  }

  const formFields = () => (
    <>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {AUTH.resetPassword.fields.password}
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
          {AUTH.resetPassword.fields.passwordHint}
        </p>
        <FieldError id="password" message={passwordError} />
      </div>
      <div>
        <label htmlFor="confirm" className="text-sm font-medium text-foreground">
          {AUTH.resetPassword.fields.confirm}
        </label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={handleConfirmBlur}
          aria-describedby={confirmError ? "confirm-error" : undefined}
          aria-invalid={!!confirmError}
          className="mt-1"
        />
        <FieldError id="confirm" message={confirmError} />
      </div>
      <StatusMessage status={status} message={message} />
    </>
  );

  return (
    <AuthShell
      title={AUTH.resetPassword.title}
      subtitle={AUTH.resetPassword.subtitle}
      footerPrompt={AUTH.resetPassword.footer.prompt}
      footerAction={AUTH.resetPassword.footer.action}
      footerHref="/login"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="-mt-4"
      >
        {status === "done" ? (
          <SuccessBanner message={message} />
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 space-y-3">
            {formFields()}
            <SubmitButton status={status} label={AUTH.resetPassword.messages.submit} />
          </form>
        )}

        {status === "done" && (
          <Button asChild size="lg" className="mt-4 w-full">
            <a href="/dashboard">{AUTH.resetPassword.success.button}</a>
          </Button>
        )}
      </motion.div>
    </AuthShell>
  );
}
