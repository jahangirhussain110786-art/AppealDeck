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
  /**
   * Moves a guest case into the signed-in account — the case, its log, **and its documents**.
   *
   * Corrected 23 Sep 2026. This copied the case file and the case log and stopped, so every
   * document a seller attached before signing in stayed in the guest database. `forgetGuestVault()`
   * then threw away the only secret able to decrypt it, without deleting the database: the files
   * were unrecoverable and still sitting in the browser. The requirements came across intact, so
   * the case went on naming each file by id, filename and hash — an attachment that could not be
   * opened, checked or downloaded. AM-21 asks for sign-in at the first document step, so this was
   * the designed path rather than an edge case; only returning sellers hit it, because a first
   * sign-in goes through `copyIntoEmpty`, which copies everything.
   *
   * Order matters, and each step is there for a reason:
   *
   * 1. **Decrypt before the write transaction.** An IndexedDB transaction commits itself as soon as
   *    it has nothing pending on its own database, so awaiting reads from a *different* database
   *    inside it would end it early. Everything is read out first; the account's transaction only
   *    writes.
   * 2. **Case, log and documents in one transaction.** Either all of it lands or none of it does,
   *    so a failure can never leave a case pointing at files that were not copied.
   * 3. **Verify, then delete.** Each copied document is read back and its hash compared before the
   *    guest database is removed. Until that passes, the guest data and its secret are left exactly
   *    where they were, and the merge is retried on the next unlock.
   */
  private async mergeGuestDraft() {
    const source = new Vault(globalThis.crypto, new VaultDB(this.pendingGuest!));
    await source.open();
    let verified = false;
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

      const documents: Array<Awaited<ReturnType<Vault["get"]>>> = [];
      if (file) {
        for (const item of await source.list({ caseId: file.id })) {
          if (item.kind === "document") documents.push(await source.get(item.id));
        }
      }

      if (file) {
        await this.atomic(async () => {
          const existing = await listCases(this);
          if (!existing.some((entry) => entry.id === file.id)) {
            await saveCaseFile(this, file);
            if (log) await saveCaseLog(this, log);
          } else await setActiveCaseId(this, file.id);
          // Adopted whether or not the case was already here: a merge interrupted after an older
          // version of this code copied the case would otherwise never bring its documents across.
          for (const { record, bytes } of documents) await this.adoptRecord(record, bytes);
        });
      }

      for (const { record } of documents) {
        const copied = await this.get(record.id);
        if (copied.record.plaintextHash !== record.plaintextHash) {
          throw new Error(
            `A document did not copy intact (${record.name}). Your guest copy has been kept.`,
          );
        }
      }
      verified = true;
      this.pendingGuest = undefined;
      forgetGuestVault();
    } finally {
      // Only a verified merge removes the guest database; anything else leaves it for a retry.
      if (verified) await source.destroy();
      else await source.close();
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
