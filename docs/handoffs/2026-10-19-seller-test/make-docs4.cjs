// Invented documents for the five new cases (19 Oct 2026). Same rules as make-docs.cjs.
const path = require("node:path");
const { chromium } = require("@playwright/test");
const OUT = path.join(__dirname, "docs");
const css = `body{font-family:Arial,sans-serif;color:#1c1f23;font-size:13px;margin:0}.p{padding:44px 52px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px}.m{color:#5b6470}.row{display:flex;justify-content:space-between;gap:24px}
.b{border:1px solid #cfd5dc;border-radius:6px;padding:12px 14px;flex:1}table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border-bottom:1px solid #dde2e7;padding:7px 6px;text-align:left;vertical-align:top}th{background:#f1f4f7;font-size:11px;text-transform:uppercase}
.n{text-align:right}.foot{position:fixed;bottom:24px;left:52px;right:52px;font-size:10px;color:#a01818}`;
const wrap = (b) =>
  `<html><head><style>${css}</style></head><body><div class="p">${b}</div><div class="foot">Invented document for software testing. Not a real record.</div></body></html>`;

function invoice(o) {
  const rows = o.lines
    .map(
      (l) =>
        `<tr><td>${l[0]}</td><td>${l[1]}</td><td class="n">${l[2]}</td><td class="n">$${l[3].toFixed(2)}</td><td class="n">$${(l[2] * l[3]).toFixed(2)}</td></tr>`,
    )
    .join("");
  const total = o.lines.reduce((s, l) => s + l[2] * l[3], 0);
  return wrap(`<div class="row"><div><h1>${o.title ?? "INVOICE"}</h1><div class="m">Invoice no. ${o.no}</div></div>
<div style="text-align:right"><b>${o.from}</b><br>${o.fromLines.join("<br>")}<br>${o.phone}<br>${o.email}</div></div>
<div class="row" style="margin-top:20px"><div class="b"><div class="m">BILL TO</div><b>${o.to}</b><br>${o.toLines.join("<br>")}</div>
<div class="b"><div class="m">DETAILS</div>Invoice date: ${o.date}<br>Terms: ${o.terms ?? "Net 30"}<br>Paid: yes</div></div>
<table><tr><th>SKU</th><th>Description</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Amount</th></tr>${rows}<tr><td colspan="4"><b>Total</b></td><td class="n"><b>$${total.toFixed(2)}</b></td></tr></table>`);
}
const LARK = {
  to: "Larkspur & Fern Gifts LLC",
  toLines: ["412 Bull Street, Suite 6", "Savannah, GA 31401"],
};

