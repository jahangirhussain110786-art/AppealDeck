import { describe, expect, it } from "vitest";
import { findD6Allegation, hasD6Allegation } from "./violationKinds";
import { FIXTURES } from "./fixtures";
import { routeWorkspace, newWorkspace } from "./workspace";

/**
 * D6 gates what a notice or an Amazon reply ACCUSES the seller of: forged or fabricated documents,
 * fraud, and child abuse. This corpus pins the rule in both directions. Missing an allegation sells
 * a draft where qualified help is needed, so the must-gate list is the one that matters most; the
 * must-not list keeps ordinary boilerplate from sending a routine case to a referral.
 */
const MUST_GATE = [
  "Your account has been deactivated for fraud.",
  "We suspect you of fraud.",
  "This action is due to fraud on your account.",
  "Your account was closed due to fraud on your account.",
  "payment fraud was identified on your account",
  "We received allegations of fraud against your account.",
  "You were accused of fraud by several customers.",
  "You have defrauded customers by shipping empty boxes.",
  "We identified that you made fraudulent returns claims.",
  "Fraudulent invoice submitted.",
  "You are suspected of fraudulent activity.",
  "We have determined that fraud was committed by your account.",
  "We have found evidence that you committed fraud",
  "Fabricating reviews and orders is fraud.",
  "Your account is suspended due to fraud.\nPlease submit a plan of action.",
  "Our team detected fraud associated with your seller account.",
  "Customers reported fraud on your account.",
  "You committed identity fraud.",
  "Your account was involved in a fraud scheme.",
  "This account is under a fraud investigation.",
  "The seller's account was closed for forgery of supplier invoices.",
  "Our investigation shows that you submitted forged supplier invoices.",
  "We found that the documents you sent us were forged.",
  "The documents that you supplied for verification have been forged or altered.",
  "Based on our review, the supplier invoices submitted by you contain forged information.",
  "Your invoice was altered before submission.",
  "The invoices were falsified by you.",
  "invoice(s) falsified",
  "You provided falsified paperwork.",
  "You submitted false documents to Amazon.",
  "You submitted fake invoices to Amazon.",
  "The invoices you submitted are fake.",
  "Your ID document appears to be fake.",
  "The utility bill you uploaded appears to be manipulated.",
  "The utility bill you provided for address verification appears to be manipulated.",
  "Documents you provided have been edited.",
  "You uploaded counterfeit invoices.",
  "You submitted a counterfeit and doctored invoice.",
  "The purchase invoice you sent was doctored.",
  "Our team determined that the document is not genuine and has been tampered with.",
  "The bank statement you sent was tampered with.",
  "Your invoice has been fabricated according to the supplier.",
  "You provided fabricated documents.",
  "The supplier says the invoice you sent was never issued by them and is a fabrication of invoices.",
  "Your bank statement is fake.",
  "The receipts you provided are bogus.",
  "We believe you are engaged in a scam against our customers.",
  "Your listings were reported as a scam.",
  "You have been scamming buyers.",
  "Child sexual exploitation content was reported on your listing.",
  "Your listings contain child sexual abuse material and have been reported.",
  "Your account was flagged for child abuse imagery.",
  "Sale of items that put children at risk through child pornography.",
  "We found a violation related to the safety of children: child endangerment.",
  "Your products sexualize minors.",
  "You have been selling items that sexualize or endanger minors; this is a child safety violation.",
  "This is a child safety investigation regarding items you sold.",
  "Reports of child exploitation were linked to your account.",
  "The listing contains CSAM.",
  "Your listing was removed for endangering children.",
  "We found sexual content involving minors in your product images.",
  "Your account is being investigated for harm to the safety of children.",
  "Amazon alleges that your invoices were forged.",
  "We believe you submitted falsified documents.",
  "Your account has been terminated for fraudulent behavior.",
  "The documents provided were falsified.",
  "Your fraud prevention checks failed because you submitted forged documents.",
  "As part of our fraud prevention team review, we found you committed fraud.",
  "Thank you for your appeal. We have detected fraud on the account and cannot reinstate it.",
  "Your reply states the invoices are genuine, but we confirmed the invoices are fake.",
  "We reviewed the invoice and found that it contains false information and a doctored date.",
  "Your account is a victim of a scam and also committed a scam.",
];

