import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: { rpc } }));
import { POST } from "../webhooks/paddle/route";
const event = {
  event_id: "evt_test123",
  event_type: "transaction.completed",
  occurred_at: "2026-09-18T00:00:00Z",
  data: { id: "txn_test" },
};
function request(body = JSON.stringify(event), age = 0, valid = true) {
  const ts = Math.floor(Date.now() / 1000) - age;
  const sig = createHmac("sha256", "test-secret").update(`${ts}:${body}`).digest("hex");
  return new Request("http://localhost/api/webhooks/paddle", {
    method: "POST",
    body,
    headers: { "paddle-signature": `ts=${ts};h1=${valid ? sig : "invalid"}` },
  });
}
beforeEach(() => {
  vi.stubEnv("PADDLE_WEBHOOK_SECRET", "test-secret");
  rpc.mockReset();
  rpc.mockResolvedValue({ error: null });
});
describe("Paddle webhook delivery", () => {
  it("acknowledges only after the database transaction succeeds", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_paddle_event",
      expect.objectContaining({ p_event: event }),
    );
  });
  it("returns a retryable failure for database errors", async () => {
    rpc.mockResolvedValue({ error: { message: "db down" } });
    expect((await POST(request())).status).toBe(503);
  });
  it("rejects stale and invalid signatures before database access", async () => {
    expect((await POST(request(undefined, 301))).status).toBe(401);
    expect((await POST(request(undefined, 0, false))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not acknowledge malformed signed payloads", async () => {
    expect((await POST(request("{}"))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
