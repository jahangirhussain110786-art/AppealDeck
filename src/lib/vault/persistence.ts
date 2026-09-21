"use client";

/**
 * Browser storage persistence.
 *
 * The vault is IndexedDB. Browsers evict IndexedDB for origins that are not
 * marked persistent: Safari clears script-writable storage after seven days
 * without interaction, and other engines evict under storage pressure. A case
 * that is waiting on Amazon routinely sits untouched for longer than that, and
 * there is no server copy by design — so eviction destroys the seller's case
 * file. `navigator.storage.persist()` exempts the origin from that eviction.
 *
 * Every call is defensive: the API is absent in some contexts and can reject.
 * An unknown state is reported honestly rather than assumed safe.
 */

export type StoragePersistence = "persisted" | "not-persisted" | "unsupported";

function storageManager(): StorageManager | null {
  try {
    if (typeof navigator === "undefined") return null;
    const storage = navigator.storage;
    if (
      !storage ||
      typeof storage.persist !== "function" ||
      typeof storage.persisted !== "function"
    )
      return null;
    return storage;
  } catch {
    return null;
  }
}

/** Current state, without prompting. */
export async function storagePersistenceState(): Promise<StoragePersistence> {
  const storage = storageManager();
  if (!storage) return "unsupported";
  try {
    return (await storage.persisted()) ? "persisted" : "not-persisted";
  } catch {
    return "unsupported";
  }
}

/**
 * Ask the browser to exempt this origin from eviction, unless it already has.
 * Chrome decides from engagement heuristics without prompting; Firefox may
 * prompt. A refusal is a normal outcome, not an error.
 */
export async function ensureStoragePersistence(): Promise<StoragePersistence> {
  const storage = storageManager();
  if (!storage) return "unsupported";
  try {
    if (await storage.persisted()) return "persisted";
  } catch {
    return "unsupported";
  }
  try {
    return (await storage.persist()) ? "persisted" : "not-persisted";
  } catch {
    return "not-persisted";
  }
}
