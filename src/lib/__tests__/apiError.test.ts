import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "../apiError";

describe("apiErrorMessage", () => {
  it("uses the server's own message when it sent one", () => {
    expect(apiErrorMessage(422, { error: "Confirm a supported route first." }, "x")).toBe(
      "Confirm a supported route first.",
    );
    expect(apiErrorMessage(503, { error: "Service temporarily unavailable" }, "x")).toBe(
      "Service temporarily unavailable",
    );
  });

  it("blames the service, not the seller, for an error page or a rate limit with no JSON", () => {
    for (const status of [429, 500, 502, 504])
      expect(apiErrorMessage(status, null, "fallback")).toMatch(/not available right now/);
  });

  it("falls back for a client error with no usable message", () => {
    expect(apiErrorMessage(400, null, "Could not prepare the response. Try again.")).toBe(
      "Could not prepare the response. Try again.",
    );
    expect(apiErrorMessage(400, { error: "  " }, "fallback")).toBe("fallback");
    expect(apiErrorMessage(400, { error: 42 }, "fallback")).toBe("fallback");
  });
});
