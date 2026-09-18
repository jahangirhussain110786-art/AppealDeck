import { describe, expect, it } from "vitest";
import { parseNotice } from "./noticeParser";
describe("appeal deadline context", () => {
  it.each([
    "Your funds are held for 90 days. You may appeal in Account Health.",
    "Submit an appeal with invoices issued in the last 365 days.",
    "You have exactly 17 days. Check your account for details.",
    "Submit your appeal within 7 days. You have 14 days to appeal.",
  ])("does not invent an appeal deadline: %s", (text) =>
    expect(parseNotice(text).statedWindowDays).toBeNull(),
  );
  it("extracts the appeal window despite an earlier funds period", () => {
    expect(
      parseNotice("Funds are held for 90 days. Submit your appeal within 7 days.").statedWindowDays,
    ).toBe(7);
  });
  it("retains the explicit legacy POA clause", () => {
    expect(
      parseNotice("You have 17 days from the date of this notice to submit a Plan of Action.")
        .statedWindowDays,
    ).toBe(17);
  });
});
