import { describe, expect, it } from "vitest";
import { changeReport } from "./changeReport";
import type { Requirement, Workspace } from "./workspace";

type Sub = Workspace["submissions"][number];

const RESPONSE = [
  "## Root Cause",
  "We listed returned items as new because returns went back on sale unchecked.",
  "## Corrective Actions",
  "On 20 Sep 2026 we removed all 12 affected listings.",
].join("\n");

const sub = (over: Partial<Sub> = {}): Sub => ({
  id: "s1",
  at: "2026-10-01T09:00:00.000Z",
  revision: 1,
  protocol: "operational",
  text: RESPONSE,
  receipt: "",
  attachments: [],
  ...over,
});

const req = (over: Partial<Requirement> = {}): Requirement =>
  ({
    id: "r1",
    label: "Supplier invoice",
    status: "reviewed",
    recordId: "rec1",
    filename: "invoice-a.pdf",
    contentHash: "hash-a",
    ...over,
  }) as Requirement;

const ws = (submissions: Sub[], requirements: Requirement[] = []) => ({
  submissions,
  requirements,
});

describe("changeReport", () => {
  it("is null before anything has been sent", () => {
    expect(changeReport(ws([]), RESPONSE, [])).toBeNull();
  });

  it("says nothing has changed when words, documents and open items are all the same", () => {
    const last = sub({
      attachments: [
        { recordId: "rec1", filename: "invoice-a.pdf", contentHash: "hash-a", page: 1 },
      ],
      unresolved: ["Add the packing list"],
    });
    const r = changeReport(ws([last], [req()]), RESPONSE, ["Add the packing list"])!;
    expect(r.nothingChanged).toBe(true);
    expect(r.text.verdict).toBe("identical");
    expect(r.documents.added).toEqual([]);
    expect(r.stillOpen).toEqual(["Add the packing list"]);
  });

  it("is not 'nothing changed' when only a document is new, even with identical wording", () => {
    const last = sub({
      attachments: [
        { recordId: "rec1", filename: "invoice-a.pdf", contentHash: "hash-a", page: 1 },
      ],
    });
    const requirements = [
      req(),
      req({ id: "r2", recordId: "rec2", filename: "invoice-b.pdf", contentHash: "hash-b" }),
    ];
    const r = changeReport(ws([last], requirements), RESPONSE, [])!;
    expect(r.nothingChanged).toBe(false);
    expect(r.documents.added).toEqual(["Supplier invoice (invoice-b.pdf)"]);
  });

  it("counts a replaced file as new and the same file under a new name as unchanged", () => {
    const last = sub({
      attachments: [
        { recordId: "rec1", filename: "invoice-a.pdf", contentHash: "hash-a", page: 1 },
      ],
    });
    const renamed = changeReport(ws([last], [req({ filename: "renamed.pdf" })]), RESPONSE, [])!;
    expect(renamed.documents.added).toEqual([]);
    const replaced = changeReport(ws([last], [req({ contentHash: "hash-new" })]), RESPONSE, [])!;
    expect(replaced.documents.added).toHaveLength(1);
    expect(replaced.documents.removed).toEqual(["invoice-a.pdf"]);
  });

  it("lists the new sentences and which open items were closed", () => {
    const last = sub({
      unresolved: ["Add the packing list", "Answer “What have you fixed already?”"],
    });
    const draft = `${RESPONSE}\nOn 2 Oct 2026 our supplier sent the packing list for the 40 units.`;
    const r = changeReport(ws([last]), draft, ["Answer “What have you fixed already?”"])!;
    expect(r.text.added).toEqual([
      "On 2 Oct 2026 our supplier sent the packing list for the 40 units.",
    ]);
    expect(r.resolved).toEqual(["Add the packing list"]);
    expect(r.stillOpen).toEqual(["Answer “What have you fixed already?”"]);
    expect(r.nothingChanged).toBe(false);
  });

  it("a send with no files attached makes every linked file new", () => {
    const r = changeReport(ws([sub()], [req()]), RESPONSE, [])!;
    expect(r.documents.comparable).toBe(true);
    expect(r.documents.added).toHaveLength(1);
  });

  it("does not guess when the earlier attempt was made before AppealDeck", () => {
    const earlier = sub({ source: "prior", revision: 0, text: "", attachments: [] });
    const r = changeReport(ws([earlier], [req()]), RESPONSE, [])!;
    expect(r.comparedTo.fromBeforeAppealDeck).toBe(true);
    expect(r.text.comparable).toBe(false);
    expect(r.text.verdict).toBe("cannot-compare");
    expect(r.documents.comparable).toBe(false);
    expect(r.documents.added).toEqual([]);
    expect(r.nothingChanged).toBe(false);
  });

  it("compares with the most recent response, not an older one", () => {
    const first = sub({
      id: "s1",
      text: "A completely different first appeal about shipping delays.",
    });
    const second = sub({ id: "s2", at: "2026-10-05T09:00:00.000Z", revision: 2 });
    const r = changeReport(ws([first, second]), RESPONSE, [])!;
    expect(r.comparedTo.revision).toBe(2);
    expect(r.text.verdict).toBe("identical");
  });
});

