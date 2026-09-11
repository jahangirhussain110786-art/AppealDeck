import type { Vault } from "@/core/vault/vault";

const GUEST_SESSION_KEY = "appealdeck-guest-session-active";

/**
 * Enforces the guest continuity boundary decided 11 Sep 2026: a signed-out
 * visitor's case draft lives only for the current browser session. Closing
 * every tab/window clears `sessionStorage`, so the next time this function
 * runs in a *new* tab it finds no flag, treats it as a new session, and wipes
 * any leftover guest vault data before the visitor's fresh draft is created.
 * Reloading or navigating between pages in the same tab keeps the flag set,
 * so in-progress work is never lost mid-session.
 *
 * No-op for signed-in users — their vault persists normally across sessions.
 */
export async function ensureFreshGuestSession(vault: Vault, signedIn: boolean): Promise<void> {
  if (signedIn) return;
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(GUEST_SESSION_KEY)) return;
    window.sessionStorage.setItem(GUEST_SESSION_KEY, "1");
    await vault.open();
    const initialized = await vault.isInitialized();
    if (initialized) {
      await vault.purge();
    }
  } catch {
    // Best-effort hygiene only — sessionStorage or IndexedDB being unavailable
    // (private browsing, storage disabled) must never block the app from loading.
  }
}
