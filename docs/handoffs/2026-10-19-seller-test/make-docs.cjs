// Makes the invented business documents for the 19 Oct 2026 seller test.
//   node docs/handoffs/2026-10-19-seller-test/make-docs.cjs
// Every business, person and figure is invented; phones use 555 and emails end in .example.
const path = require("node:path");
const { chromium } = require("@playwright/test");

const OUT = path.join(__dirname, "docs");
const css = `body{font-family:Arial,sans-serif;color:#1c1f23;font-size:13px;margin:0}.p{padding:44px 52px}
h1{font-size:26px;margin:0 0 4px}.m{color:#5b6470}.row{display:flex;justify-content:space-between;gap:24px}
.b{border:1px solid #cfd5dc;border-radius:6px;padding:12px 14px;flex:1}table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border-bottom:1px solid #dde2e7;padding:8px 6px;text-align:left}th{background:#f1f4f7;font-size:11px;text-transform:uppercase}
.n{text-align:right}.t td{font-weight:700;border-bottom:2px solid #1c1f23}.foot{position:fixed;bottom:24px;left:52px;right:52px;font-size:10px;color:#a01818}`;
const wrap = (body) =>
  `<html><head><style>${css}</style></head><body><div class="p">${body}</div><div class="foot">Invented document for software testing. Not a real record.</div></body></html>`;

function invoice({ from, fromLines, phone, email, to, toLines, no, date, terms, lines, note }) {
  const rows = lines
    .map(
      (l) =>
        `<tr><td>${l[0]}</td><td>${l[1]}</td><td class="n">${l[2]}</td><td class="n">$${l[3].toFixed(2)}</td><td class="n">$${(l[2] * l[3]).toFixed(2)}</td></tr>`,
    )
    .join("");
  const total = lines.reduce((s, l) => s + l[2] * l[3], 0);
  return wrap(`<div class="row"><div><h1>INVOICE</h1><div class="m">Invoice no. ${no}</div></div>
<div style="text-align:right"><b>${from}</b><br>${fromLines.join("<br>")}<br>${phone}<br>${email}</div></div>
<div class="row" style="margin-top:22px"><div class="b"><div class="m">BILL TO</div><b>${to}</b><br>${toLines.join("<br>")}</div>
<div class="b"><div class="m">DETAILS</div>Invoice date: ${date}<br>Terms: ${terms}<br>Payment: ACH, received in full</div></div>
<table><tr><th>SKU</th><th>Description</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr>${rows}
<tr class="t"><td colspan="4">Total</td><td class="n">$${total.toFixed(2)}</td></tr></table>
<p class="m" style="margin-top:20px">${note}</p>`);
}

const RIDGE = {
  to: "Ridgeline Outdoor Supply LLC",
  toLines: ["88 Cottonwood Road", "Boise, ID 83702", "United States"],
};

