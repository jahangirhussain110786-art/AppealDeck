// Invented documents for cases D, E and F (19 Oct 2026). Same rules as make-docs.cjs.
const path = require("node:path");
const { chromium } = require("@playwright/test");

const OUT = path.join(__dirname, "docs");
const css = `body{font-family:Arial,sans-serif;color:#1c1f23;font-size:13px;margin:0}.p{padding:44px 52px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px}.m{color:#5b6470}.row{display:flex;justify-content:space-between;gap:24px}
.b{border:1px solid #cfd5dc;border-radius:6px;padding:12px 14px;flex:1}table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border-bottom:1px solid #dde2e7;padding:7px 6px;text-align:left}th{background:#f1f4f7;font-size:11px;text-transform:uppercase}
.n{text-align:right}.foot{position:fixed;bottom:24px;left:52px;right:52px;font-size:10px;color:#a01818}`;
const wrap = (body) =>
  `<html><head><style>${css}</style></head><body><div class="p">${body}</div><div class="foot">Invented document for software testing. Not a real record.</div></body></html>`;

const docs = {
  "D1-childrens-product-certificate.pdf":
    wrap(`<h1>Children's Product Certificate (CPC)</h1><div class="m">Issued under the Consumer Product Safety Act, section 14</div>
<h2>Product</h2><p>Northwind Pop-Up Play Tent for Kids, 48-inch. Model NW-TENT-48. ASIN B0D5N7K2WX. Intended age group: 3 to 8 years.</p>
<h2>Applicable rules</h2><p>ASTM F963-23 (toy safety); 16 CFR 1303 (lead in paint and surface coatings); 16 CFR 1501 (small parts); 16 CFR Part 1610 (flammability of clothing textiles, as applicable to fabric).</p>
<h2>Importer / manufacturer</h2><p>Northwind Kids Co., 740 Orchard Court, Denver, CO 80205, United States. Phone +1 (303) 555-0194. Contact: Elena Brandt, Compliance Manager.</p>
<h2>Manufacturer of the product</h2><p>Hangzhou Little Star Textiles Co., Ltd., 18 Qianjiang Road, Hangzhou, Zhejiang, China.</p>
<h2>Date and place of manufacture</h2><p>2 June 2026, Hangzhou, China. Batch NW48-0626-A.</p>
<h2>Testing</h2><p>Tested by Pacific Rim Product Testing Lab (CPSC-accepted laboratory no. 1337), report PRL-2026-77431 dated 24 June 2026.</p>
<p style="margin-top:28px">Certified by Elena Brandt, 1 July 2026</p>`),
  "D2-lab-test-report-astm-f963.pdf":
    wrap(`<h1>Pacific Rim Product Testing Lab</h1><div class="m">CPSC-accepted laboratory no. 1337 · 4410 Harbor Drive, Long Beach, CA 90802 · +1 (562) 555-0121</div>
<h2>Test report PRL-2026-77431</h2><p>Report date: 24 June 2026. Client: Northwind Kids Co., 740 Orchard Court, Denver, CO 80205.</p>
<p>Sample: Northwind Pop-Up Play Tent for Kids, 48-inch, model NW-TENT-48, batch NW48-0626-A, received 12 June 2026.</p>
<table><tr><th>Standard / rule</th><th>Test</th><th>Result</th></tr>
<tr><td>ASTM F963-23</td><td>Mechanical and physical (sharp edges, points, small parts)</td><td>Pass</td></tr>
<tr><td>ASTM F963-23</td><td>Flammability of toys</td><td>Pass</td></tr>
<tr><td>ASTM F963-23</td><td>Heavy elements in substrate and surface coatings</td><td>Pass</td></tr>
<tr><td>16 CFR 1303</td><td>Lead in paint and surface coatings (limit 90 ppm)</td><td>Pass: 12 ppm</td></tr>
<tr><td>16 CFR 1501</td><td>Small parts</td><td>Pass</td></tr></table>
<p class="m" style="margin-top:20px">Results relate only to the sample tested. Signed: R. Okafor, Laboratory Manager.</p>`),
  "D3-label-photo-tracking-label.png":
    "html:" +
    wrap(`<div style="width:520px;border:3px solid #1c1f23;padding:18px;margin:30px auto"><h1>Northwind Pop-Up Play Tent</h1>
<p><b>Ages 3 to 8.</b> Model NW-TENT-48 · 48-inch</p><p>Manufacturer: Hangzhou Little Star Textiles Co., Ltd., Hangzhou, China</p>
<p>Imported by Northwind Kids Co., 740 Orchard Court, Denver, CO 80205</p><p>Date of manufacture: 2 June 2026 · Batch / lot: NW48-0626-A</p>
<p>WARNING: Adult supervision recommended. Keep away from fire.</p></div>`),

  "E1-statement-former-partner-closure.pdf":
    wrap(`<h1>Statement of Marcus Telford</h1><div class="m">Former co-owner, Wickwood Home Co.</div>
<p style="margin-top:20px">8 October 2026</p>
<p>I co-founded Wickwood Home Co. with Priya Anand in 2023. I left the business and resigned as a director on 30 April 2025. I have had no ownership in, access to, or involvement with the Amazon seller account of Wickwood Home Co. or any other business of Ms Anand since that date.</p>
<p>From 2023 to April 2025 I worked from the same shared office, the Riverside Workspace at 12 Mill Street, Asheville, NC 28801. Ms Anand's current business, Cedar Lane Candles LLC, rents a desk in the same building, which is the likely reason for the shared IP address.</p>
<p>The Wickwood Home Co. bank account ending 4417 was closed on 15 May 2025 (closure letter attached to the dissolution papers). I have never had access to the Cedar Lane Candles bank account.</p>
<p style="margin-top:28px">Marcus Telford, 8 October 2026</p>`),
  "E2-dissolution-wickwood-home-co.pdf":
    wrap(`<h1>Articles of Dissolution</h1><div class="m">State of North Carolina, Department of the Secretary of State</div>
<p style="margin-top:18px">Entity: Wickwood Home Co. LLC (SOSID 2381147)</p><p>The limited liability company named above was administratively dissolved effective 20 May 2025 on the filing of Articles of Dissolution by its remaining member.</p>
<p>The company's bank account (ending 4417) was closed on 15 May 2025 and the Amazon seller account associated with it was closed by the company on 22 May 2025.</p>
<p class="m" style="margin-top:20px">Filed 20 May 2025. Certified copy issued 2 October 2026.</p>`),
  "E3-utility-bill-cedar-lane-candles.pdf":
    wrap(`<div class="row"><div><h1>Blue Ridge Power &amp; Light</h1><div class="m">Account statement</div></div><div style="text-align:right">Statement date: 1 October 2026</div></div>
<div class="b" style="margin-top:20px"><b>Service address</b><br>Cedar Lane Candles LLC<br>Unit 4, 31 Hawthorn Road<br>Asheville, NC 28803<br>United States</div>
<table><tr><th>Description</th><th class="n">Amount</th></tr><tr><td>Electricity, 1 Sep to 30 Sep 2026</td><td class="n">$86.40</td></tr><tr><td>Taxes and fees</td><td class="n">$6.12</td></tr><tr><td><b>Total due 21 October 2026</b></td><td class="n"><b>$92.52</b></td></tr></table>`),

  "F1-bank-statement-maple-birch-textiles.pdf":
    wrap(`<div class="row"><div><h1>Lakeshore Community Bank</h1><div class="m">Business checking statement</div></div><div style="text-align:right">Statement period: 1 Sep to 30 Sep 2026<br>Statement date: 1 October 2026</div></div>
<div class="b" style="margin-top:20px"><b>Account holder</b><br>Maple &amp; Birch Textiles LLC<br>58 Linden Avenue, Suite 2<br>Burlington, VT 05401<br>Account number ending 6082</div>
<table><tr><th>Date</th><th>Description</th><th class="n">Amount</th></tr>
<tr><td>3 Sep</td><td>Opening balance</td><td class="n">$4,218.07</td></tr>
<tr><td>9 Sep</td><td>Deposit, wholesale customer</td><td class="n">$1,950.00</td></tr>
<tr><td>18 Sep</td><td>Payment, Green Valley Mills (yarn)</td><td class="n">-$2,311.40</td></tr>
<tr><td>30 Sep</td><td>Closing balance</td><td class="n">$3,856.67</td></tr></table>`),
};

(async () => {
  const browser = await chromium.launch();
  for (const [name, html] of Object.entries(docs)) {
    const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
    await page.setContent(html.replace(/^html:/, ""));
    if (name.endsWith(".png"))
      await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    else await page.pdf({ path: path.join(OUT, name), format: "Letter" });
    await page.close();
    console.log("wrote", name);
  }
  await browser.close();
})();
