"use client";

import Dexie from "dexie";
import { Vault } from "@/core/vault/vault";
import { VAULT_DB_NAME, VAULT_DB_VERSION } from "@/core/vault/schema";
import { VAULT_ENVELOPE_VERSION } from "@/core/vault/envelope";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ScopedBrowserVault } from "./scoped";
import { VaultDB } from "@/core/vault/db";

const VAULT_BUCKET = "appealdeck-vault" as const;

/**
 * The bucket refuses any single file above this (`file_size_limit` in migration 0005). Checked
 * before uploading, so a vault that is too big for it is said to be too big — it used to reach the
 * seller as "Cloud backup could not be saved", a message that suggests trying again.
 */
export const BACKUP_MAX_BYTES = 10 * 1024 * 1024;
/**
 * Snapshots kept per seller. Every backup is a new timestamped file, and nothing ever removed the
 * old ones, so a seller who backed up after each change filled their folder with copies of
 * themselves. Three is enough that one bad or interrupted push never leaves nothing to restore.
 */
export const BACKUPS_KEPT = 3;

export function browserWebCrypto(): Crypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new Error("WebCrypto is not available in this browser context");
  }
  return globalThis.crypto;
}

export function getBrowserVault(name?: string): Vault {
  const cryptoObj = browserWebCrypto() as unknown as ConstructorParameters<typeof Vault>[0];
  return name ? new Vault(cryptoObj, new VaultDB(name)) : new ScopedBrowserVault(cryptoObj);
}

export interface SyncSummary {
  uploaded: number;
  skipped: number;
  errors: number;
  syncedAt: string;
}

export async function pushVaultToCloud(
  vault: Vault,
  userId: string,
  options: { supabase?: SupabaseClient; backupPassphrase?: string } = {},
): Promise<SyncSummary> {
  if (!vault.isUnlocked()) {
    throw new Error("Vault is locked — unlock before syncing");
  }
  const supabase = options.supabase ?? createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const exported = await vault.exportPortable(options.backupPassphrase);
  const payload = JSON.stringify({
    version: exported.version,
    meta: exported.meta,
    records: exported.records,
  });
  const path = `${userId}/vault-${VAULT_ENVELOPE_VERSION}-${Date.now()}.json`;
  const blob = new Blob([payload], { type: "application/json" });
  if (blob.size > BACKUP_MAX_BYTES) {
    // Files travel inside the backup as text, which is about a third larger than they are on disk.
    const packed = Math.ceil(blob.size / (1024 * 1024));
    const limit = Math.round(BACKUP_MAX_BYTES / (1024 * 1024));
    throw new Error(
      `Your vault is about ${packed} MB once packed for a backup, and a cloud backup holds up to ${limit} MB. Nothing was uploaded and your files here are unchanged. Download the largest files to your own drive, remove them from the vault, and try again.`,
    );
  }
  const { error } = await supabase.storage.from(VAULT_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "no-store",
  });
  if (error) {
    throw new Error("Cloud backup could not be saved. Your local files are unchanged.");
  }
  await pruneOldBackups(supabase, userId);
  return { uploaded: 1, skipped: 0, errors: 0, syncedAt: new Date().toISOString() };
}

/**
 * Removes all but the newest few snapshots of this seller's current format. Housekeeping only: the
 * backup has already been saved, so a failure here is swallowed rather than reported as one.
 */
async function pruneOldBackups(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const { data: files } = await supabase.storage
      .from(VAULT_BUCKET)
      .list(userId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    const prefix = `vault-${VAULT_ENVELOPE_VERSION}-`;
    const stale = (files ?? [])
      .filter((f: { name: string }) => f.name.startsWith(prefix))
      .slice(BACKUPS_KEPT)
      .map((f: { name: string }) => `${userId}/${f.name}`);
    if (stale.length > 0) await supabase.storage.from(VAULT_BUCKET).remove(stale);
  } catch {
    // Old copies are only wasted space.
  }
}

export async function pullVaultFromCloud(
  vault: Vault,
  userId: string,
  options: { sourcePassphrase: string; destinationPassphrase: string; supabase?: SupabaseClient },
): Promise<{ imported: number; file: string }> {
  const supabase = options.supabase ?? createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const { data: files, error } = await supabase.storage
    .from(VAULT_BUCKET)
    .list(userId, { limit: 50, sortBy: { column: "created_at", order: "desc" } });
  if (error) {
    throw new Error(`Could not list vault snapshots: ${error.message}`);
  }
  const candidate = files?.find((f: { name: string }) =>
    f.name.startsWith(`vault-${VAULT_ENVELOPE_VERSION}-`),
  );
  if (!candidate) {
    throw new Error("No matching vault snapshot found for this account");
  }
  const { data: blob, error: dlErr } = await supabase.storage
    .from(VAULT_BUCKET)
    .download(`${userId}/${candidate.name}`);
  if (dlErr || !blob) {
    throw new Error(`Could not download vault snapshot: ${dlErr?.message ?? "empty body"}`);
  }
  const text = await blob.text();
  const payload = JSON.parse(text) as {
    version: number;
    meta: Parameters<Vault["importAll"]>[0] extends infer T
      ? T extends { meta: infer M }
        ? M
        : never
      : never;
    records: Parameters<Vault["importAll"]>[0] extends infer T
      ? T extends { records: infer R }
        ? R
        : never
      : never;
  };
  const imported = await vault.importAll(
    {
      version: payload.version,
      meta: payload.meta as never,
      records: payload.records as never,
    },
    {
      sourcePassphrase: options.sourcePassphrase,
      destinationPassphrase: options.destinationPassphrase,
    },
  );
  return { imported, file: candidate.name };
}

export const __test = { VAULT_BUCKET, VAULT_DB_NAME, VAULT_DB_VERSION, Dexie };
