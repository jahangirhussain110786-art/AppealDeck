import { describe, it, expect, afterEach, vi } from "vitest";
import { ensureStoragePersistence, storagePersistenceState } from "./persistence";

const original = Object.getOwnPropertyDescriptor(globalThis.navigator, "storage");

function setStorage(value: unknown) {
  Object.defineProperty(globalThis.navigator, "storage", {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (original) Object.defineProperty(globalThis.navigator, "storage", original);
  else setStorage(undefined);
  vi.restoreAllMocks();
});

describe("storagePersistenceState", () => {
  it("reports unsupported when the API is absent", async () => {
    setStorage(undefined);
    expect(await storagePersistenceState()).toBe("unsupported");
  });

  it("reports unsupported when persisted() throws rather than assuming safety", async () => {
    setStorage({
      persisted: () => {
        throw new Error("denied");
      },
      persist: async () => true,
    });
    expect(await storagePersistenceState()).toBe("unsupported");
  });

  it("reports the current state without prompting", async () => {
    const persist = vi.fn(async () => true);
    setStorage({ persisted: async () => false, persist });
    expect(await storagePersistenceState()).toBe("not-persisted");
    expect(persist).not.toHaveBeenCalled();
  });
});

describe("ensureStoragePersistence", () => {
  it("does not re-request when already persisted", async () => {
    const persist = vi.fn(async () => true);
    setStorage({ persisted: async () => true, persist });
    expect(await ensureStoragePersistence()).toBe("persisted");
    expect(persist).not.toHaveBeenCalled();
  });

  it("requests persistence when the origin is not yet persistent", async () => {
    const persist = vi.fn(async () => true);
    setStorage({ persisted: async () => false, persist });
    expect(await ensureStoragePersistence()).toBe("persisted");
    expect(persist).toHaveBeenCalledOnce();
  });

  it("treats a refusal as a normal outcome", async () => {
    setStorage({ persisted: async () => false, persist: async () => false });
    expect(await ensureStoragePersistence()).toBe("not-persisted");
  });

  it("treats a rejected request as not persisted", async () => {
    setStorage({
      persisted: async () => false,
      persist: async () => {
        throw new Error("blocked");
      },
    });
    expect(await ensureStoragePersistence()).toBe("not-persisted");
  });

  it("reports unsupported when the API is missing persist()", async () => {
    setStorage({ persisted: async () => false });
    expect(await ensureStoragePersistence()).toBe("unsupported");
  });
});
