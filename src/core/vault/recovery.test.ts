import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { Vault } from "./vault";
import { VaultDB } from "./db";
const dbs: VaultDB[] = [];
function vault() {
  const db = new VaultDB(`recovery-test-${crypto.randomUUID()}`);
  dbs.push(db);
  return new Vault(webcrypto as unknown as Crypto, db);
}
afterEach(async () => {
  for (const db of dbs.splice(0)) {
    db.close();
    await db.delete();
  }
});
describe("portable vault recovery", () => {
  it("restores a serialized device-mode backup on another device without changing the source key mode", async () => {
    const source = vault(),
      target = vault();
    await source.open();
    await source.initWithDeviceKey();
    const record = await source.addString({
      name: "proof",
      mimeType: "text/plain",
      data: "my evidence",
    });
    const backup = JSON.parse(JSON.stringify(await source.exportPortable("backup password")));
    expect(backup.meta.deviceKey).toBeUndefined();
    await target.open();
    await target.importAll(backup, {
      sourcePassphrase: "backup password",
      destinationPassphrase: "restored password",
    });
    expect((await target.getString(record.id)).text).toBe("my evidence");
    expect((await source.rawMeta())?.mode.kind).toBe("device");
  });
  it("rejects restore into a populated destination and preserves its key and records", async () => {
    const source = vault(),
      target = vault();
    await source.open();
    await source.initWithDeviceKey();
    const backup = await source.exportPortable("backup password");
    await target.open();
    await target.initWithDeviceKey();
    const record = await target.addString({
      name: "existing",
      mimeType: "text/plain",
      data: "keep me",
    });
    await expect(
      target.importAll(backup, {
        sourcePassphrase: "backup password",
        destinationPassphrase: "new password",
      }),
    ).rejects.toThrow("empty vault");
    expect((await target.getString(record.id)).text).toBe("keep me");
  });
  it("rolls back a failed atomic replacement", async () => {
    const v = vault();
    await v.open();
    await v.initWithDeviceKey();
    const record = await v.addString({ name: "existing", mimeType: "text/plain", data: "keep me" });
    await expect(
      v.atomic(async () => {
        await v.delete(record.id);
        throw new Error("write failed");
      }),
    ).rejects.toThrow("write failed");
    expect((await v.getString(record.id)).text).toBe("keep me");
  });
});
