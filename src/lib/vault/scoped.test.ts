import "fake-indexeddb/auto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { VaultDB } from "@/core/vault/db";
import { Vault } from "@/core/vault/vault";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { getUser } }),
}));
import { ScopedBrowserVault, guestVaultName, forgetGuestVault } from "./scoped";
import { createCaseFile } from "@/core/caseFile";
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
  /**
   * B, 23 Sep 2026. The test above checks that the case transfers, and it does — which is exactly
   * how this survived. `mergeGuestDraft` copied the case file and the case log and nothing else, so
   * every document a seller had attached before signing in stayed behind in the guest database.
   * Then `forgetGuestVault()` discarded the only secret that could unlock it, and never deleted the
   * database itself: the files were unrecoverable and still on disk.
   *
   * The requirements came across intact, so the case still *named* each file by id, filename and
   * hash. It showed an attachment that could not be opened, checked or downloaded.
   *
   * AM-21 puts sign-in at the first document step on purpose, so this is the designed path rather
   * than an edge case. The first-time-account path (`copyIntoEmpty`) copies the whole vault, which
   * is why only a returning seller was affected.
   */
  it("brings a guest case's documents across when signing into an existing account", async () => {
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const account = new ScopedBrowserVault(crypto);
    await account.open();
    await account.initWithDeviceKey();
    await saveCaseFile(account, createCaseFile("POLICY"));
    await account.close();

    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const guestName = guestVaultName();
    databases.add(guestName);
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    const draft = createCaseFile("INAUTHENTIC");
    const invoice = await guest.add({
      name: "supplier-invoice.pdf",
      mimeType: "application/pdf",
      data: new TextEncoder().encode("%PDF-1.4 fictional invoice"),
      caseId: draft.id,
      evidenceKind: "supplier_invoice",
    });
    await saveCaseFile(guest, draft);
    await guest.close();

    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const returning = new ScopedBrowserVault(crypto);
    await returning.open();
    await returning.unlockWithDeviceKey();

    // The same id, so every requirement and submission that names it still resolves.
    const { record, bytes } = await returning.get(invoice.id);
    expect(new TextDecoder().decode(bytes)).toBe("%PDF-1.4 fictional invoice");
    expect(record.name).toBe("supplier-invoice.pdf");
    expect(record.caseId).toBe(draft.id);
    expect(record.evidenceKind).toBe("supplier_invoice");
    // And the hash a requirement carries still matches, because the bytes are identical.
    expect(record.plaintextHash).toBe(invoice.plaintextHash);
    await returning.close();

    // The guest database is removed once the copy is verified, not merely forgotten.
    const names = (await indexedDB.databases()).map((d) => d.name);
    expect(names).not.toContain(guestName);
  });

  /**
   * The other half of the same fix. Deleting the guest database is only safe once the copy is
   * proven, because after that nothing else holds the seller's files. So a copy that fails must
   * leave the guest data and its secret exactly where they were, and the merge must try again.
   */
  it("keeps the guest copy intact when documents fail to come across, and retries", async () => {
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const account = new ScopedBrowserVault(crypto);
    await account.open();
    await account.initWithDeviceKey();
    await saveCaseFile(account, createCaseFile("POLICY"));
    await account.close();

    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const guestName = guestVaultName();
    databases.add(guestName);
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    const draft = createCaseFile("INAUTHENTIC");
    const invoice = await guest.add({
      name: "supplier-invoice.pdf",
      mimeType: "application/pdf",
      data: new TextEncoder().encode("%PDF-1.4 fictional invoice"),
      caseId: draft.id,
    });
    await saveCaseFile(guest, draft);
    await guest.close();

    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const failing = vi
      .spyOn(Vault.prototype, "adoptRecord")
      .mockRejectedValueOnce(new Error("simulated write failure"));
    const first = new ScopedBrowserVault(crypto);
    await first.open();
    await expect(first.unlockWithDeviceKey()).rejects.toThrow(/simulated write failure/);
    await first.close();
    failing.mockRestore();

    // Nothing was thrown away: the guest database still exists and still answers to its secret.
    expect((await indexedDB.databases()).map((d) => d.name)).toContain(guestName);

    // And the case did not land half-copied. Read through a plain vault so no merge is triggered:
    // a case that arrived without its documents is precisely the defect being fixed, so the case
    // must be absent until its files can come with it.
    const raw = new Vault(crypto, new VaultDB(`appealdeck-vault-user-${id}`));
    await raw.open();
    await raw.unlockWithDeviceKey();
    expect((await listCases(raw)).map((c) => c.id)).not.toContain(draft.id);
    await raw.close();

    const probe = new ScopedBrowserVault(crypto);
    await probe.open();
    await probe.unlockWithDeviceKey();
    const { bytes } = await probe.get(invoice.id);
    expect(new TextDecoder().decode(bytes)).toBe("%PDF-1.4 fictional invoice");
    await probe.close();
    expect((await indexedDB.databases()).map((d) => d.name)).not.toContain(guestName);
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