const docs = {
  "A1-supplier-invoice-summit-peak-2026-08.pdf": invoice({
    from: "Summit Peak Wholesale Inc.",
    fromLines: ["4120 Industrial Way", "Salt Lake City, UT 84104", "United States"],
    phone: "+1 (801) 555-0148",
    email: "orders@summitpeak-wholesale.example",
    ...RIDGE,
    no: "SP-2026-08817",
    date: "2026-08-14",
    terms: "Net 15",
    lines: [
      ["TH-T3-GRN", "Trailhead 3-Person Backpacking Tent, green", 120, 74.5],
      ["TH-FP-3", "Trailhead Footprint Groundsheet for 3-person tent", 120, 11.25],
    ],
    note: "Authorized distributor of Trailhead Gear Co. products in the Mountain West. Goods shipped from our Salt Lake City warehouse on 2026-08-15.",
  }),
  "A2-supplier-invoice-STALE-2025-05.pdf": invoice({
    from: "Summit Peak Wholesale Inc.",
    fromLines: ["4120 Industrial Way", "Salt Lake City, UT 84104", "United States"],
    phone: "+1 (801) 555-0148",
    email: "orders@summitpeak-wholesale.example",
    ...RIDGE,
    no: "SP-2025-04311",
    date: "2025-05-06",
    terms: "Net 15",
    lines: [["TH-T3-GRN", "Trailhead 3-Person Backpacking Tent, green", 60, 71.0]],
    note: "Goods shipped 2025-05-07.",
  }),
  "A3-brand-letter-trailhead-authorizing-summit-peak.pdf": wrap(`<h1>Trailhead Gear Co.</h1><div class="m">1900 Alder Street, Portland, OR 97209 · +1 (503) 555-0133</div>
<p style="margin-top:24px">1 July 2026</p><p><b>To whom it may concern</b></p>
<p>Trailhead Gear Co. confirms that Summit Peak Wholesale Inc., 4120 Industrial Way, Salt Lake City, UT 84104, is an authorized distributor of Trailhead-branded tents and accessories in the United States, effective 1 January 2024 and continuing until further notice.</p>
<p>Retailers who buy from Summit Peak Wholesale Inc. are buying genuine Trailhead products. Questions can be sent to dealers@trailheadgear.example.</p>
<p style="margin-top:36px">Dana Whitfield<br>Director of Distribution, Trailhead Gear Co.</p>`),

  "B1-carrier-pickup-delays-summary.pdf": wrap(`<h1>Carrier performance summary</h1><div class="m">Pinecrest Pet Supply Inc. · 15 Sept to 8 Oct 2026 · prepared by the warehouse lead, Tomas Reyes</div>
<table><tr><th>Week starting</th><th class="n">Orders</th><th class="n">Shipped late</th><th class="n">Late %</th><th>Main reason</th></tr>
<tr><td>15 Sep</td><td class="n">212</td><td class="n">9</td><td class="n">4.2%</td><td>Normal</td></tr>
<tr><td>22 Sep</td><td class="n">248</td><td class="n">21</td><td class="n">8.5%</td><td>Packer on leave, no cover</td></tr>
<tr><td>29 Sep</td><td class="n">301</td><td class="n">27</td><td class="n">9.0%</td><td>Autumn promotion, cut-off 3pm missed</td></tr>
<tr><td>6 Oct</td><td class="n">96</td><td class="n">8</td><td class="n">8.3%</td><td>Same</td></tr></table>
<p class="m">Valid tracking fell because 41 parcels were sent with the carrier's drop-box label scanned the next morning, so the first scan showed after the promised date.</p>`),

  "C1-distributor-invoice-atlantic-kitchen.pdf": invoice({
    from: "Atlantic Kitchen Distribution LLC",
    fromLines: ["27 Harbor Freight Road", "Providence, RI 02905", "United States"],
    phone: "+1 (401) 555-0126",
    email: "sales@atlantickitchen-dist.example",
    to: "Harbor & Pine Kitchenware",
    toLines: ["19 Wharf Street, Unit 3", "Portland, ME 04101", "United States"],
    no: "AKD-60492",
    date: "2026-09-02",
    terms: "Net 30",
    lines: [["VEL-ACA-12", "Vellmore 12-inch Acacia Cutting Board", 96, 14.8]],
    note: "Vellmore Brands LLC authorized dealer account no. VB-7714. Shipped 2026-09-03 from Providence.",
  }),
  "C2-letter-of-authorization-vellmore.pdf": wrap(`<h1>Vellmore Brands LLC</h1><div class="m">500 Mill Street, Providence, RI 02903 · legal@vellmorebrands.example</div>
<p style="margin-top:24px">22 January 2026</p><p><b>Authorized distributor confirmation</b></p>
<p>Vellmore Brands LLC confirms that Atlantic Kitchen Distribution LLC, 27 Harbor Freight Road, Providence, RI 02905 (dealer account VB-7714), is an authorized distributor of Vellmore-branded kitchenware, including the 12-inch Acacia Cutting Board (item VEL-ACA-12), and may resell to retailers.</p>
<p>This confirmation is valid until 31 December 2026.</p>
<p style="margin-top:36px">Priya Nambiar<br>Head of Channel Partners, Vellmore Brands LLC</p>`),
};

(async () => {
  const browser = await chromium.launch();
  for (const [name, html] of Object.entries(docs)) {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: path.join(OUT, name), format: "Letter" });
    await page.close();
    console.log("wrote", name);
  }
  await browser.close();
})();
