import "fake-indexeddb/auto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { VaultDB } from "@/core/vault/db";
import { Vault, VaultAlreadyInitializedError } from "@/core/vault/vault";
const { getUser, getSession } = vi.hoisted(() => ({ getUser: vi.fn(), getSession: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { getUser, getSession } }),
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
  it("carries every guest case across, not only the active one", async () => {
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
    const one = createCaseFile("POLICY");
    const two = createCaseFile("POLICY");
    await saveCaseFile(guest, one);
    await saveCaseFile(guest, two);
    await guest.close();
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const returning = new ScopedBrowserVault(crypto);
    await returning.open();
    await returning.unlockWithDeviceKey();
    expect((await listCases(returning)).map((c) => c.id)).toEqual(
      expect.arrayContaining([first.id, one.id, two.id]),
    );
    await returning.close();
  });
  it("still opens a signed-in vault when the network session lookup fails", async () => {
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    databases.add(guestVaultName());
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const online = new ScopedBrowserVault(crypto);
    await online.open();
    await online.initWithDeviceKey();
    const kept = createCaseFile("POLICY");
    await saveCaseFile(online, kept);
    await online.close();
    // Offline: getUser() fails with a retryable fetch error, but the cached session is still there.
    getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthRetryableFetchError", message: "Failed to fetch" },
    });
    getSession.mockResolvedValue({ data: { session: { user: { id } } }, error: null });
    const offline = new ScopedBrowserVault(crypto);
    await offline.open();
    await offline.unlockWithDeviceKey();
    expect((await listCases(offline)).map((c) => c.id)).toContain(kept.id);
    await offline.close();
  });
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
  it("keeps a guest file that was never attached to a case when signing into an existing account", async () => {
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const account = new ScopedBrowserVault(crypto);
    await account.open();
    await account.initWithDeviceKey();
    await saveCaseFile(account, createCaseFile("POLICY"));
    await account.close();

    getUser.mockResolvedValue({ data: { user: null }, error: null });
    databases.add(guestVaultName());
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    // Added on the Vault page before any case existed: no case id.
    const loose = await guest.add({
      name: "loose.pdf",
      mimeType: "application/pdf",
      data: new TextEncoder().encode("%PDF-1.4 loose file"),
    });
    await guest.close();

    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const signedIn = new ScopedBrowserVault(crypto);
    await signedIn.open();
    await signedIn.unlockWithDeviceKey();
    const { bytes } = await signedIn.get(loose.id);
    expect(new TextDecoder().decode(bytes)).toBe("%PDF-1.4 loose file");
    await signedIn.close();
  });

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
  it("removes the guest database after a verified first sign-in copy", async () => {
    const guestName = guestVaultName();
    databases.add(guestName);
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    await guest.addString({ name: "d", mimeType: "text/plain", data: "x" });
    await guest.close();
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const account = new ScopedBrowserVault(crypto);
    await account.open();
    await account.unlockWithDeviceKey();
    expect((await indexedDB.databases()).map((d) => d.name)).not.toContain(guestName);
    await account.close();
  });
  it("leaves no empty guest database behind for a signed-in seller with an initialised vault", async () => {
    const id = crypto.randomUUID();
    databases.add(`appealdeck-vault-user-${id}`);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    const first = new ScopedBrowserVault(crypto);
    await first.open();
    await first.initWithDeviceKey();
    await first.close();
    // A new browser session: a new guest id, and nothing was ever put in that guest database.
    forgetGuestVault();
    const guestName = guestVaultName();
    const again = new ScopedBrowserVault(crypto);
    await again.open();
    await again.unlockWithDeviceKey();
    expect((await indexedDB.databases()).map((d) => d.name)).not.toContain(guestName);
    await again.close();
  });
  it("takes the already-initialised path when another tab wrote the account key first", async () => {
    const guestName = guestVaultName();
    databases.add(guestName);
    const guest = new ScopedBrowserVault(crypto);
    await guest.open();
    await guest.initWithDeviceKey();
    const draft = createCaseFile("POLICY");
    await saveCaseFile(guest, draft);
    await guest.close();
    const id = crypto.randomUUID();
    const accountName = `appealdeck-vault-user-${id}`;
    databases.add(accountName);
    getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    // The other tab gets in after this tab's isInitialized() check and before its copy.
    const spy = vi.spyOn(Vault.prototype, "copyIntoEmpty").mockImplementationOnce(async () => {
      const other = new Vault(crypto, new VaultDB(accountName));
      await other.open();
      await other.initWithDeviceKey();
      await other.close();
      throw new VaultAlreadyInitializedError();
    });
    const account = new ScopedBrowserVault(crypto);
    await account.open(); // used to throw
    spy.mockRestore();
    expect((await indexedDB.databases()).map((d) => d.name)).toContain(guestName);
    await account.unlockWithDeviceKey();
    expect((await listCases(account)).map((c) => c.id)).toContain(draft.id);
    await account.close();
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
