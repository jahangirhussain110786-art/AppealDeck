import { describe, expect, it, vi } from "vitest";
import { AUDIENCE_SWITCH, PARTNERS, PROS, ROLE_PICKER } from "../audiences";
import { FAQ, HOME, PRICING, type FaqItem } from "../marketing";
import { ROLES, ROLE_HOME } from "@/lib/role";

const PASS = 249;
const PARTNER_DISCOUNT = 25;
const COMMISSION = 0.3;

describe("pricing for sellers, writers and partners", () => {
  it("shows all three audiences, each linking to its own page", () => {
    expect(AUDIENCE_SWITCH.items.map((i) => i.role)).toEqual([...ROLES]);
    for (const item of AUDIENCE_SWITCH.items)
      expect(item.href, item.role).toBe(ROLE_HOME[item.role]);
  });

  it("offers every role at sign-up, plus a way to say nothing", () => {
    const values = ROLE_PICKER.options.map((o) => o.value);
    for (const role of ROLES) expect(values).toContain(role);
    expect(values).toContain("none");
  });

  it("states the partner arithmetic the same way the price does", () => {
    const paid = PASS - PARTNER_DISCOUNT;
    const earned = (paid * COMMISSION).toFixed(2);
    expect(PARTNERS.earn.body).toContain(`$${PASS}`);
    expect(PARTNERS.earn.body).toContain(`$${paid}`);
    expect(PARTNERS.earn.body).toContain(`$${earned}`);
    expect(PARTNERS.hero.lede).toContain(`$${PARTNER_DISCOUNT}`);
    expect(PARTNERS.hero.lede).toContain("30 percent");
    expect(PARTNERS.how.steps.map((s) => s.body).join(" ")).toContain("30 percent");
    expect(PRICING.order.amount).toBe(`$${PASS}.00`);
  });

  it("states the Account Pass partner arithmetic only while the Account Pass is on sale", async () => {
    expect(PARTNERS.earn.accountPass).toBeNull();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    const on = await import("../audiences");
    const accountPrice = 329;
    const paid = accountPrice - PARTNER_DISCOUNT;
    expect(on.PARTNERS.earn.accountPass).toContain(`${accountPrice}`);
    expect(on.PARTNERS.earn.accountPass).toContain(`${paid}`);
    expect(on.PARTNERS.earn.accountPass).toContain(`${(paid * COMMISSION).toFixed(2)}`);
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("pays a partner only after the refund window, and says so", () => {
    expect(PARTNERS.how.steps.map((s) => s.body).join(" ")).toMatch(/14-day refund window/);
    expect(PARTNERS.earn.refunded).toMatch(/refunded or charged back pays nothing/i);
  });

  it("tells a partner who advises sellers to disclose the fee, in writing", () => {
    expect(PARTNERS.rules.items.join(" ")).toMatch(/in writing that you earn it before they buy/);
    expect(PARTNERS.rules.items.join(" ")).toMatch(/I earn a commission/);
    expect(PARTNERS.rules.items.join(" ")).toMatch(/never ask for a review/i);
  });

  it("never claims what does not exist: no plan, pack, dashboard or shared case is offered", () => {
    const everything = JSON.stringify(PROS);
    expect(PROS.cost.open).toMatch(/not set yet/i);
    expect(PARTNERS.earn.noDashboard).toMatch(/no dashboard yet/i);
    expect(PROS.limits.items.join(" ")).toMatch(/not shared between team members yet/);
    // nothing in the pages for professionals quotes a monthly or per-case professional price
    expect(PROS.cost.body.match(/\$\d+/g)).toEqual([`$${PASS}`]);
    expect(everything).not.toMatch(/per month|a month|monthly plan|case packs?\b/i);
  });

  it("has a support address to write to, with a subject, on both pages", () => {
    for (const href of [PROS.mailto, PARTNERS.mailto])
      expect(href).toMatch(/^mailto:[^?]+@[^?]+\?subject=.+/);
  });
});

describe("the chatbot comparison and the going rates", () => {
  it("re-reads the going rates at least every 150 days", () => {
    const checked = new Date(`${PRICING.market.checkedOn}T00:00:00Z`).getTime();
    expect(Number.isNaN(checked)).toBe(false);
    const ageDays = (Date.now() - checked) / 86_400_000;
    expect(
      ageDays,
      `PRICING.market was read on ${PRICING.market.checkedOn}; read the price pages again and change the date`,
    ).toBeLessThan(150);
    expect(PRICING.market.checkedLabel).toContain("22 October 2026");
  });

  it("names no company, and promises nothing about Amazon's decision", () => {
    const text = JSON.stringify({ v: PRICING.versus, m: PRICING.market });
    expect(text).not.toMatch(
      /appealspro|sellerforge|chatgpt|claude|gemini|riverbend|appeal guru|openai|anthropic/i,
    );
    expect(text).not.toMatch(/reinstat|approv|will win|win rate|odds|guarantee/i);
    expect(PRICING.versus.note).toMatch(
      /does not claim Amazon treats a chatbot's letter differently/,
    );
  });

  it("compares like with like: every row has a job and an answer from each side", () => {
    expect(PRICING.versus.rows.length).toBeGreaterThanOrEqual(6);
    for (const row of PRICING.versus.rows) {
      expect(row.job.length).toBeGreaterThan(5);
      expect(row.chatbot.length).toBeGreaterThan(1);
      expect(row.us.length).toBeGreaterThan(1);
    }
  });

  it("has every FAQ answer the pages point at", () => {
    const ids = new Set<string>(FAQ.items.map((i) => i.id));
    for (const id of [...HOME.questions.ids, ...PRICING.faqIds]) expect(ids.has(id), id).toBe(true);
    for (const group of FAQ.groups)
      for (const id of group.items) expect(ids.has(id), id).toBe(true);
    // every question is in exactly one group, so each one is reachable on /faq
    const grouped = FAQ.groups.flatMap((g) => [...g.items]);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...ids].sort()).toEqual([...grouped].sort());
  });

  it("links the chatbot answer to the comparison it refers to", () => {
    const chatbot = (FAQ.items as readonly FaqItem[]).find((i) => i.id === "chatbot");
    expect(chatbot?.link?.href).toBe(`/pricing#${PRICING.versus.id}`);
  });
});
