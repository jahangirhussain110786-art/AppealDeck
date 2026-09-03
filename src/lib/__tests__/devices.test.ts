import { describe, it, expect, beforeEach } from "vitest";
import {
  DEVICE_CAP,
  fingerprintFromRequest,
  listDevices,
  recordActivation,
  revokeDevice,
  type LicenseDevice,
} from "@/lib/devices";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, any>;

class MemDb {
  licenses: Row[] = [];
  devices: Row[] = [];

  client(): SupabaseClient {
    return new FakeSupabase(this) as unknown as SupabaseClient;
  }
}

class FakeSupabase {
  constructor(private db: MemDb) {}
  from(table: "licenses" | "license_devices") {
    if (table === "licenses") return new LicensesQB(this.db);
    return new DevicesQB(this.db);
  }
}

type Chain = Record<string, any> & {
  then: <T>(onFulfilled: (v: any) => T) => Promise<T>;
};

class LicensesQB {
  constructor(private db: MemDb) {}
  select(_cols: string) {
    return this;
  }
  eq(field: string, value: any): Chain {
    const db = this.db;
    return makeChain({
      eq(f: string, v: any) {
        return new LicensesQB(db).eq(f, v);
      },
      maybeSingle: async () => {
        const hit = db.licenses.find((r) => r[field] === value);
        return { data: hit ? { ...hit } : null, error: null };
      },
    });
  }
}

class DevicesQB {
  constructor(private db: MemDb) {}
  select(_cols?: string) {
    return this;
  }
  insert(row: Row): Chain {
    const db = this.db;
    const newRow = {
      id: row.id ?? uuidFor(db.devices.length + 1),
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      revoked_at: null,
      ...row,
    };
    db.devices.push(newRow);
    return makeChain({
      select: () => ({
        single: async () => ({ data: { ...newRow }, error: null }),
      }),
    });
  }
  update(patch: Row): Chain {
    const db = this.db;
    let pending: Array<[string, any]> = [];
    const apply = () => {
      for (const r of db.devices) {
        if (matchesAll(r, pending)) Object.assign(r, patch);
      }
      pending = [];
    };
    const api: any = {
      eq(f: string, v: any) {
        pending.push([f, v]);
        return api;
      },
      then(onFulfilled: any) {
        apply();
        return Promise.resolve({ data: null, error: null }).then(onFulfilled);
      },
    };
    return api as Chain;
  }
  eq(field: string, value: any): Chain {
    const db = this.db;
    let filters: Array<[string, any]> = [[field, value]];
    const api: any = {
      eq(f: string, v: any) {
        filters.push([f, v]);
        return api;
      },
      is(f: string, v: any) {
        filters.push([f, v]);
        return api;
      },
      order() {
        return api;
      },
      maybeSingle: async () => {
        const hit = db.devices.find((r) => matchesAll(r, filters));
        return { data: hit ? { ...hit } : null, error: null };
      },
      single: async () => {
        const hit = db.devices.find((r) => matchesAll(r, filters));
        return { data: hit ? { ...hit } : null, error: null };
      },
      then(onFulfilled: any) {
        const active = db.devices.filter((r) => matchesAll(r, filters) && r.revoked_at == null);
        return Promise.resolve({ count: active.length, data: active, error: null }).then(
          onFulfilled,
        );
      },
    };
    return api as Chain;
  }
  count() {
    return this;
  }
}

function matchesAll(row: Row, filters: Array<[string, any]>): boolean {
  for (const [f, v] of filters) {
    if (f === "revoked_at" && v === null) {
      if (row.revoked_at != null) return false;
    } else if (row[f] !== v) {
      return false;
    }
  }
  return true;
}

function makeChain(overrides: Record<string, any>): Chain {
  const c: any = { ...overrides };
  c.then = (onFulfilled: any) => Promise.resolve({ data: null, error: null }).then(onFulfilled);
  return c as Chain;
}

function uuidFor(n: number): string {
  const pad = (x: number, len: number) => x.toString(16).padStart(len, "0");
  const a = pad(n, 8);
  const b = pad(n * 7, 4);
  const c = pad(n * 13, 4);
  const d = pad(n * 19, 4);
  const e = pad(n * 31, 12);
  return `${a}-${b}-${c}-${d}-${e}`;
}

const LICENSE = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "user@example.com",
  status: "active",
  plan: "appeal_pass",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0";

async function fingerprintFor(idx: number): Promise<string> {
  return fingerprintFromRequest({
    userAgent: `${UA} idx=${idx}`,
    ip: "10.0.0.1",
    acceptLanguage: "en-US,en;q=0.9",
    userId: "user-uuid",
    email: "user@example.com",
  });
}

