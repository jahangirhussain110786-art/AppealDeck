import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { redisCredentials } from "@/lib/redisEnv";
import type { DraftSections } from "@/core/draftVerification";
import type { DraftRequest } from "@/lib/llm/draftResponse";

/**
 * A short-lived memory of the AI draft for exactly the same material.
 *
 * Without it, pressing Prepare twice with nothing changed gave two different wordings and spent two
 * model calls against a daily spend cap shared by every seller. With it, the same answers, notice
 * and records give the same draft, and the model is asked once. The key is a hash of everything the
 * model is shown plus the seller's id, so a draft is never served to anyone else and any change at
 * all (a word in an answer, a record reviewed) is a different key. Whatever comes back from the
 * cache is checked again by the caller before use, so a stored draft is never trusted blindly.
 * Without Redis configured this does nothing and every request goes to the model.
 */
const TTL_SECONDS = 24 * 60 * 60;

export function draftCacheKey(userId: string, request: DraftRequest): string {
  const hash = createHash("sha256").update(JSON.stringify(request)).digest("hex").slice(0, 40);
  return `draft:v1:${userId}:${hash}`;
}

function client(): Redis | null {
  const credentials = redisCredentials();
  return credentials ? new Redis(credentials) : null;
}

export async function getCachedDraft(key: string): Promise<DraftSections | null> {
  const redis = client();
  if (!redis) return null;
  try {
    const value = await redis.get<DraftSections>(key);
    if (
      value &&
      typeof value.rootCause === "string" &&
      typeof value.correctiveActions === "string" &&
      typeof value.preventiveMeasures === "string"
    )
      return value;
  } catch {
    // A cache that cannot be read is the same as a cache with nothing in it.
  }
  return null;
}

export async function setCachedDraft(key: string, sections: DraftSections): Promise<void> {
  const redis = client();
  if (!redis) return;
  try {
    await redis.set(key, sections, { ex: TTL_SECONDS });
  } catch {
    // Failing to remember a draft costs one extra model call next time, nothing more.
  }
}
