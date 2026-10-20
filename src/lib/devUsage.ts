import { AsyncLocalStorage } from "node:async_hooks";
import type { AppUser } from "@/lib/auth";

const usage = new AsyncLocalStorage<boolean>();

export function devUsageEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_UNLIMITED_USAGE === "true";
}

export function isUnlimitedDevUser(user: AppUser | null): boolean {
  const email = process.env.DEV_LOGIN_EMAIL?.trim().toLowerCase();
  return Boolean(devUsageEnabled() && email && user?.id && user.email?.toLowerCase() === email);
}

export function hasUnlimitedDevUsage(): boolean {
  return devUsageEnabled() && usage.getStore() === true;
}

export function runWithDevUsage<T>(user: AppUser | null, work: () => T): T {
  return usage.run(isUnlimitedDevUser(user), work);
}

export function withDevUsage<T extends unknown[], R>(handler: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    if (!devUsageEnabled()) return handler(...args);
    const { getApiUser } = await import("@/lib/auth");
    return runWithDevUsage(await getApiUser(), () => handler(...args));
  };
}