const MUST_NOT_GATE = [
  "As part of our fraud prevention checks, please verify your identity.",
  "Your funds are held. As part of our fraud detection program, provide a bank statement.",
  "To protect against fraud, we are holding your funds for 14 days.",
  "Amazon's fraud detection systems flagged a verification need. Please upload government-issued ID.",
  "We use anti-fraud measures to protect against fraud. Please provide the supplier invoice.",
  "Our anti-fraud team requires a business license.",
  "Fraud protection: we need to confirm your bank account.",
  "Fraud, waste and abuse policy: please update your tax information.",
  "This notice is a reminder about fraud awareness: Amazon will never ask for your password.",
  "We detected a drop in order defect rate; fraud checks passed.",
  "We work to protect against fraudulent activity.",
  "Amazon works to prevent and detect fraud on our store.",
  "We take steps to protect our customers from fraud, so we need to verify your business.",
  "Beware of scam emails pretending to be from Amazon.",
  "Please be aware of scams and never share your one-time code.",
  "Your product must comply with child safety standards (CPSIA). Please provide test reports.",
  "Our child safety requirements apply to this category. Please send the invoice.",
  "We take child safety seriously. Your listing for toys needs a Children's Product Certificate.",
  "The child ASIN is a variation of the parent listing; the parent listing has a policy violation.",
  "Customers reported the child lock on the toy fails. Please provide a test report.",
  "This bottle has a child-resistant cap that customers say is hard to open.",
  "Your product must use tamper-evident packaging. Please upload a photo of the package.",
  "Your product safety documents were not provided. Please send an invoice.",
  "Please confirm that the invoices you sent are authentic and the documents are legible.",
  "Customers reported your product was not authentic. Provide invoices from your supplier.",
  "We received complaints about the authenticity of your item. Please send supplier invoices.",
  "The invoice you submitted was not legible and was missing the supplier's address.",
  "Your invoices were rejected because they were more than 365 days old.",
  "A customer filed an A-to-Z claim for a damaged child seat.",
  "Your Plan of Action must address safety complaints about child car seats.",
  "Documents must not be altered or edited before upload. Please send the invoice again.",
  "Do not edit the invoice; send the original PDF.",
  "The document was not altered and matches our records.",
  "Your account health is at risk. Please submit a plan of action with root cause, corrective actions and preventive measures.",
  "Your selling privileges have been removed because your order defect rate exceeded 1%.",
  "Please provide a government-issued ID and a recent bank statement within 7 days.",
  "Your listing violates our detail page policy. Please fix the title and resubmit.",
  "We could not verify your address. Please provide a utility bill dated within the last 90 days.",
  "Your account is deactivated because of a related account. Please explain the relationship.",
  "Thank you for your appeal. Your plan of action does not identify the root cause. Please also provide the supplier invoice.",
  "The rights owner submitted a complaint of intellectual property infringement. Please contact them.",
  "Your reply needs a letter of authorization from the brand.",
  "We have reinstated your selling privileges. Thank you for your cooperation.",
  "Your product is restricted in this category. Provide an invoice showing purchase from an authorized distributor.",
  "Please upload a clearer photo of the product label showing the ingredients.",
  "Your plan should state who checks each listing and how often.",
  "A false positive in our systems may have flagged your listing; please send the invoice.",
];

describe("D6 allegation rule: must gate", () => {
  it("has at least 60 cases", () => expect(MUST_GATE.length).toBeGreaterThanOrEqual(60));
  it.each(MUST_GATE)("gates: %s", (text) => {
    expect(hasD6Allegation(text)).toBe(true);
  });
  it.each(MUST_GATE.slice(0, 20))("routes to specialist: %s", (text) => {
    expect(
      routeWorkspace({
        ...newWorkspace(),
        notice: `${text} Please submit a plan of action to appeal.`,
      }).protocol,
    ).toBe("specialist");
  });
});

describe("D6 allegation rule: must not gate", () => {
  it("has at least 40 cases", () => expect(MUST_NOT_GATE.length).toBeGreaterThanOrEqual(40));
  it.each(MUST_NOT_GATE)("does not gate: %s", (text) => {
    expect(findD6Allegation(text)).toBeNull();
  });
});

describe("D6 allegation rule against the fixture corpus", () => {
  it("every falsified-documents fixture still gates", () => {
    const fabrication = FIXTURES.filter((f) => f.expected.severityGated);
    expect(fabrication.length).toBeGreaterThan(0);
    for (const f of fabrication)
      expect(hasD6Allegation(f.raw), f.id ?? f.raw.slice(0, 40)).toBe(true);
  });
  it("no genuine (non-gated) fixture gates", () => {
    const genuine = FIXTURES.filter((f) => !f.expected.severityGated);
    const wrong = genuine.filter((f) => hasD6Allegation(f.raw));
    expect(wrong.map((f) => f.id ?? f.raw.slice(0, 60))).toEqual([]);
  });
});

describe("findD6Allegation", () => {
  it("quotes the sentence that carries the allegation", () => {
    const found = findD6Allegation("Hello. You submitted forged invoices to Amazon. Thanks.");
    expect(found?.quote).toBe("You submitted forged invoices to Amazon.");
  });
});

describe("D6 allegation rule cost on hostile input", () => {
  const inputs: Record<string, string> = {
    "long sentence of record words": "documents ".repeat(5000),
    "long run of filler between record noun and verb": `invoice ${"word ".repeat(9000)}was`,
    "dotted string": "a.".repeat(25000),
    "child and sexual repeated": "child sexual ".repeat(4000),
    "protect from repeated": "protect from the ".repeat(3000),
    newlines: "\n".repeat(49000),
  };
  it.each(Object.entries(inputs))("%s stays fast", (_name, text) => {
    const started = performance.now();
    hasD6Allegation(text.slice(0, 50000));
    expect(performance.now() - started).toBeLessThan(750);
  });
});

describe("D6 allegation rule across a pasted line break", () => {
  it("reads 'fake\ninvoices' as one allegation", () => {
    expect(hasD6Allegation("You sent fake\ninvoices to Amazon.")).toBe(true);
    expect(hasD6Allegation("These invoices\nwere edited before upload")).toBe(true);
  });
});
