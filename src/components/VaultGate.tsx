"use client";

import * as React from "react";
import { ShieldCheck, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { VaultCryptoError } from "@/core/vault/envelope";
import type { Vault, VaultStatus } from "@/core/vault/vault";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";

type Phase =
  { kind: "loading" } | { kind: "needs_init" } | { kind: "locked" } | { kind: "unlocked" };

const VAULT_CRYPTO_ERROR_CODE = "WRONG_PASSPHRASE" as const;

function isVaultCryptoError(e: unknown): e is VaultCryptoError {
  return e instanceof VaultCryptoError;
}

export interface VaultGateProps {
  vault: Vault | null;
  children: (vault: Vault) => React.ReactNode;
  onUnlocked?: () => void;
}

export function VaultGate({ vault, children, onUnlocked }: VaultGateProps) {
  const [phase, setPhase] = React.useState<Phase>({ kind: "loading" });

  React.useEffect(() => {
    if (!vault) {
      setPhase({ kind: "loading" });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await vault.open();
        const initialized = await vault.isInitialized();
        if (cancelled) return;
        if (!initialized) {
          setPhase({ kind: "needs_init" });
          return;
        }
        const status: VaultStatus = await vault.status();
        if (cancelled) return;
        if (status.state === "locked") {
          setPhase({ kind: "locked" });
          return;
        }
        setPhase({ kind: "unlocked" });
      } catch {
        if (cancelled) return;
        setPhase({ kind: "loading" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vault]);

  if (!vault || phase.kind === "loading") {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase.kind === "needs_init") {
    return <VaultInitForm vault={vault} onDone={() => setPhase({ kind: "unlocked" })} />;
  }

  if (phase.kind === "locked") {
    return (
      <VaultUnlockForm
        vault={vault}
        onUnlocked={() => {
          onUnlocked?.();
          setPhase({ kind: "unlocked" });
        }}
      />
    );
  }

  return <>{children(vault)}</>;
}

interface VaultInitFormProps {
  vault: Vault;
  onDone: () => void;
}

function VaultInitForm({ vault, onDone }: VaultInitFormProps) {
  const [passphrase, setPassphrase] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = passphrase.length >= 8 && passphrase === confirm && !busy;

  const handleInit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await vault.initWithPassphrase(passphrase);
      toast.success("Vault created", {
        description: "Your evidence is now encrypted on this device.",
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create vault.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-2 text-lg font-semibold">Set a vault passphrase</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Your case file and evidence are encrypted on this device with a key derived from this
          passphrase (PBKDF2-SHA-256, 310,000 iterations) plus AES-GCM. We never see the passphrase.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="vault-create-passphrase">Passphrase (min 8 chars)</Label>
            <Input
              id="vault-create-passphrase"
              type="password"
              autoComplete="new-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              aria-invalid={!!error}
              aria-describedby="vault-create-error"
            />
            {error && (
              <p id="vault-create-error" className="mt-1 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="vault-create-confirm">Confirm passphrase</Label>
            <Input
              id="vault-create-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={passphrase !== confirm && confirm.length > 0}
            />
            {passphrase !== confirm && confirm.length > 0 && (
              <p className="mt-1 text-xs text-destructive">Passphrases do not match</p>
            )}
          </div>
          <Button onClick={handleInit} disabled={!canSubmit}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {busy ? "Creating…" : "Create vault"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface VaultUnlockFormProps {
  vault: Vault;
  onUnlocked: () => void;
}

function VaultUnlockForm({ vault, onUnlocked }: VaultUnlockFormProps) {
  const [passphrase, setPassphrase] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUnlock = async () => {
    if (passphrase.length < 8 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await vault.unlock(passphrase);
      setPassphrase("");
      onUnlocked();
    } catch (e) {
      if (isVaultCryptoError(e) && e.code === VAULT_CRYPTO_ERROR_CODE) {
        setError("That passphrase didn't unlock the vault.");
      } else {
        setError(e instanceof Error ? e.message : "Unlock failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-2 text-lg font-semibold">Unlock your vault</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Enter your passphrase to decrypt your case data. The key never leaves your device.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="vault-unlock-passphrase">Passphrase</Label>
            <Input
              id="vault-unlock-passphrase"
              type="password"
              autoComplete="current-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUnlock();
              }}
              aria-invalid={!!error}
              aria-describedby="vault-unlock-error"
            />
            {error && (
              <p id="vault-unlock-error" className="mt-1 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <Button onClick={handleUnlock} disabled={passphrase.length < 8 || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="size-4" />}
            {busy ? "Unlocking…" : "Unlock"}
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <a
            href="/vault"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Need to set up or recover your vault?
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

export function VaultEmptyState() {
  return (
    <EmptyState
      icon={FileText}
      title="No evidence yet"
      description="Add supplier invoices, brand authorizations, and other documents. Evidence grounds your Plan of Action and must be attached before submission."
      action={<></>}
    />
  );
}
