import { describe, expect, it } from "vitest";
import { determineResponseType } from "./responseType";
import { newWorkspace, routeWorkspace } from "./workspace";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";

/**
 * 25 Sep 2026: /decode told a seller "Plan of Action" and the case it opened said "Clarification
 * needed", because the workspace refused to decide while the response-page field was empty. The
 * two must give the same answer for the same notice.
 */
describe("the case route matches what /decode said", () => {
  it("decides from the notice alone when the response page has not been added", () => {
    expect(determineResponseType(SAMPLE_NOTICE_TEXT, "").type).toBe("PLAN_OF_ACTION");
    const route = routeWorkspace({ ...newWorkspace(), notice: SAMPLE_NOTICE_TEXT });
    expect(route.protocol).toBe("operational");
    expect(route.protocol).not.toBe("clarification");
    expect(route.reason).toMatch(/from your notice alone/);
  });

  it("still asks for the notice when there is none", () => {
    expect(routeWorkspace({ ...newWorkspace(), notice: "hi" }).protocol).toBe("clarification");
  });
});
