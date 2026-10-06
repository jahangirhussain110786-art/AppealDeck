import { describe, expect, it } from "vitest";
import { classifyStage1 } from "./classifier";
import { parseNotice } from "./noticeParser";
import { newWorkspace, routeWorkspace } from "./workspace";

describe("a notice the classifier calls VERIFICATION is routed as verification", () => {
  it.each([
    "Your account requires video verification. Please upload your business registration document and a utility bill.",
    "We need to verify your business information under the INFORM Act. Please provide a bank statement and proof of address.",
    "Please complete business verification by uploading your trade licence.",
  ])("%s", (notice) => {
    expect(classifyStage1(parseNotice(notice)).kind).toBe("VERIFICATION");
    expect(routeWorkspace({ ...newWorkspace(), notice }).protocol).toBe("verification");
  });
});
