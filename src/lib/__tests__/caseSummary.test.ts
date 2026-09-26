import { describe, expect, it } from "vitest";
import { createCaseFile, type CaseFile } from "@/core/caseFile";
import { sellerDeadline } from "@/core/deadlinesModel";
import { newWorkspace } from "@/core/workspace";
import { dashboardHeadline, summarizeCase } from "@/lib/caseSummary";

const NOW = new Date(2026, 8, 26, 10, 0, 0); // Sat 26 Sep 2026, seller's local time

function caseWith(patch: (f: CaseFile) => CaseFile): CaseFile {
  return patch({ ...createCaseFile("INAUTHENTIC"), workspace: newWorkspace() });
}

function entry(f: CaseFile, archived = false) {
  return { id: f.id, kind: f.kind, createdAt: f.createdAt, archived };
}

describe("summarizeCase", () => {
  it("asks the seller to confirm the notice first", () => {
    const f = caseWith((c) => c);
    const s = summarizeCase(entry(f), f, NOW, f.id);
    expect(s.status).toBe("act");
    expect(s.next).toMatch(/check how we read your notice/);
    expect(s.current).toBe(true);
  });

  it("names the next record and counts the checklist", () => {
    const f = caseWith((c) => ({
      ...c,
      workspace: {
        ...c.workspace!,
        confirmed: true,
        requirements: [
          { id: "a", label: "Supplier invoice", sourceQuote: "", status: "reviewed", note: "x" },
          { id: "b", label: "Proof of delivery", sourceQuote: "", status: "needed", note: "" },
        ],
      },
    }));
    const s = summarizeCase(entry(f), f, NOW, null);
    expect(s.next).toBe("Next: Proof of delivery");
    expect([s.done, s.total]).toEqual([1, 2]);
    expect(s.current).toBe(false);
  });

  it("counts days only from a stated date, on the seller's calendar", () => {
    const f = caseWith((c) => ({ ...c, deadlines: [sellerDeadline("2026-09-28")] }));
    expect(summarizeCase(entry(f), f, NOW, null).due?.days).toBe(2);
  });

  it("describes a window with no start date without counting it down", () => {
    const f = caseWith((c) => ({
      ...c,
      deadlines: [
        {
          kind: "appeal_window",
          dueAt: null,
          label: "Appeal window: 90 days",
          startsOnReceipt: true,
        },
      ],
    }));
    const due = summarizeCase(entry(f), f, NOW, null).due;
    expect(due?.days).toBeUndefined();
    expect(due?.label).toMatch(/from the day you received/);
  });

  it("marks a sent case as waiting on Amazon", () => {
    const f = caseWith((c) => ({
      ...c,
      state: "SUBMITTED",
      workspace: {
        ...c.workspace!,
        confirmed: true,
        submissions: [
          {
            id: "s1",
            at: "2026-09-22T09:00:00.000Z",
            revision: 1,
            protocol: "operational",
            text: "t",
            receipt: "",
            attachments: [],
          },
        ],
      },
    }));
    const s = summarizeCase(entry(f), f, NOW, null);
    expect(s.status).toBe("waiting");
    expect(s.waitingAmazon).toBe(true);
    expect(s.next).toMatch(/^Sent 22 Sep 2026\./);
  });

  it("keeps an archived case closed whatever its state", () => {
    const f = caseWith((c) => c);
    expect(summarizeCase(entry(f, true), f, NOW, null).status).toBe("closed");
  });
});

describe("dashboardHeadline", () => {
  it("says there are no cases yet", () => {
    expect(dashboardHeadline([])).toEqual({ lead: "Start with", accent: "your notice." });
  });

  it("names the weekday of a date inside the coming week", () => {
    const f = caseWith((c) => ({ ...c, deadlines: [sellerDeadline("2026-09-28")] }));
    const h = dashboardHeadline([summarizeCase(entry(f), f, NOW, null)]);
    expect(`${h.lead} ${h.accent}`).toBe("One case needs you before Monday.");
  });

  it("never implies a date it was not given", () => {
    const f = caseWith((c) => c);
    const h = dashboardHeadline([summarizeCase(entry(f), f, NOW, null)]);
    expect(`${h.lead} ${h.accent}`).toBe("One case needs you.");
  });

  it("says nothing needs the seller while every case waits", () => {
    const f = caseWith((c) => ({
      ...c,
      state: "SUBMITTED",
      workspace: { ...c.workspace!, confirmed: true },
    }));
    const h = dashboardHeadline([summarizeCase(entry(f), f, NOW, null)]);
    expect(`${h.lead} ${h.accent}`).toBe("Nothing needs you today.");
  });
});
