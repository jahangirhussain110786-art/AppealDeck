"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, SubmitButton, StatusMessage, SuccessBanner } from "@/components/AuthCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/urls";
import { AUTH } from "@/content/auth";
import type { AuthStatus } from "@/components/AuthCard";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(AUTH.forgotPassword.messages.notConfigured);
      return;
    }
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(AUTH.forgotPassword.messages.sent);
  }

  return (
    <AuthShell
      title={AUTH.forgotPassword.title}
      subtitle={AUTH.forgotPassword.subtitle}
      footerPrompt={AUTH.forgotPassword.footer.prompt}
      footerAction={AUTH.forgotPassword.footer.action}
      footerHref="/login"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="-mt-4"
      >
        {status === "sent" ? (
          <SuccessBanner message={AUTH.forgotPassword.messages.sent} />
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 space-y-3">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {AUTH.forgotPassword.fields.email}
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
                className="mt-1"
              />
            </div>

            <StatusMessage status={status} message={message} />
            <SubmitButton status={status} label={AUTH.forgotPassword.messages.submit} />
          </form>
        )}

        {status === "sent" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{AUTH.forgotPassword.success.whatToDo}</p>
            <Button asChild size="lg" className="w-full">
              <a href="/login">{AUTH.forgotPassword.success.backToSignIn}</a>
            </Button>
          </div>
        )}
      </motion.div>
    </AuthShell>
  );
}
