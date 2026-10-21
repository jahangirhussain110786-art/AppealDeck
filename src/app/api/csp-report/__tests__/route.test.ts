import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost/api/csp-report", { method: "POST", body, headers }));

describe("/api/csp-report", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs one line and strips line breaks so a report cannot forge log lines", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await post(
      JSON.stringify({
        "csp-report": {
          "effective-directive": "script-src",
          "blocked-uri": "https://x.test/\n[csp] FAKE blocked line\r\n",
        },
      }),
    );
    expect(res.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).not.toMatch(/[\r\n]/);
  });

  it("refuses a body that declares more than 10 kB without reading it", async () => {
    const res = await post("{}", { "content-length": "20000" });
    expect(res.status).toBe(413);
  });

  it("treats a null or non-object report as harmless", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await post("null")).status).toBe(204);
    expect((await post(JSON.stringify({ "csp-report": "x" }))).status).toBe(204);
  });
});
