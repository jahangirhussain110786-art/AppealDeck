"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AuthShell,
  GoogleButton,
  Divider,
  SubmitButton,
  StatusMessage,
} from "@/components/AuthCard";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/urls";
import { AUTH } from "@/content/auth";
import type { AuthStatus } from "@/components/AuthCard";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");

  const errorParam = searchParams.get("error");
  useEffect(() => {
    if (errorParam) {
      setStatus("error");
      setMessage(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        options: { emailRedirectTo: `${APP_URL}/auth/callback` },
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
    window.location.href = "/dashboard";
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
      options: { redirectTo: `${APP_URL}/auth/callback` },
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
      subtitle={AUTH.login.subtitle}
      footerPrompt={AUTH.login.footer.prompt}
      footerAction={AUTH.login.footer.action}
      footerHref="/signup"
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
          label={AUTH.login.google}
        />
        <Divider label={AUTH.login.divider} />

        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {AUTH.login.fields.email}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          {mode === "password" && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {AUTH.login.fields.password}
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {AUTH.login.fields.forgot}
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <StatusMessage status={status} message={message} />
          <SubmitButton status={status} label={submitLabel} />
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "password" ? "magic" : "password"));
            setStatus("idle");
            setMessage("");
          }}
          className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
        >
          {toggleLabel}
        </button>
      </motion.div>
    </AuthShell>
  );
}
