"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileSearch, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.appealdeck.com";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (data.user) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Auth is not configured.");
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
        setMessage("Check your email for a sign-in link.");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    router.refresh();
    router.replace("/app");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <Link
            href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://appealdeck.com"}/`}
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <FileSearch className="h-5 w-5" />
            </span>
            Appeal<span className="text-primary">Deck</span>
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full"
        >
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Access your AppealDeck seller tools.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
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
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
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

                {message && (
                  <p
                    role="alert"
                    className={
                      status === "error"
                        ? "text-sm text-destructive"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {message}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
                  {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "password" ? "Sign in" : "Email me a sign-in link"}
                </Button>
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
                {mode === "password" ? "Use a magic link instead" : "Use password instead"}
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
