// Invented documents for cases G, H and I (19 Oct 2026).
const path = require("node:path");
const { chromium } = require("@playwright/test");
const OUT = path.join(__dirname, "docs");
const css = `body{font-family:Arial,sans-serif;color:#1c1f23;font-size:13px;margin:0}.p{padding:44px 52px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px}.m{color:#5b6470}.row{display:flex;justify-content:space-between;gap:24px}
.b{border:1px solid #cfd5dc;border-radius:6px;padding:12px 14px;flex:1}table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border-bottom:1px solid #dde2e7;padding:7px 6px;text-align:left}th{background:#f1f4f7;font-size:11px;text-transform:uppercase}
.n{text-align:right}.foot{position:fixed;bottom:24px;left:52px;right:52px;font-size:10px;color:#a01818}`;
const wrap = (b) =>
  `<html><head><style>${css}</style></head><body><div class="p">${b}</div><div class="foot">Invented document for software testing. Not a real record.</div></body></html>`;
const docs = {
  "A4-manufacturer-invoice-trailhead-to-summit-peak.pdf": wrap(`<div class="row"><div><h1>INVOICE</h1><div class="m">Invoice no. TG-55120</div></div><div style="text-align:right"><b>Trailhead Gear Co.</b><br>1900 Alder Street<br>Portland, OR 97209<br>+1 (503) 555-0133<br>dealers@trailheadgear.example</div></div><div class="row" style="margin-top:20px"><div class="b"><div class="m">BILL TO</div><b>Summit Peak Wholesale Inc.</b><br>4120 Industrial Way<br>Salt Lake City, UT 84104</div><div class="b"><div class="m">DETAILS</div>Invoice date: 2026-07-22<br>Terms: Net 30</div></div><table><tr><th>SKU</th><th>Description</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Amount</th></tr><tr><td>TH-T3-GRN</td><td>Trailhead 3-Person Backpacking Tent, green</td><td class="n">400</td><td class="n">$61.00</td><td class="n">$24,400.00</td></tr><tr><td>TH-FP-3</td><td>Trailhead Footprint Groundsheet</td><td class="n">400</td><td class="n">$8.90</td><td class="n">$3,560.00</td></tr></table>`),
  "G1-certificate-of-analysis-turmeric.pdf": wrap(`<h1>Certificate of Analysis</h1><div class="m">Cascade Analytical Laboratories, ISO/IEC 17025 accredited (cert. no. AT-2217) · 902 Evergreen Way, Tacoma, WA 98402 · +1 (253) 555-0166</div>
<h2>Sample</h2><p>Alder &amp; Moss Turmeric and Black Pepper Capsules, 120 count. Batch AM-TUR-0826. Received 20 August 2026. Report date: 2 September 2026. Client: Alder &amp; Moss Wellness LLC, 240 Spruce Street, Portland, OR 97204.</p>
<table><tr><th>Test</th><th>Specification</th><th>Result</th></tr><tr><td>Curcuminoids (HPLC)</td><td>min 95% of extract</td><td>96.4%</td></tr><tr><td>Piperine</td><td>min 95%</td><td>95.8%</td></tr><tr><td>Lead</td><td>max 0.5 ppm</td><td>0.08 ppm</td></tr><tr><td>Arsenic</td><td>max 1.0 ppm</td><td>&lt;0.05 ppm</td></tr><tr><td>Total plate count</td><td>max 10,000 CFU/g</td><td>420 CFU/g</td></tr><tr><td>Salmonella</td><td>absent in 25 g</td><td>Absent</td></tr></table>
<p class="m" style="margin-top:18px">Analyst: D. Kowalski, Quality Manager.</p>`),
  "G2-cgmp-certificate-manufacturer.pdf": wrap(`<h1>cGMP Compliance Certificate</h1><div class="m">Issued by Pacific Northwest Quality Certification</div>
<p style="margin-top:18px">This certifies that <b>Evergreen Nutraceutical Manufacturing Inc.</b>, 1180 Industrial Parkway, Salem, OR 97301, manufactures dietary supplements in accordance with 21 CFR Part 111 (current Good Manufacturing Practice).</p>
<p>Audit date: 11 March 2026. Certificate number PNQC-2026-5530. Valid until 10 March 2027.</p><p>Products covered include capsule-form botanical supplements.</p>`),
  "G3-supplier-invoice-evergreen.pdf": wrap(`<div class="row"><div><h1>INVOICE</h1><div class="m">Invoice no. EN-70418</div></div><div style="text-align:right"><b>Evergreen Nutraceutical Manufacturing Inc.</b><br>1180 Industrial Parkway<br>Salem, OR 97301<br>+1 (503) 555-0187<br>orders@evergreen-nutra.example</div></div>
<div class="row" style="margin-top:20px"><div class="b"><div class="m">BILL TO</div><b>Alder &amp; Moss Wellness LLC</b><br>240 Spruce Street<br>Portland, OR 97204</div><div class="b"><div class="m">DETAILS</div>Invoice date: 2026-08-28<br>Terms: Net 30</div></div>
<table><tr><th>SKU</th><th>Description</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Amount</th></tr><tr><td>AM-TUR-120</td><td>Turmeric and Black Pepper Capsules, 120 count, batch AM-TUR-0826</td><td class="n">1,200</td><td class="n">$4.10</td><td class="n">$4,920.00</td></tr></table>`),
  "G4-supplement-facts-label.png":
    "html:" +
    wrap(`<div style="width:430px;border:3px solid #000;padding:14px;margin:30px auto;font-family:Arial"><h1 style="font-size:28px;border-bottom:8px solid #000">Supplement Facts</h1>
<p>Serving size: 2 capsules · Servings per container: 60</p><table><tr><td><b>Amount per serving</b></td><td class="n"><b>% DV</b></td></tr><tr><td>Turmeric root extract (95% curcuminoids) 1,000 mg</td><td class="n">*</td></tr><tr><td>Black pepper extract (95% piperine) 10 mg</td><td class="n">*</td></tr></table>
<p>* Daily Value not established.</p><p>Other ingredients: vegetable capsule (hypromellose), rice flour.</p><p><b>Alder &amp; Moss Turmeric and Black Pepper Capsules</b><br>Net quantity: 120 capsules</p></div>`),
  "H1-written-procedure-no-review-requests.pdf": wrap(`<h1>Quickstep Footwear: customer communication procedure</h1><div class="m">Effective 16 October 2026 · Owner: Hannah Quist</div>
<h2>1. Packing inserts</h2><p>Only the packing slip and the care card go in a parcel. The "Tell us how we did" card with a gift card offer was withdrawn on 15 October 2026 and all remaining stock of it (about 1,400 cards) was destroyed on 15 October 2026.</p>
<h2>2. Review requests</h2><p>We use only Amazon's own "Request a Review" button, for every customer, regardless of how the order went.</p>
<h2>3. Approval</h2><p>Any new insert or message to customers must be read and approved by the owner before printing. The owner keeps a dated file of approved inserts.</p>`),
  "I1-bank-statement-tidewater-pottery.pdf": wrap(`<div class="row"><div><h1>Harborview Savings Bank</h1><div class="m">Business account statement</div></div><div style="text-align:right">Statement period: 1 Sep to 30 Sep 2026</div></div>
<div class="b" style="margin-top:20px"><b>Account holder</b><br>Tidewater Pottery Studio LLC<br>9 Quay Street<br>Gloucester, MA 01930<br>Account ending 3391</div>
<table><tr><th>Date</th><th>Description</th><th class="n">Amount</th></tr><tr><td>1 Sep</td><td>Opening balance</td><td class="n">$2,904.55</td></tr><tr><td>12 Sep</td><td>Deposit, craft fair</td><td class="n">$640.00</td></tr><tr><td>30 Sep</td><td>Closing balance</td><td class="n">$3,311.20</td></tr></table>`),
};
(async () => {
  const browser = await chromium.launch();
  for (const [name, html] of Object.entries(docs)) {
    const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
    await page.setContent(html.replace(/^html:/, ""));
    if (name.endsWith(".png")) await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    else await page.pdf({ path: path.join(OUT, name), format: "Letter" });
    await page.close();
    console.log("wrote", name);
  }
  await browser.close();
})();
