import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 27 Oct 2026 audit: ten claimed rows, each allowed 4 s for the Paddle amount and 5 s for the email,
 * outlast the function's 60 seconds. The run now has a budget; rows it never starts go back.
 */
const h = vi.hoisted(() => ({
  claimed: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ patch: Record<string, unknown>; filters: Record<string, unknown> }>,
  sent: [] as string[],
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    rpc: async () => ({ data: h.claimed, error: null }),
    from: () => {
      const filters: Record<string, unknown> = {};
      let patch: Record<string, unknown> = {};
      const api: Record<string, unknown> = {
        update(p: Record<string, unknown>) {
          patch = p;
          return api;
        },
        eq(k: string, v: unknown) {
          filters[k] = v;
          return api;
        },
        then(res: (v: unknown) => unknown) {
          h.updates.push({ patch, filters: { ...filters } });
          return Promise.resolve({ error: null }).then(res);
        },
      };
      return api;
    },
  },
}));
vi.mock("@/lib/email", () => ({
  sendPurchaseConfirmationEmail: vi.fn(async (a: { to: string }) => {
    h.sent.push(a.to);
  }),
}));
vi.mock("@/lib/paddleTransaction", () => ({ fetchPaidAmount: async () => null }));

import { deliverPurchaseEmails } from "../purchaseOutbox";

function claimedRow(n: number) {
  return {
    transaction_id: `txn_${n}`,
    email: `b${n}@example.com`,
    purchased_at: "2026-10-27T10:00:00Z",
    consent_text: "consent",
    kind: "appeal_pass",
    attempts: 1,
    lease_token: `tok_${n}`,
  };
}

beforeEach(() => {
  h.claimed = [1, 2, 3].map(claimedRow);
  h.updates = [];
  h.sent = [];
});

describe("deliverPurchaseEmails", () => {
  it("sends every claimed row and marks each sent against its own lease", async () => {
    expect(await deliverPurchaseEmails()).toEqual({ sent: 3, failed: 0, unreached: 0 });
    expect(h.sent.sort()).toEqual(["b1@example.com", "b2@example.com", "b3@example.com"]);
    expect(h.updates.every((u) => typeof u.patch.sent_at === "string")).toBe(true);
    expect(h.updates.map((u) => u.filters.lease_token).sort()).toEqual(["tok_1", "tok_2", "tok_3"]);
  });

  it("starts nothing once the budget is spent, and gives the unstarted rows their lease and attempt back", async () => {
    const r = await deliverPurchaseEmails(undefined, { budgetMs: -1 });
    expect(r).toEqual({ sent: 0, failed: 0, unreached: 3 });
    expect(h.sent).toEqual([]);
    expect(h.updates).toHaveLength(3);
    for (const u of h.updates) {
      expect(u.patch).toEqual({ lease_until: null, attempts: 0 });
    }
  });
});
