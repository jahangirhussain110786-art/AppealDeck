import { describe, expect, it, vi } from "vitest";
import { POST } from "../csp-report/route";

const post = (body: string) =>
  POST(new Request("http://x/api/csp-report", { method: "POST", body }));

describe("/api/csp-report", () => {
  it("accepts a report and logs only the directive and blocked address", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await post(
      JSON.stringify({
        "csp-report": {
          "effective-directive": "script-src",
          "blocked-uri": "https://evil.example/x.js",
          "document-uri": "https://appealdeck.com/case?secret=1",
          "script-sample": "private page text",
        },
      }),
    );
    expect(res.status).toBe(204);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toContain("script-src");
    expect(line).toContain("evil.example");
    expect(line).not.toContain("secret");
    expect(line).not.toContain("private page text");
    warn.mockRestore();
  });

  it("answers 204 to garbage and 413 to an oversized body", async () => {
    expect((await post("not json")).status).toBe(204);
    expect((await post("x".repeat(10_001))).status).toBe(413);
  });
});
