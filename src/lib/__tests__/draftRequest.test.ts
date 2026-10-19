import { describe, expect, it } from "vitest";
import type { Workspace } from "@/core/workspace";
import { requestedFor } from "../draftRequest";

const w = (requirements: Array<Record<string, unknown>>) =>
  ({ requirements }) as unknown as Workspace;

describe("requestedFor (the AI's 'Amazon asked for' list)", () => {
  it("leaves out a record we inferred that the seller has not acted on", () => {
    const out = requestedFor(
      w([
        { label: "Sales or performance record", source: "matrix", status: "needed" },
        { label: "Supplier invoice", source: "notice", status: "needed" },
      ]),
    );
    expect(out).toEqual([{ label: "Supplier invoice", status: "needed" }]);
  });

  it("keeps an inferred record once the seller has acted on it", () => {
    const out = requestedFor(
      w([
        { label: "Sales or performance record", source: "matrix", status: "waiting" },
        { label: "Authorization letter", source: "matrix", status: "cannot_obtain" },
      ]),
    );
    expect(out.map((r) => r.status)).toEqual(["waiting", "cannot_obtain"]);
  });
});