describe("devices", () => {
  let db: MemDb;
  beforeEach(() => {
    db = new MemDb();
    db.licenses.push({ ...LICENSE });
  });

  it("DEVICE_CAP is the documented 5", () => {
    expect(DEVICE_CAP).toBe(5);
  });

  it("fingerprintFromRequest is stable for identical inputs", async () => {
    const a = await fingerprintFromRequest({
      userAgent: UA,
      ip: "1.1.1.1",
      acceptLanguage: "en",
      userId: "u",
    });
    const b = await fingerprintFromRequest({
      userAgent: UA,
      ip: "1.1.1.1",
      acceptLanguage: "en",
      userId: "u",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("fingerprintFromRequest differs when any input changes", async () => {
    const base = await fingerprintFromRequest({
      userAgent: UA,
      ip: "1.1.1.1",
      acceptLanguage: "en",
      userId: "u",
    });
    const diff = await fingerprintFromRequest({
      userAgent: UA,
      ip: "2.2.2.2",
      acceptLanguage: "en",
      userId: "u",
    });
    expect(base).not.toBe(diff);
  });

  it("fingerprintFromRequest does not require an email field", async () => {
    const fp = await fingerprintFromRequest({
      userAgent: UA,
      ip: "1.1.1.1",
      acceptLanguage: "en",
      userId: "u",
    });
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it("first activation for a new device inserts a row", async () => {
    const r = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: await fingerprintFor(1),
      userAgent: UA,
    });
    expect(r.status).toBe("ok");
    expect(r.device).toBeTruthy();
    expect(r.activeCount).toBe(1);
    expect(db.devices).toHaveLength(1);
  });

  it("re-activation of the same device updates last_seen, no dup", async () => {
    const fp = await fingerprintFor(1);
    const r1 = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: fp,
      userAgent: UA,
    });
    const r2 = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: fp,
      userAgent: UA,
    });
    expect(r1.status).toBe("ok");
    expect(r2.status).toBe("ok");
    expect(db.devices).toHaveLength(1);
  });

  it("5th device is the last accepted; 6th is over_cap with a list", async () => {
    for (let i = 1; i <= 5; i++) {
      const r = await recordActivation(db.client(), {
        userId: "user-uuid",
        email: "user@example.com",
        fingerprint: await fingerprintFor(i),
        userAgent: UA,
      });
      expect(r.status).toBe("ok");
    }
    expect(db.devices).toHaveLength(5);
    const over = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: await fingerprintFor(6),
      userAgent: UA,
    });
    expect(over.status).toBe("over_cap");
    expect(over.activeCount).toBe(5);
    expect(over.cap).toBe(5);
    expect(over.overCapDevices).toHaveLength(5);
  });

  it("revoke frees a slot; new device activates", async () => {
    for (let i = 1; i <= 5; i++) {
      await recordActivation(db.client(), {
        userId: "user-uuid",
        email: "user@example.com",
        fingerprint: await fingerprintFor(i),
        userAgent: UA,
      });
    }
    const firstId = db.devices[0].id;
    const rev = await revokeDevice(db.client(), "user@example.com", firstId);
    expect(rev.ok).toBe(true);

    const fresh = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: await fingerprintFor(7),
      userAgent: UA,
    });
    expect(fresh.status).toBe("ok");
    expect(fresh.activeCount).toBe(5);
  });

  it("revoke rejects non-uuid deviceId", async () => {
    const r = await revokeDevice(db.client(), "user@example.com", "not-a-uuid");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("invalid_id");
  });

  it("revoke rejects deviceId owned by another license", async () => {
    await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: await fingerprintFor(1),
      userAgent: UA,
    });
    const otherDeviceId = db.devices[0].id;
    const other = {
      id: "22222222-2222-2222-2222-222222222222",
      email: "other@example.com",
      status: "active",
      plan: "appeal_pass",
    };
    db.licenses.push({ ...other });
    db.devices[0].license_id = other.id;
    const r = await revokeDevice(db.client(), "user@example.com", otherDeviceId);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("not_owner");
  });

  it("revoke returns not_found for missing device", async () => {
    const r = await revokeDevice(
      db.client(),
      "user@example.com",
      "99999999-9999-9999-9999-999999999999",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("not_found");
  });

  it("revoke returns no_license when email has no active license", async () => {
    db.licenses = [];
    const r = await revokeDevice(
      db.client(),
      "ghost@example.com",
      "99999999-9999-9999-9999-999999999999",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("no_license");
  });

  it("listDevices returns active devices newest first", async () => {
    for (let i = 1; i <= 3; i++) {
      await recordActivation(db.client(), {
        userId: "user-uuid",
        email: "user@example.com",
        fingerprint: await fingerprintFor(i),
        userAgent: UA,
      });
    }
    const list = await listDevices(db.client(), "user@example.com");
    expect(list).toHaveLength(3);
    expect(list.every((d: LicenseDevice) => d.revoked_at == null)).toBe(true);
  });

  it("recordActivation on a non-active license is a no-op", async () => {
    db.licenses[0].status = "canceled";
    const r = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: await fingerprintFor(1),
      userAgent: UA,
    });
    expect(r.status).toBe("ok");
    expect(r.device).toBe(null);
    expect(db.devices).toHaveLength(0);
  });

  it("re-activation of a previously revoked device un-revokes it", async () => {
    const fp = await fingerprintFor(1);
    const r1 = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: fp,
      userAgent: UA,
    });
    expect(r1.status).toBe("ok");
    const deviceId = db.devices[0].id;
    const rev = await revokeDevice(db.client(), "user@example.com", deviceId);
    expect(rev.ok).toBe(true);
    expect(db.devices[0].revoked_at).not.toBeNull();

    const r2 = await recordActivation(db.client(), {
      userId: "user-uuid",
      email: "user@example.com",
      fingerprint: fp,
      userAgent: UA,
    });
    expect(r2.status).toBe("ok");
    expect(r2.device).toBeTruthy();
    expect(r2.device?.revoked_at).toBeNull();
    expect(r2.activeCount).toBe(1);
  });
});