const docs = {
  // Case 1: two wholesalers, 300 units between them against 340 sold.
  "1A-invoice-lowcountry-wax-2026-07.pdf": invoice({
    no: "LWS-31877",
    from: "Lowcountry Wax & Wick Supply Inc.",
    fromLines: ["2200 Port Wentworth Road", "Savannah, GA 31407"],
    phone: "+1 (912) 555-0141",
    email: "sales@lowcountrywax.example",
    ...LARK,
    date: "2026-07-08",
    lines: [
      ["LS-SOY-GS", "Larkspur Hand-Poured Soy Candle Gift Set", 120, 9.4],
      ["FH-BW-6", "Fern & Honey Beeswax Taper Candles, 6 pack", 60, 6.25],
    ],
  }),
  "1B-invoice-magnolia-botanicals-2026-08.pdf": invoice({
    no: "MB-2026-0562",
    from: "Magnolia Botanicals Wholesale LLC",
    fromLines: ["77 Peachtree Industrial Blvd", "Atlanta, GA 30340"],
    phone: "+1 (404) 555-0119",
    email: "orders@magnoliabotanicals.example",
    ...LARK,
    date: "2026-08-19",
    lines: [["WF-LRS-8", "Wildflower Linen Room Spray, 8 oz", 120, 3.1]],
  }),
  "1C-retail-receipt-warehouse-club.pdf":
    wrap(`<h1 style="text-align:center">QUARTERMILE WAREHOUSE CLUB</h1><div class="m" style="text-align:center">Savannah, GA · Member 4417 8820 31<br>2026-09-02 14:21</div>
<table><tr><th>Item</th><th class="n">Qty</th><th class="n">Price</th></tr><tr><td>Soy candle gift set (assorted)</td><td class="n">24</td><td class="n">$311.76</td></tr><tr><td>Taper candles 6pk</td><td class="n">12</td><td class="n">$119.88</td></tr></table><p>Visa ****2290 · Thank you for shopping</p>`),
  // Case 2: manufacturer invoice and a maker's statement
  "2A-commercial-invoice-shenzhen-aluminium.pdf": invoice({
    title: "COMMERCIAL INVOICE",
    no: "SZ-AL-260933",
    from: "Shenzhen Brightway Metal Products Co., Ltd.",
    fromLines: ["Building 7, Longhua Industrial Park", "Shenzhen, Guangdong 518109, China"],
    phone: "+86 755 5550 1128",
    email: "export@brightway-metal.example",
    to: "Kestrel Desk Co.",
    toLines: ["1560 Larimer Street, Unit 210", "Denver, CO 80202, USA"],
    date: "2026-06-14",
    lines: [
      ["KD-AIRLIFT-SLV", "Adjustable aluminum laptop stand, silver, model AL-114", 800, 6.85],
    ],
  }),
  "2B-manufacturer-statement-original-design.pdf":
    wrap(`<h1>Shenzhen Brightway Metal Products Co., Ltd.</h1><div class="m">Building 7, Longhua Industrial Park, Shenzhen 518109 · export@brightway-metal.example</div>
<p style="margin-top:22px">10 October 2026</p><p><b>Statement regarding model AL-114</b></p>
<p>Brightway Metal Products designed the AL-114 laptop stand in-house in 2022. Our first production run was completed on 18 March 2022 and our catalogue page for AL-114 was published on 2 April 2022. We supply this model to several customers, including Kestrel Desk Co.</p>
<p>We have no licence or agreement with Orbis Ergonomics Inc. and we do not make any product to its designs.</p><p style="margin-top:28px">Li Wei, General Manager</p>`),
  // Case 3: SDS and UN38.3 summary
  "3A-safety-data-sheet-voltridge-20k.pdf":
    wrap(`<h1>SAFETY DATA SHEET</h1><div class="m">Product: VoltRidge 20000mAh Portable Power Bank, model VR-20K · Issue date: 5 February 2025 · Revision 2</div>
<h2>Section 1: Identification</h2><p>Manufacturer: Ningbo Ridgeline Energy Technology Co., Ltd., 88 Yongjiang Avenue, Ningbo, Zhejiang, China. Emergency phone +86 574 5550 2210.</p>
<h2>Section 2: Hazards identification</h2><p>Lithium ion battery pack. Fire and burn hazard if damaged or short-circuited.</p>
<h2>Section 3: Composition</h2><p>Lithium-ion cells (lithium cobalt oxide), 6 cells, 74 Wh (20000 mAh, 3.7 V). UN3481.</p>
<h2>Sections 4 to 16</h2><p>First aid; firefighting; accidental release; handling and storage; exposure controls; physical and chemical properties; stability; toxicology; ecology; disposal; transport (UN3481, Class 9, packing instruction 967); regulatory; other information.</p>`),
  "3B-un38-3-test-summary-voltridge.pdf":
    wrap(`<h1>UN38.3 TEST SUMMARY</h1><div class="m">Lithium battery test summary per UN Manual of Tests and Criteria, Part III, sub-section 38.3 (rev. 6)</div>
<table><tr><td>Cell / battery manufacturer</td><td>Ningbo Ridgeline Energy Technology Co., Ltd.</td></tr><tr><td>Product / model</td><td>VR-20K, 20000 mAh portable power bank</td></tr><tr><td>Cell or battery</td><td>Battery, 6 cells</td></tr><tr><td>Watt-hours</td><td>74 Wh</td></tr><tr><td>Test laboratory</td><td>Zhejiang Battery Safety Testing Center, Ningbo (accredited CNAS L11930)</td></tr><tr><td>Test report no. / date</td><td>ZBS-2025-01877 / 24 January 2025</td></tr><tr><td>Tests T1 to T8</td><td>All passed</td></tr></table>`),
  // Case 4: UK documents
  "4A-vat-registration-certificate-hmrc.pdf":
    wrap(`<h1>Certificate of Registration for VAT</h1><div class="m">HM Revenue &amp; Customs</div>
<table><tr><td>Name</td><td>Cotswold Tea Merchants Ltd</td></tr><tr><td>Address</td><td>The Old Maltings, Church Lane, Stow-on-the-Wold, Gloucestershire GL54 1BN</td></tr><tr><td>VAT registration number</td><td>GB 412 8830 57</td></tr><tr><td>Effective date of registration</td><td>1 February 2022</td></tr></table><p class="m">Date of issue: 3 February 2022</p>`),
  "4B-bank-statement-cotswold-tea.pdf":
    wrap(`<div class="row"><div><h1>Severnside Business Bank</h1></div><div style="text-align:right">Statement date: 30 September 2026</div></div>
<div class="b" style="margin-top:20px"><b>Account holder</b><br>Cotswold Tea Merchants Ltd<br>The Old Maltings, Church Lane<br>Stow-on-the-Wold GL54 1BN<br>Sort code 40-17-22 · Account ending 6615</div>
<table><tr><th>Date</th><th>Description</th><th class="n">Amount</th></tr><tr><td>1 Sep</td><td>Opening balance</td><td class="n">£6,402.18</td></tr><tr><td>30 Sep</td><td>Closing balance</td><td class="n">£7,118.91</td></tr></table>`),
  "4C-council-tax-bill-or-utility.pdf":
    wrap(`<h1>Cotswold Water &amp; Power</h1><div class="m">Bill date: 14 September 2026</div>
<div class="b" style="margin-top:20px">Cotswold Tea Merchants Ltd<br>The Old Maltings, Church Lane<br>Stow-on-the-Wold, Gloucestershire GL54 1BN</div><table><tr><th>Charge</th><th class="n">Amount</th></tr><tr><td>Electricity 1 Aug to 31 Aug 2026</td><td class="n">£112.40</td></tr></table>`),
  // Case 5: a seller's order log
  "5A-affected-orders-log-brindle-hollow.pdf":
    wrap(`<h1>Affected orders, 22 July to 20 September 2026</h1><div class="m">Prepared by Marta Quill, owner, Brindle Hollow Pet Co. from Seller Central order reports</div>
<table><tr><th>Order ID</th><th>Product</th><th>Issue</th><th>Cause</th></tr>
<tr><td>112-4410982-7731014</td><td>Orthopedic dog bed, large</td><td>A-to-z claim: arrived flat, not fluffed, customer said "damaged"</td><td>Vacuum-packed supplier batch VB-0714 (shipped as listed; no instructions in the box)</td></tr>
<tr><td>112-8830127-4419763</td><td>Orthopedic dog bed, large</td><td>Negative feedback: smell</td><td>Same batch VB-0714</td></tr>
<tr><td>113-6120045-9982318</td><td>Cat tree, 5 ft</td><td>A-to-z claim: missing hardware bag</td><td>Packer error, week of 3 Aug (one packer short)</td></tr>
<tr><td>113-2209981-3345672</td><td>Cat tree, 5 ft</td><td>Negative feedback: wobbly</td><td>Missing bolts, same week</td></tr>
<tr><td>114-5503391-8812045</td><td>Slow-feeder bowl set</td><td>Chargeback: customer disputed card charge, parcel delivered</td><td>Delivered 6 Aug, signed by neighbour</td></tr></table>`),
};
(async () => {
  const browser = await chromium.launch();
  for (const [name, html] of Object.entries(docs)) {
    const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
    await page.setContent(html);
    await page.pdf({ path: path.join(OUT, name), format: "Letter" });
    await page.close();
    console.log("wrote", name);
  }
  await browser.close();
})();
