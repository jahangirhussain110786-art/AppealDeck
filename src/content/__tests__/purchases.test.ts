import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EMAIL_PRODUCTS, PRODUCTS, SINGLE_RESPONSE_USED } from "../purchases";
import { HOME } from "../marketing";

const dollars = (text: string) => Number(text.replace(/[$,]/g, ""));
const migration = (name: string) =>
  readFileSync(join(process.cwd(), "supabase", "migrations", name), "utf8");

/**
 * Every figure in `purchases.ts` that is derived from another is recomputed here, so a price edited
 * in one place and not the other fails in milliseconds instead of reaching a seller.
 */
describe("the prices add up", () => {
  it("the review's price comes off the Appeal Pass price", () => {
    expect(dollars(PRODUCTS.review.price)).toBe(49);
    expect(249 - dollars(PRODUCTS.review.price)).toBe(dollars(PRODUCTS.review.creditedPassAmount));
    expect(PRODUCTS.review.features.join(" ")).toContain("which then costs $200");
  });

  it("each pack costs its count times its per-case price", () => {
    expect(dollars(PRODUCTS.pack10.each) * PRODUCTS.pack10.count).toBe(
      dollars(PRODUCTS.pack10.price),
    );
    expect(dollars(PRODUCTS.pack30.each) * PRODUCTS.pack30.count).toBe(
      dollars(PRODUCTS.pack30.price),
    );
  });

  it("the Pro plan's per-case price is its price divided by its credits, and sits between the packs", () => {
    expect(dollars(PRODUCTS.pro.price) / PRODUCTS.pro.credits).toBeCloseTo(
      dollars(PRODUCTS.pro.each),
      2,
    );
    expect(dollars(PRODUCTS.pro.each)).toBeGreaterThan(dollars(PRODUCTS.pack30.each));
    expect(dollars(PRODUCTS.pro.each)).toBeLessThan(dollars(PRODUCTS.pack10.each));
  });

  it("every professional price is below the $249 a seller pays for one case", () => {
    for (const each of [PRODUCTS.pack10.each, PRODUCTS.pack30.each, PRODUCTS.pro.each]) {
      expect(dollars(each)).toBeLessThan(249);
    }
  });

  it("each amount is its price with cents", () => {
    for (const p of [
      PRODUCTS.review,
      PRODUCTS.renewal,
      PRODUCTS.pack10,
      PRODUCTS.pack30,
      PRODUCTS.pro,
    ]) {
      expect(p.amount).toBe(`${p.price}.00`);
    }
  });
});

describe("the copy agrees with the database", () => {
  it("the Pro plan grants as many credits a month as the copy says", () => {
    expect(migration("0018_more_ways_to_pay.sql")).toMatch(
      new RegExp(`'pro_plan', txn, ${PRODUCTS.pro.credits},`),
    );
  });

  it("the rebate is the amount the table records", () => {
    expect(migration("0019_outcome_reports.sql")).toMatch(
      new RegExp(`rebate_cents[^\\n]*${dollars(PRODUCTS.rebate.amount) * 100}`),
    );
  });
});

describe("what the purchase email says", () => {
  it("names each product and quotes its price", () => {
    expect(EMAIL_PRODUCTS.document_review.priceLine).toContain(PRODUCTS.review.price);
    expect(EMAIL_PRODUCTS.account_renewal.priceLine).toContain(PRODUCTS.renewal.price);
    expect(EMAIL_PRODUCTS.pack_10.priceLine).toContain(PRODUCTS.pack10.price);
    expect(EMAIL_PRODUCTS.pack_30.priceLine).toContain(PRODUCTS.pack30.price);
    expect(EMAIL_PRODUCTS.pro_plan.priceLine).toContain(PRODUCTS.pro.price);
    expect(EMAIL_PRODUCTS.pro_plan.priceLine).toContain("cancel");
  });
});

describe("the wording stays honest", () => {
  const all = JSON.stringify(PRODUCTS) + JSON.stringify(EMAIL_PRODUCTS);

  it("makes no claim about what Amazon will decide", () => {
    expect(all).not.toMatch(/guarantee|win rate|will be (approved|reinstated)|we will reinstate/i);
  });

  it("never uses a percent sign", () => {
    expect(all).not.toContain("%");
  });

  it("says a credit is for one case, and the rebate is paid whatever the result", () => {
    expect(PRODUCTS.credits.what).toMatch(/activates one case/);
    expect(PRODUCTS.rebate.body).toMatch(/Whatever the result/);
  });
});

describe("One Response (23 Oct 2026)", () => {
  it("costs what its card says, and less than the Appeal Pass", () => {
    const card = HOME.plans.items.find((p) => p.name === PRODUCTS.single.name);
    expect(card?.price).toBe(PRODUCTS.single.price);
    expect(dollars(PRODUCTS.single.price)).toBe(99);
    expect(`${dollars(PRODUCTS.single.price)}.00`).toBe(PRODUCTS.single.amount.replace("$", ""));
    expect(dollars(PRODUCTS.single.price)).toBeLessThan(249);
  });

  it("says what it does not include everywhere it is described", () => {
    const card = HOME.plans.items.find((p) => p.name === PRODUCTS.single.name)!;
    expect(card.features.join(" ")).toMatch(/No further responses/);
    expect(EMAIL_PRODUCTS.single_response.priceLine).toContain(
      "a further response needs the Appeal Pass",
    );
    expect(SINGLE_RESPONSE_USED).toContain("Appeal Pass");
    expect(SINGLE_RESPONSE_USED).not.toMatch(/guarantee|approve/i);
  });

  it("is a plan the database accepts and a kind the payment function knows", () => {
    const sql = migration("0020_single_response.sql");
    expect(sql).toContain("'single_response'");
    expect(sql).toContain("claim_single_response");
  });
});
