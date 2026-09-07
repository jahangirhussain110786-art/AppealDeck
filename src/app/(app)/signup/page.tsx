"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setMessage(AUTH.signup.messages.weakPassword);
      return;
    }
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
      options: { emailRedirectTo: `${APP_URL}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
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
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <AuthShell
      title={AUTH.signup.title}
      subtitle={AUTH.signup.subtitle}
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

        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {AUTH.signup.fields.email}
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
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">{AUTH.signup.fields.passwordHint}</p>
          </div>

          <StatusMessage status={status} message={message} />
          <SubmitButton status={status} label={AUTH.signup.messages.submit} />
        </form>
      </motion.div>
    </AuthShell>
  );
}
