"use client";

import Dexie from "dexie";
import { Vault } from "@/core/vault/vault";
import { VAULT_DB_NAME, VAULT_DB_VERSION } from "@/core/vault/schema";
import { VAULT_ENVELOPE_VERSION } from "@/core/vault/envelope";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toBase64 } from "@/core/vault/crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const VAULT_BUCKET = "appealdeck-vault" as const;

export function browserWebCrypto(): Crypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new Error("WebCrypto is not available in this browser context");
  }
  return globalThis.crypto;
}

export function getBrowserVault(name: string = VAULT_DB_NAME): Vault {
  const cryptoObj = browserWebCrypto() as unknown as ConstructorParameters<typeof Vault>[0];
  return new Vault(cryptoObj);
}

export interface SyncResult {
  uploaded: number;
  skipped: number;
  errors: number;
  syncedAt: string;
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
  options: { supabase?: SupabaseClient } = {},
): Promise<SyncSummary> {
  if (!vault.isUnlocked()) {
    throw new Error("Vault is locked — unlock before syncing");
  }
  const supabase = options.supabase ?? createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const exported = await vault.exportAll();
  const payload = JSON.stringify({
    version: exported.version,
    meta: exported.meta,
    records: exported.records,
  });
  const path = `${userId}/vault-${VAULT_ENVELOPE_VERSION}-${Date.now()}.json`;
  const blob = new Blob([payload], { type: "application/json" });
  const { error } = await supabase.storage.from(VAULT_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "no-store",
  });
  if (error) {
    return { uploaded: 0, skipped: 0, errors: 1, syncedAt: new Date().toISOString() };
  }
  return { uploaded: 1, skipped: 0, errors: 0, syncedAt: new Date().toISOString() };
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

export function asBase64(bytes: Uint8Array): string {
  return toBase64(bytes);
}

export const __test = { VAULT_BUCKET, VAULT_DB_NAME, VAULT_DB_VERSION, Dexie };
