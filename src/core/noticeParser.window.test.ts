import { describe, expect, it } from "vitest";
import { parseNotice } from "./noticeParser";

describe("statedWindowDays wording coverage", () => {
  const reads: Array<[string, number]> = [
    ["You must appeal within 30 days of this notice.", 30],
    ["If you appeal within 90 days, we will review it.", 90],
    ["You have 30 days from the date of this email to file an appeal.", 30],
    ["Your appeal must be submitted within 30 days of receiving this notice.", 30],
    ["You may appeal within 30 calendar days of this notice.", 30],
    ["You have thirty (30) days to submit an appeal.", 30],
    ["You may appeal within 30 days.", 30],
  ];
  for (const [text, days] of reads) {
    it(`reads ${days} from: ${text}`, () => {
      expect(parseNotice(text).statedWindowDays).toBe(days);
    });
  }

  const notTheSellers = [
    "Submit your appeal and we will review it within 5 days.",
    "Please submit an appeal, and your funds will be released within 14 days after approval.",
  ];
  for (const text of notTheSellers) {
    it(`does not read Amazon's own timeline: ${text}`, () => {
      expect(parseNotice(text).statedWindowDays).toBeNull();
    });
  }
});
