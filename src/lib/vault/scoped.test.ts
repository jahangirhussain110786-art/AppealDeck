import "fake-indexeddb/auto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { VaultDB } from "@/core/vault/db";
import { Vault } from "@/core/vault/vault";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { getUser } }),
}));
import { ScopedBrowserVault, guestVaultName, forgetGuestVault } from "./scoped";
import { createCaseFile } from "@/core/interviewEngine";
import { saveCaseFile, listCases, loadCaseFile } from "@/lib/caseStore";
import { ensureFreshGuestSession } from "./guestSession";
const databases = new Set<string>();
beforeEach(() => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
  };
  vi.stubGlobal("window", { sessionStorage: storage });
  vi.stubGlobal("sessionStorage", storage);
  getUser.mockResolvedValue({ data: { user: null }, error: null });
});
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const name of databases) {
    const db = new VaultDB(name);
    db.close();
    await db.delete();
  }
  databases.clear();
});
describe("vault ownership", () => {
  it("merges a guest draft into an existing account without replacing older cases", async () => {
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    databases.add(guestVaultName());
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const account = new ScopedBrowserVault(crypto);
    await account.open();
    await account.initWithDeviceKey();
    const first = createCaseFile("POLICY");
    await saveCaseFile(account, first);
    await account.close();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    databases.add(guestVaultName());
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    const draft = createCaseFile("POLICY");
    draft.rootCause = "new guest draft";
    await saveCaseFile(guest, draft);
    await guest.close();
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const returning = new ScopedBrowserVault(crypto);
    await returning.open();
    await returning.unlockWithDeviceKey();
    expect((await listCases(returning)).map((c) => c.id)).toEqual(
      expect.arrayContaining([first.id, draft.id]),
    );
    expect((await loadCaseFile(returning))?.rootCause).toBe("new guest draft");
    await returning.close();
  });
  it("moves an ephemeral guest key into a persistent account key on sign-in", async () => {
    const name = guestVaultName();
    databases.add(name);
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    const record = await guest.addString({
      name: "draft",
      mimeType: "text/plain",
      data: "guest draft",
    });
    expect((await guest.rawMeta())?.mode.kind).toBe("passphrase");
    await guest.close();
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const account = new ScopedBrowserVault(crypto);
    await account.open();
    await account.unlockWithDeviceKey();
    expect((await account.getString(record.id)).text).toBe("guest draft");
    expect((await account.rawMeta())?.mode.kind).toBe("device");
    forgetGuestVault();
    await account.close();
    const reopened = new ScopedBrowserVault(crypto);
    databases.add(guestVaultName());
    await reopened.open();
    await reopened.unlockWithDeviceKey();
    expect((await reopened.getString(record.id)).text).toBe("guest draft");
    await reopened.close();
  });
  it("guest cleanup never deletes the old shared vault", async () => {
    const legacy = new Vault(crypto, new VaultDB("appealdeck-vault"));
    databases.add("appealdeck-vault");
    await legacy.open();
    await legacy.initWithDeviceKey();
    const r = await legacy.addString({ name: "owned", mimeType: "text/plain", data: "preserve" });
    const guest = new ScopedBrowserVault(crypto);
    databases.add(guestVaultName());
    await ensureFreshGuestSession(guest, false);
    expect(await guest.isInitialized()).toBe(false);
    expect((await legacy.getString(r.id)).text).toBe("preserve");
    await guest.close();
    await legacy.close();
  });
  it("accounts and new guest sessions have separate records", async () => {
    const aId = crypto.randomUUID(),
      bId = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${aId}`);
    databases.add(`appealdeck-vault-user-${bId}`);
    databases.add(guestVaultName());
    getUser.mockResolvedValue({ data: { user: { id: aId } }, error: null });
    const a = new ScopedBrowserVault(crypto);
    await a.open();
    await a.initWithDeviceKey();
    await a.addString({ name: "private", mimeType: "text/plain", data: "a only" });
    databases.add(guestVaultName());
    getUser.mockResolvedValue({ data: { user: { id: bId } }, error: null });
    const b = new ScopedBrowserVault(crypto);
    await b.open();
    expect(await b.isInitialized()).toBe(false);
    expect(await b.list()).toHaveLength(0);
    const old = guestVaultName();
    forgetGuestVault();
    expect(guestVaultName()).not.toBe(old);
    databases.add(guestVaultName());
    await a.close();
    await b.close();
  });
});
