import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vault } from "@/core/vault/vault";
import { VAULT_ENVELOPE_VERSION } from "@/core/vault/envelope";
import {
  BACKUP_MAX_BYTES,
  BACKUPS_KEPT,
  pullVaultFromCloud,
  pushVaultToCloud,
} from "@/lib/vault/browser";

/**
 * The encrypted cloud backup (30 Sep 2026). The privacy policy offers it, the Vault page has the
 * buttons, and until now nothing tested any of it. Two things were wrong, both invisible until a
 * seller with a real vault used it:
 *
 * - Every backup is a new timestamped file and nothing removed the old ones.
 * - The bucket refuses a file over 10 MB, and the backup carries evidence files as text (a third
 *   larger than on disk), so an ordinary vault of a few phone photos could never be backed up — and
 *   was told only "could not be saved", which reads as a passing fault.
 */

type Entry = { name: string; created_at: string; body: Blob };

/** An in-memory stand-in for the one bucket, with the four calls the backup code makes. */
function fakeSupabase(seed: Entry[] = []) {
  const files = new Map<string, Entry>(seed.map((e) => [`u1/${e.name}`, e]));
  let clock = 1000;
  const api = {
    uploads: [] as string[],
    removed: [] as string[],
    names: () => [...files.keys()].map((k) => k.split("/")[1]!).sort(),
    client: {
      storage: {
        from: () => ({
          upload: async (path: string, body: Blob) => {
            api.uploads.push(path);
            files.set(path, { name: path.split("/")[1]!, created_at: String(++clock), body });
            return { error: null };
          },
          list: async (folder: string) => ({
            data: [...files.entries()]
              .filter(([k]) => k.startsWith(`${folder}/`))
              .map(([, e]) => e)
              .sort((a, b) => Number(b.created_at) - Number(a.created_at)),
            error: null,
          }),
          remove: async (paths: string[]) => {
            api.removed.push(...paths);
            for (const p of paths) files.delete(p);
            return { data: [], error: null };
          },
          download: async (path: string) => ({ data: files.get(path)?.body ?? null, error: null }),
        }),
      },
    } as unknown as SupabaseClient,
  };
  return api;
}

const vaultWith = (records: unknown[]) =>
  ({
    isUnlocked: () => true,
    exportPortable: async () => ({ version: VAULT_ENVELOPE_VERSION, meta: {}, records }),
  }) as unknown as Vault;

afterEach(() => vi.restoreAllMocks());

describe("cloud backup: size", () => {
  it("says a too-large vault is too large, and uploads nothing", async () => {
    const s = fakeSupabase();
    const huge = vaultWith([{ blob: "a".repeat(BACKUP_MAX_BYTES + 1) }]);

    const error = await pushVaultToCloud(huge, "u1", { supabase: s.client }).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/about 11 MB once packed/);
    expect(error.message).toMatch(/holds up to 10 MB/);
    expect(error.message).toMatch(/Nothing was uploaded/);
    // Not the old message, which suggested trying again.
    expect(error.message).not.toMatch(/could not be saved/);
    expect(s.uploads).toEqual([]);
  });

  it("accepts a vault that fits", async () => {
    const s = fakeSupabase();
    const r = await pushVaultToCloud(vaultWith([{ blob: "a".repeat(1000) }]), "u1", {
      supabase: s.client,
    });
    expect(r.uploaded).toBe(1);
    expect(s.uploads).toHaveLength(1);
  });
});

describe("cloud backup: old snapshots", () => {
  function pushAt(s: ReturnType<typeof fakeSupabase>, t: number) {
    vi.spyOn(Date, "now").mockReturnValue(t);
    return pushVaultToCloud(vaultWith([{ n: t }]), "u1", { supabase: s.client });
  }

  it("keeps only the newest few", async () => {
    const s = fakeSupabase();
    for (let i = 1; i <= 6; i++) await pushAt(s, 1_000_000 + i);

    const kept = s.names();
    expect(kept).toHaveLength(BACKUPS_KEPT);
    expect(kept).toEqual(
      [4, 5, 6].map((i) => `vault-${VAULT_ENVELOPE_VERSION}-${1_000_000 + i}.json`),
    );
  });

  it("leaves other formats' snapshots alone", async () => {
    const other: Entry = { name: "vault-99-1.json", created_at: "1", body: new Blob(["x"]) };
    const s = fakeSupabase([other]);
    for (let i = 1; i <= 5; i++) await pushAt(s, 2_000_000 + i);

    expect(s.names()).toContain("vault-99-1.json");
    expect(s.names().filter((n) => n.startsWith(`vault-${VAULT_ENVELOPE_VERSION}-`))).toHaveLength(
      BACKUPS_KEPT,
    );
  });

  it("does not fail a backup that saved because tidying up failed", async () => {
    const s = fakeSupabase();
    (s.client.storage as unknown as { from: () => unknown }).from = () => ({
      upload: async () => ({ error: null }),
      list: async () => {
        throw new Error("storage list is down");
      },
    });

    const r = await pushVaultToCloud(vaultWith([{ a: 1 }]), "u1", { supabase: s.client });
    expect(r.uploaded).toBe(1);
  });

  it("refuses to back up a locked vault", async () => {
    const locked = { isUnlocked: () => false } as unknown as Vault;
    await expect(
      pushVaultToCloud(locked, "u1", { supabase: fakeSupabase().client }),
    ).rejects.toThrow(/locked/i);
  });
});

describe("cloud backup: restore", () => {
  it("restores the newest snapshot", async () => {
    const s = fakeSupabase();
    for (const t of [3_000_001, 3_000_002, 3_000_003]) {
      vi.spyOn(Date, "now").mockReturnValue(t);
      await pushVaultToCloud(vaultWith([{ n: t }]), "u1", { supabase: s.client });
    }
    const seen: unknown[] = [];
    const target = {
      importAll: async (payload: { records: unknown[] }) => {
        seen.push(...payload.records);
        return payload.records.length;
      },
    } as unknown as Vault;

    const r = await pullVaultFromCloud(target, "u1", {
      sourcePassphrase: "a-passphrase",
      destinationPassphrase: "a-passphrase",
      supabase: s.client,
    });

    expect(r.file).toBe(`vault-${VAULT_ENVELOPE_VERSION}-3000003.json`);
    expect(seen).toEqual([{ n: 3_000_003 }]);
  });

  it("says so plainly when there is nothing to restore", async () => {
    const target = { importAll: async () => 0 } as unknown as Vault;
    await expect(
      pullVaultFromCloud(target, "u1", {
        sourcePassphrase: "a-passphrase",
        destinationPassphrase: "a-passphrase",
        supabase: fakeSupabase().client,
      }),
    ).rejects.toThrow(/No matching vault snapshot/);
  });
});
