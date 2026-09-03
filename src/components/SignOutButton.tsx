"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ email }: { email?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      router.push("/login");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed", { description: error.message });
      setPending(false);
      return;
    }
    toast.success("Signed out");
    router.refresh();
    router.push("/app/login");
  }

  return (
    <div className="flex items-center gap-2">
      {email && <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        aria-label="Sign out"
        className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
