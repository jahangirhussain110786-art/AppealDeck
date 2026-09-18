"use client";
import { Vault } from "@/core/vault/vault";
import {
  loadCaseFile,
  loadCaseLog,
  saveCaseFile,
  saveCaseLog,
  listCases,
  setActiveCaseId,
} from "@/lib/caseStore";
import { VaultDB } from "@/core/vault/db";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SESSION = "appealdeck-guest-vault-id";
const SECRET = "appealdeck-guest-vault-secret";
let transientId: string | undefined;
let transientSecret: string | undefined;
export function guestVaultName(): string {
  if (typeof window === "undefined") return "appealdeck-vault-ssr";
  try {
    let id = sessionStorage.getItem(SESSION);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION, id);
    }
    return `appealdeck-vault-guest-${id}`;
  } catch {
    transientId ??= crypto.randomUUID();
    return `appealdeck-vault-guest-${transientId}`;
  }
}
export function forgetGuestVault(): void {
  try {
    sessionStorage.removeItem(SESSION);
    sessionStorage.removeItem(SECRET);
  } catch {
    /* restricted storage */
  }
  transientId = undefined;
  transientSecret = undefined;
}

function guestSecret(): string {
  try {
    let secret = sessionStorage.getItem(SECRET);
    if (!secret) {
      secret = crypto.randomUUID() + crypto.randomUUID();
      sessionStorage.setItem(SECRET, secret);
    }
    return secret;
  } catch {
    transientSecret ??= crypto.randomUUID() + crypto.randomUUID();
    return transientSecret;
  }
}
/** Account changes receive separate databases; legacy unowned data is never auto-claimed. */
export class ScopedBrowserVault extends Vault {
  private opening?: Promise<void>;
  private unsubscribe?: () => void;
  private guest = false;
  private pendingGuest?: string;
  private pendingGuestSecret?: string;
  private merging?: Promise<void>;
  override async status() {
    const status = await super.status();
    return this.guest && status.state === "locked"
      ? { ...status, mode: "device" as const }
      : status;
  }
  override async initWithDeviceKey() {
    if (!this.guest) {
      await super.initWithDeviceKey();
      await this.mergeGuest();
      return;
    }
    if (!(await this.isInitialized())) {
      try {
        await super.initWithPassphrase(guestSecret());
        return;
      } catch (error) {
        if ((error as Error).name !== "ConstraintError") throw error;
      }
    }
    await super.unlock(guestSecret());
  }
  override async unlockWithDeviceKey() {
    if (this.guest) await super.unlock(guestSecret());
    else {
      await super.unlockWithDeviceKey();
      await this.mergeGuest();
    }
  }
  override async unlock(passphrase: string) {
    await super.unlock(passphrase);
    if (!this.guest) await this.mergeGuest();
  }
  private async mergeGuest() {
    if (!this.pendingGuest) return;
    this.merging ??= this.mergeGuestDraft().finally(() => {
      this.merging = undefined;
    });
    await this.merging;
  }
  private async mergeGuestDraft() {
    const source = new Vault(globalThis.crypto, new VaultDB(this.pendingGuest!));
    await source.open();
    try {
      if (!(await source.isInitialized())) {
        this.pendingGuest = undefined;
        return;
      }
      const meta = await source.rawMeta();
      if (meta?.mode.kind === "device") await source.unlockWithDeviceKey();
      else await source.unlock(this.pendingGuestSecret ?? guestSecret());
      const file = await loadCaseFile(source);
      const log = await loadCaseLog(source);
      if (file) {
        await this.atomic(async () => {
          const existing = await listCases(this);
          if (!existing.some((entry) => entry.id === file.id)) {
            await saveCaseFile(this, file);
            if (log) await saveCaseLog(this, log);
          } else await setActiveCaseId(this, file.id);
        });
      }
      this.pendingGuest = undefined;
      forgetGuestVault();
    } finally {
      await source.close();
    }
  }
  override open(): Promise<void> {
    this.opening ??= this.openScoped().catch((error) => {
      this.opening = undefined;
      throw error;
    });
    return this.opening;
  }
  override async close() {
    this.unsubscribe?.();
    await super.close();
    this.opening = undefined;
  }
  private async openScoped() {
    const client = createSupabaseBrowserClient();
    const result = client ? await client.auth.getUser() : null;
    const user = result?.data.user;
    if (result?.error && result.error.name !== "AuthSessionMissingError") throw result.error;
    const guestName = guestVaultName();
    this.guest = !user;
    this.db = new VaultDB(user ? `appealdeck-vault-user-${user.id}` : guestName);
    await super.open();
    if (client?.auth.onAuthStateChange) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if ((session?.user.id ?? null) !== (user?.id ?? null)) {
          this.lock();
          this.db.close();
          if (user) forgetGuestVault();
          window.location.reload();
        }
      });
      this.unsubscribe = () => data.subscription.unsubscribe();
    }
    if (user && (await this.isInitialized())) {
      this.pendingGuest = guestName;
      this.pendingGuestSecret = guestSecret();
    }
    if (user && !(await this.isInitialized())) {
      const guest = new Vault(globalThis.crypto, new VaultDB(guestName));
      await guest.open();
      try {
        if (await guest.isInitialized()) {
          const meta = await guest.rawMeta();
          await this.copyIntoEmpty(
            guest,
            meta?.mode.kind === "passphrase" ? guestSecret() : undefined,
          );
        }
      } finally {
        await guest.close();
      }
      forgetGuestVault();
    }
  }
}
