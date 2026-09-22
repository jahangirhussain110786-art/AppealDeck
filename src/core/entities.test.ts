import { describe, it, expect } from "vitest";
import { extractEntities, entitiesOfKind } from "./entities";

/**
 * Every entity must be quotable back to the source — the D6 traceability requirement. Identifiers
 * slice back to exactly their value; a `requested_record` slices back to the words that matched,
 * because its `value` is a canonical display label rather than the notice's own wording.
 */
function expectSpansValid(raw: string, entities: ReturnType<typeof extractEntities>) {
  for (const e of entities) {
    const sliced = raw.slice(e.start, e.end);
    expect(sliced.length).toBeGreaterThan(0);
    if (e.kind === "requested_record") {
      expect(e.quote).toContain(sliced);
    } else {
      expect(sliced).toBe(e.value);
    }
  }
}

describe("extractEntities", () => {
  it("extracts ASINs", () => {
    const raw = "The affected products are B08N5WRWNW and B0CZ7L9PQ2.";
    const asins = entitiesOfKind(extractEntities(raw), "asin").map((e) => e.value);
    expect(asins).toEqual(["B08N5WRWNW", "B0CZ7L9PQ2"]);
    expectSpansValid(raw, extractEntities(raw));
  });

  it("extracts order IDs in Amazon's 3-7-7 format", () => {
    const raw = "This concerns order 114-3941689-8772232.";
    expect(entitiesOfKind(extractEntities(raw), "order_id").map((e) => e.value)).toEqual([
      "114-3941689-8772232",
    ]);
  });

  it("extracts a case ID only when it is labelled", () => {
    const labelled = extractEntities("Please reference Case ID: 8823471905 in your reply.");
    expect(entitiesOfKind(labelled, "case_id").map((e) => e.value)).toEqual(["8823471905"]);

    // A bare digit run is far more likely to be a phone number or a total than a case ID.
    const unlabelled = extractEntities("Our support line is 8823471905.");
    expect(entitiesOfKind(unlabelled, "case_id")).toHaveLength(0);
  });

  it("reports the span of the case ID itself, not the whole label", () => {
    const raw = "Please reference Case ID: 8823471905 in your reply.";
    expectSpansValid(raw, extractEntities(raw));
  });

  it("reads unambiguous date formats without flagging them", () => {
    for (const raw of [
      "Respond by 2026-10-15.",
      "Respond by 15 October 2026.",
      "Respond by October 15, 2026.",
    ]) {
      const dates = entitiesOfKind(extractEntities(raw), "date");
      expect(dates).toHaveLength(1);
      expect(dates[0]!.ambiguous).toBeUndefined();
    }
  });

  it("flags an all-numeric date as ambiguous instead of guessing the order", () => {
    const dates = entitiesOfKind(extractEntities("Respond by 03/04/2026."), "date");
    expect(dates).toHaveLength(1);
    expect(dates[0]!.ambiguous).toBe(true);
  });

  it("does not downgrade a readable date that overlaps a numeric match", () => {
    const dates = entitiesOfKind(extractEntities("Dated 2026-10-15 for your records."), "date");
    expect(dates).toHaveLength(1);
    expect(dates[0]!.ambiguous).toBeUndefined();
  });

  it("extracts amounts", () => {
    expect(
      entitiesOfKind(extractEntities("A balance of $1,240.50 is on hold."), "amount").map(
        (e) => e.value,
      ),
    ).toEqual(["$1,240.50"]);
  });

  it("extracts records only from clauses that actually request them", () => {
    const raw = "Please provide your supplier invoice and a letter of authorization.";
    const records = entitiesOfKind(extractEntities(raw), "requested_record").map((e) => e.value);
    expect(records).toContain("Supplier invoice");
    expect(records).toContain("Letter of authorization");
  });

  it("reads an inflected request verb", () => {
    const raw =
      "Please complete identity verification by providing government-issued identification.";
    expect(entitiesOfKind(extractEntities(raw), "requested_record").map((e) => e.value)).toEqual([
      "Identity document",
    ]);
  });

  it("does not treat a negated clause as a request", () => {
    const raw = "Do not resend the invoices you already provided.";
    expect(entitiesOfKind(extractEntities(raw), "requested_record")).toHaveLength(0);
  });

  it("does not treat a bare mention as a request", () => {
    const raw = "Our records show an invoice was reviewed last week.";
    expect(entitiesOfKind(extractEntities(raw), "requested_record")).toHaveLength(0);
  });

  it("keeps only the first occurrence of a repeated value", () => {
    const raw = "ASIN B08N5WRWNW was flagged. B08N5WRWNW remains inactive.";
    expect(entitiesOfKind(extractEntities(raw), "asin")).toHaveLength(1);
  });

  it("returns entities in document order", () => {
    const raw = "Case ID: 8823471905 concerns B08N5WRWNW, order 114-3941689-8772232.";
    const starts = extractEntities(raw).map((e) => e.start);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it("returns nothing for a notice with no identifiers, rather than inventing any", () => {
    expect(extractEntities("Your account has been deactivated.")).toHaveLength(0);
  });

  it("handles a realistic notice end to end", () => {
    const raw = [
      "Hello,",
      "",
      "Your listing for B08N5WRWNW was removed on 2026-09-14.",
      "Case ID: 8823471905",
      "Please provide your supplier invoice showing a completed transaction.",
    ].join("\n");
    const entities = extractEntities(raw);
    expectSpansValid(raw, entities);
    expect(entitiesOfKind(entities, "asin").map((e) => e.value)).toEqual(["B08N5WRWNW"]);
    expect(entitiesOfKind(entities, "case_id").map((e) => e.value)).toEqual(["8823471905"]);
    expect(entitiesOfKind(entities, "date").map((e) => e.value)).toEqual(["2026-09-14"]);
    expect(entitiesOfKind(entities, "requested_record").map((e) => e.value)).toEqual([
      "Supplier invoice",
    ]);
  });
});
