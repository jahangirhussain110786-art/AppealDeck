import { describe, it, expect } from "vitest";
import { logWithOutcome } from "@/components/workspace/CaseOutcome";
import type { CaseLog } from "@/lib/caseStore";

/**
 * P, 23 Sep 2026. Choosing "Still waiting on Amazon" after recording an outcome did nothing. The
 * handler built a log without `resolution` and merged it back over the original with
 * `{ ...current, ...rest }`; `rest` merely lacked the key, so the spread left the old value in
 * place. A seller who recorded "rejected" by mistake — easy to do from a dropdown — could never
 * take it back, and their own record of the case kept stating something that had not happened.
 */
const AT = "2026-09-23T10:00:00.000Z";
const base: CaseLog = { state: "SUBMITTED", attemptCount: 1 };

describe("logWithOutcome", () => {
  it("clears a recorded outcome when the seller goes back to waiting", () => {
    const recorded: CaseLog = { ...base, resolution: { status: "rejected", at: AT } };
    const next = logWithOutcome(recorded, "pending", AT);
    expect(next).not.toBeNull();
    // Absent, not merely undefined — the stored log must not carry the key at all.
    expect(next).not.toHaveProperty("resolution");
  });

  it("keeps everything else in the log when it clears the outcome", () => {
    const recorded: CaseLog = {
      ...base,
      reminderAt: "2026-10-01T00:00:00.000Z",
      resolution: { status: "withdrawn", at: AT },
    };
    const next = logWithOutcome(recorded, "pending", AT)!;
    expect(next.reminderAt).toBe("2026-10-01T00:00:00.000Z");
    expect(next.attemptCount).toBe(1);
    expect(next.state).toBe("SUBMITTED");
  });

  it("records a chosen outcome with the time it was chosen", () => {
    const next = logWithOutcome(base, "reinstated", AT)!;
    expect(next.resolution).toEqual({ status: "reinstated", at: AT });
  });

  it("replaces one recorded outcome with another", () => {
    const recorded: CaseLog = { ...base, resolution: { status: "rejected", at: AT } };
    expect(logWithOutcome(recorded, "reinstated", AT)!.resolution?.status).toBe("reinstated");
  });

  it("writes nothing when the choice is what is already recorded", () => {
    expect(logWithOutcome(base, "pending", AT)).toBeNull();
    const recorded: CaseLog = { ...base, resolution: { status: "rejected", at: AT } };
    expect(logWithOutcome(recorded, "rejected", AT)).toBeNull();
  });
});
