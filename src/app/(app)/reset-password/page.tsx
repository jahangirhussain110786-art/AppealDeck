"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!data.user) {
        const error = searchParams.get("error");
        router.replace(`/login${error ? `?error=${encodeURIComponent(error)}` : ""}`);
      }
    });
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Auth is not configured.");
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
    setMessage("Your password has been updated.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full"
        >
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a strong password you haven&apos;t used before.
              </p>

              {status === "done" ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/5 p-3 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {message}
                  </div>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/case">Go to your case</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                  <div>
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      New password
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
                  </div>
                  <div>
                    <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                      Confirm new password
                    </label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {message && status === "error" && (
                    <p role="alert" className="text-sm text-destructive">
                      {message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={status === "loading"}
                  >
                    {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update password
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
