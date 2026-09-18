import type { Vault } from "@/core/vault/vault";
/** Guest lifetime uses a tab-session database name, never a purge of a shared store. */
export async function ensureFreshGuestSession(vault: Vault, _signedIn: boolean): Promise<void> {
  await vault.open();
}
