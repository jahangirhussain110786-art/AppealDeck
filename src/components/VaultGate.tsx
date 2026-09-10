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
import { APP } from "@/content/app";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Phase =
  | { kind: "loading" }
  | { kind: "needs_init" }
  | { kind: "device_set_passphrase" }
  | { kind: "locked" }
  | { kind: "unlocked" };

const VAULT_CRYPTO_ERROR_CODE = "WRONG_PASSPHRASE" as const;

function isVaultCryptoError(e: unknown): e is VaultCryptoError {
  return e instanceof VaultCryptoError;
}

export interface VaultGateProps {
  vault: Vault | null;
  children: (vault: Vault) => React.ReactNode;
  onUnlocked?: () => void;
  onLocked?: () => void;
  idleMs?: number;
  warnMs?: number;
  deviceMode?: boolean;
  autoUnlock?: boolean;
}

export function VaultGate({
  vault,
  children,
  onUnlocked,
  onLocked,
  idleMs = 15 * 60_000,
  warnMs = 60_000,
  deviceMode = false,
  autoUnlock = false,
}: VaultGateProps) {
  const [phase, setPhase] = React.useState<Phase>({ kind: "loading" });
  const [warning, setWarning] = React.useState(false);

  const phaseRef = React.useRef(phase);
  const onLockedRef = React.useRef(onLocked);
  const lockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReset = React.useRef(0);

  React.useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  React.useEffect(() => {
    onLockedRef.current = onLocked;
  }, [onLocked]);

  const clearTimers = React.useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    lockTimer.current = warnTimer.current = null;
  }, []);

  const resetIdleTimer = React.useCallback(() => {
    if (phaseRef.current.kind !== "unlocked") return;
    clearTimers();
    setWarning(false);
    warnTimer.current = setTimeout(() => {
      if (phaseRef.current.kind === "unlocked") setWarning(true);
    }, idleMs - warnMs);
    lockTimer.current = setTimeout(() => {
      if (phaseRef.current.kind !== "unlocked") return;
      clearTimers();
      setWarning(false);
      void vault?.lock();
      setPhase({ kind: "locked" });
      onLockedRef.current?.();
      toast.info(APP.vault.idleLock.locked, {
        description: APP.vault.idleLock.lockedDesc,
      });
    }, idleMs);
  }, [vault, idleMs, warnMs, clearTimers]);

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
          if (deviceMode && autoUnlock) {
            await vault.initWithDeviceKey();
            setPhase({ kind: "unlocked" });
          } else if (deviceMode) {
            setPhase({ kind: "device_set_passphrase" });
          } else {
            setPhase({ kind: "needs_init" });
          }
          return;
        }
        const status: VaultStatus = await vault.status();
        if (cancelled) return;
        if (status.state === "locked") {
          if (status.mode === "device" && autoUnlock) {
            await vault.unlockWithDeviceKey();
            setPhase({ kind: "unlocked" });
          } else if (status.mode === "device" && deviceMode) {
            setPhase({ kind: "device_set_passphrase" });
          } else {
            setPhase({ kind: "locked" });
          }
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
  }, [vault, deviceMode, autoUnlock]);

  React.useEffect(() => {
    if (phase.kind !== "unlocked") return;

    resetIdleTimer();

    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "scroll"];
    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset.current < 1_000) return;
      lastReset.current = now;
      resetIdleTimer();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") resetIdleTimer();
    };

    for (const ev of events) window.addEventListener(ev, onActivity, { passive: true });
    window.addEventListener("visibilitychange", onVisibility);

    return () => {
      for (const ev of events) window.removeEventListener(ev, onActivity);
      window.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
    };
  }, [phase.kind, resetIdleTimer, clearTimers]);

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

  if (phase.kind === "device_set_passphrase") {
    return <VaultDeviceRelockForm vault={vault} onDone={() => setPhase({ kind: "unlocked" })} />;
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

  return (
    <>
      {warning && (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>{APP.vault.idleLock.warningTitle}</AlertTitle>
          <AlertDescription>
            {APP.vault.idleLock.warningDesc}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setWarning(false);
                resetIdleTimer();
              }}
            >
              {APP.vault.idleLock.stay}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {children(vault)}
    </>
  );
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
      toast.success(APP.vault.create.success, {
        description: APP.vault.create.successDesc,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : APP.vault.create.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-2 text-lg font-semibold">{APP.vault.create.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{APP.vault.create.body}</p>

        <Alert variant="warning" className="mb-4">
          <AlertDescription>{APP.vault.create.lossWarning}</AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="vault-create-passphrase">{APP.vault.create.passphraseLabel}</Label>
            <Input
              id="vault-create-passphrase"
              type="password"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
            <Label htmlFor="vault-create-confirm">{APP.vault.create.confirmLabel}</Label>
            <Input
              id="vault-create-confirm"
              type="password"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={passphrase !== confirm && confirm.length > 0}
            />
            {passphrase !== confirm && confirm.length > 0 && (
              <p className="mt-1 text-xs text-destructive">{APP.vault.create.mismatchError}</p>
            )}
          </div>
          <Button onClick={handleInit} disabled={!canSubmit}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {busy ? APP.vault.create.submitting : APP.vault.create.submit}
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
        setError(APP.vault.unlock.error);
      } else {
        setError(e instanceof Error ? e.message : APP.vault.unlock.genericError);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-2 text-lg font-semibold">{APP.vault.unlock.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{APP.vault.unlock.desc}</p>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="vault-unlock-passphrase">{APP.vault.unlock.placeholder}</Label>
            <Input
              id="vault-unlock-passphrase"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
            {busy ? APP.vault.unlock.submitting : APP.vault.unlock.submit}
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <a
            href="/vault"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {APP.vault.unlock.recoverLink}
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

interface VaultDeviceRelockProps {
  vault: Vault;
  onDone: () => void;
}

function VaultDeviceRelockForm({ vault, onDone }: VaultDeviceRelockProps) {
  const [passphrase, setPassphrase] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = passphrase.length >= 8 && passphrase === confirm && !busy;

  const handleRelock = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await vault.relockWithPassphrase(passphrase);
      toast.success(APP.vault.create.success, {
        description: APP.vault.create.successDesc,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : APP.vault.unlock.genericError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-2 text-lg font-semibold">{APP.access.setPassphrase.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{APP.access.setPassphrase.body}</p>

        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="vault-device-relock-passphrase">
              {APP.vault.create.passphraseLabel}
            </Label>
            <Input
              id="vault-device-relock-passphrase"
              type="password"
              autoComplete="new-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              aria-invalid={!!error}
              aria-describedby="vault-device-relock-error"
            />
          </div>
          <div>
            <Label htmlFor="vault-device-relock-confirm">{APP.vault.create.confirmLabel}</Label>
            <Input
              id="vault-device-relock-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={passphrase !== confirm && confirm.length > 0}
            />
          </div>
          {error && (
            <p id="vault-device-relock-error" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <Button onClick={handleRelock} disabled={!canSubmit}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {busy ? APP.vault.create.submitting : APP.vault.create.submit}
          </Button>
        </div>
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
