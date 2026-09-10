import type { Vault, VaultStatus } from "@/core/vault/vault";

/**
 * Opens (or silently creates) a device-mode vault for a signed-out visitor.
 * Returns true when the vault ends up unlocked in device mode, false when it
 * is in passphrase mode (or anything else) and needs the usual unlock gate.
 */
export async function openVaultForVisitor(vault: Vault): Promise<boolean> {
  await vault.open();
  const initialized = await vault.isInitialized();
  if (!initialized) {
    await vault.initWithDeviceKey();
    return true;
  }
  const status: VaultStatus = await vault.status();
  if (status.state === "unlocked") return true;
  if (status.state === "locked" && status.mode === "device") {
    await vault.unlockWithDeviceKey();
    return true;
  }
  return false;
}
