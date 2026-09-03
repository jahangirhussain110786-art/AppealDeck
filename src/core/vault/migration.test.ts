import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { Vault } from "./vault";
import { VaultDB } from "./db";
import { decryptBytes, encryptBytes } from "./crypto";
import { VAULT_ENVELOPE_VERSION, type EncryptionEnvelope } from "./envelope";

function provider() {
  return {
    subtle: webcrypto.subtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as Parameters<typeof Vault>[0];
}

const TARGET = 10_000;

describe("AA-16: 10k-record migration harness", () => {
  const dbNameV1 = `appealdeck-mig-v1-${Math.random().toString(36).slice(2)}`;
  const dbNameV2 = `appealdeck-mig-v2-${Math.random().toString(36).slice(2)}`;

  beforeAll(async () => {
    const v1 = new Vault(provider(), new VaultDB(dbNameV1));
    await v1.open();
    await v1.initWithPassphrase("migration-test-pass");
    const t0 = Date.now();
    for (let i = 0; i < TARGET; i += 1) {
      await v1.add({
        name: `doc-${i}`,
        mimeType: "text/plain",
        data: new TextEncoder().encode(`payload #${i} - ${Math.random().toString(36)}`),
        tags: [i % 7 === 0 ? "needs-review" : "ok"],
        evidenceKind: i % 3 === 0 ? "supplier_invoice" : "other",
      });
    }
    const t1 = Date.now();
    const all = await v1.list();
    expect(all).toHaveLength(TARGET);
    expect(t1 - t0).toBeLessThan(120_000);
    await v1.close();
  }, 180_000);

  it("migrates a 10k-record vault from v1 to v2 with zero loss and full decrypt", async () => {
    const p = provider();
    const v1 = new Vault(p, new VaultDB(dbNameV1));
    await v1.open();
    await v1.unlock("migration-test-pass");
    const before = await v1.list();
    expect(before).toHaveLength(TARGET);
    const expectedSample: Array<{ id: string; text: string }> = [];
    for (let i = 0; i < 25; i += 1) {
      const sample = before[i * (TARGET / 25)]!;
      const { text } = await v1.getString(sample.id);
      expectedSample.push({ id: sample.id, text });
    }
    const exported = await v1.exportAll();
    await v1.close();

    const v2 = new Vault(p, new VaultDB(dbNameV2));
    await v2.open();
    await v2.initWithPassphrase("fresh-pass-2026");
    const n = await v2.importAll(exported, {
      sourcePassphrase: "migration-test-pass",
      destinationPassphrase: "destination-pass-2026",
    });
    expect(n).toBe(TARGET);

    await v2.lock();
    await v2.unlock("destination-pass-2026");
    const after = await v2.list();
    expect(after).toHaveLength(TARGET);
    for (const s of expectedSample) {
      const { text } = await v2.getString(s.id);
      expect(text).toBe(s.text);
    }
    const midIndex = Math.floor(TARGET / 2);
    const midSample = after[midIndex]!;
    const midRecord = await v2.get(midSample.id);
    const env = midRecord.record.ciphertext as EncryptionEnvelope;
    expect(env.v).toBe(VAULT_ENVELOPE_VERSION);
    const dek = (v2 as unknown as { dek: CryptoKey }).dek;
    const bytes = await decryptBytes(p, dek, env);
    expect(bytes.byteLength).toBe(midRecord.record.sizeBytes);
    await encryptBytes(p, dek, bytes);
    await v2.close();

    await indexedDB.deleteDatabase(dbNameV1);
    await indexedDB.deleteDatabase(dbNameV2);
  }, 180_000);
});
