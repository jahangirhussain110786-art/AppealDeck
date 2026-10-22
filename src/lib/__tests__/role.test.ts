import { describe, expect, it } from "vitest";
import { ROLES, ROLE_HOME, ROLE_KEY, parseRole, readRole, writeRole } from "../role";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

describe("role", () => {
  it("knows exactly three roles and a page for each", () => {
    expect([...ROLES]).toEqual(["seller", "pro", "partner"]);
    expect(ROLE_HOME).toEqual({
      seller: "/pricing",
      pro: "/for-professionals",
      partner: "/partners",
    });
  });

  it("accepts only a known role", () => {
    expect(parseRole("pro")).toBe("pro");
    for (const bad of ["admin", "", "PRO", null, undefined, 3]) expect(parseRole(bad)).toBeNull();
  });

  it("remembers, replaces and forgets a role", () => {
    const store = memoryStorage();
    expect(readRole(store)).toBeNull();
    writeRole("pro", store);
    expect(readRole(store)).toBe("pro");
    writeRole("seller", store);
    expect(readRole(store)).toBe("seller");
    writeRole(null, store);
    expect(store.getItem(ROLE_KEY)).toBeNull();
  });

  it("ignores a stored value that is not a role", () => {
    const store = memoryStorage();
    store.setItem(ROLE_KEY, "superuser");
    expect(readRole(store)).toBeNull();
  });

  it("survives storage that refuses access", () => {
    const throwing = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(readRole(throwing)).toBeNull();
    expect(() => writeRole("pro", throwing)).not.toThrow();
    expect(readRole(null)).toBeNull();
  });
});
