import { describe, expect, it } from "vitest";
import { newWorkspace, workspaceAwaitsConfirmation, workspaceCanCompose } from "./workspace";

const POLICY_NOTICE =
  "We removed the listing because customers complained about item condition (Used Sold as New). Submit a plan of action. You may appeal within 30 days.";

describe("a notice that can be answered but has not been confirmed yet", () => {
  it("awaits confirmation, and cannot yet compose", () => {
    const w = { ...newWorkspace(), notice: POLICY_NOTICE };
    expect(workspaceAwaitsConfirmation(w)).toBe(true);
    expect(workspaceCanCompose(w)).toBe(false);
  });

  it("stops awaiting once it is confirmed", () => {
    const w = { ...newWorkspace(), notice: POLICY_NOTICE, confirmed: true };
    expect(workspaceAwaitsConfirmation(w)).toBe(false);
  });

  it("does not ask for confirmation of a notice that cannot be answered here", () => {
    // A falsified-documents allegation routes to a specialist (D6): confirming it would change nothing.
    const w = {
      ...newWorkspace(),
      notice:
        "Your account is deactivated because the invoices you supplied were falsified. Contact Seller Support.",
    };
    expect(workspaceAwaitsConfirmation(w)).toBe(false);
  });

  it("does not ask for confirmation when there is no notice yet", () => {
    expect(workspaceAwaitsConfirmation(newWorkspace())).toBe(false);
  });
});
