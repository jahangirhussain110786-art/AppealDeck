import { describe, expect, it } from "vitest";
import { fileStateAfterLog } from "@/lib/caseStore";

const sent = { workspace: { submissions: [{ source: "sent" }] } };
const none = { workspace: { submissions: [] } };

describe("fileStateAfterLog", () => {
  it("settles the file when an outcome is recorded", () => {
    const log = { attemptCount: 1, resolution: { status: "reinstated" as const, at: "x" } };
    expect(fileStateAfterLog({ state: "SUBMITTED", ...sent }, log)).toBe("APPROVED");
    const closed = { attemptCount: 1, resolution: { status: "rejected" as const, at: "x" } };
    expect(fileStateAfterLog({ state: "SUBMITTED", ...sent }, closed)).toBe("CLOSED");
    const withdrawn = { attemptCount: 1, resolution: { status: "withdrawn" as const, at: "x" } };
    expect(fileStateAfterLog({ state: "INTAKE", ...none }, withdrawn)).toBe("CLOSED");
  });

  it("changes nothing when the file already holds the state", () => {
    const log = { attemptCount: 1, resolution: { status: "reinstated" as const, at: "x" } };
    expect(fileStateAfterLog({ state: "APPROVED", ...sent }, log)).toBeNull();
  });

  it("moves a settled file back out when the outcome is cleared", () => {
    expect(fileStateAfterLog({ state: "CLOSED", ...sent }, { attemptCount: 0 })).toBe("SUBMITTED");
    expect(fileStateAfterLog({ state: "APPROVED", ...none }, { attemptCount: 0 })).toBe("INTAKE");
  });

  it("leaves every other state to the workspace", () => {
    expect(fileStateAfterLog({ state: "SUBMITTED", ...sent }, { attemptCount: 1 })).toBeNull();
    expect(fileStateAfterLog({ state: "INTAKE", ...none }, { attemptCount: 0 })).toBeNull();
  });
});