describe("changeReport levels", () => {
  // Long enough that one added sentence is a small share of it, as a real response is.
  const LONG = [
    "## Root Cause",
    "We listed returned items as new because returns went back on sale unchecked.",
    "Nobody was assigned to open returned packages.",
    "The listings for B0EXAMPLE1 carried the wrong condition for four weeks.",
    "## Corrective Actions",
    "On 20 Sep 2026 we removed all 12 affected listings.",
    "On 21 Sep 2026 we relisted the returned units as used.",
    "We contacted the four customers who received opened items.",
    "## Preventive Measures",
    "Our warehouse lead opens every return before it goes back on sale.",
    "A second person checks a sample every Friday.",
    "The checks are written down in a shared log.",
  ].join("\n");

  const last = (over: Partial<Sub> = {}) => sub({ text: LONG, ...over });

  it("a sentence with a date, number or name the last response lacked is a real change", () => {
    const draft = `${LONG}\nOn 3 Oct 2026 our supplier Harbor Goods sent the missing report.`;
    const r = changeReport(ws([last()]), draft, [])!;
    expect(r.text.verdict).toBe("near-identical");
    expect(r.level).toBe("changed");
    expect(r.text.addedWithNewFacts).toEqual([
      "On 3 Oct 2026 our supplier Harbor Goods sent the missing report.",
    ]);
  });

  it("an added sentence that carries no new fact is 'little': the wording moved, the case did not", () => {
    const draft = `${LONG}\nWe now take returns much more seriously than before.`;
    const r = changeReport(ws([last()]), draft, [])!;
    expect(r.level).toBe("little");
    expect(r.nothingChanged).toBe(false);
    expect(r.text.added).toHaveLength(1);
    expect(r.text.addedWithNewFacts).toEqual([]);
  });

  it("removing text and adding nothing is 'little', not 'nothing'", () => {
    const draft = LONG.split("\n").slice(0, -2).join("\n");
    const r = changeReport(ws([last()]), draft, [])!;
    expect(r.level).toBe("little");
    expect(r.text.removedCount).toBeGreaterThan(0);
  });

  it("is 'nothing' only when not a sentence differs", () => {
    expect(changeReport(ws([last()]), LONG, [])!.level).toBe("nothing");
    expect(changeReport(ws([last()]), LONG.toUpperCase(), [])!.level).toBe("nothing");
  });

  it("a new document makes it a change even when the words are the same", () => {
    const r = changeReport(ws([last()], [req()]), LONG, [])!;
    expect(r.level).toBe("changed");
  });

  it("an earlier attempt with no wording is never called 'nothing' or 'little'", () => {
    const earlier = sub({ source: "prior", revision: 0, text: "", attachments: [] });
    expect(changeReport(ws([earlier]), LONG, [])!.level).toBe("changed");
  });
});
