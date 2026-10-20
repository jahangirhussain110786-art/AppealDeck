// Invented documents for the live sessions of 20 Oct 2026, the kind a small, confused seller really
// has: a design-tool subscription receipt offered as a licence, and a clipart purchase whose own
// terms allow personal use only. Same rules as make-docs.cjs: every page says it is invented.
const path = require("node:path");
const { chromium } = require("@playwright/test");
const OUT = path.join(__dirname, "docs");
const css = `body{font-family:Arial,sans-serif;color:#1c1f23;font-size:13px;margin:0}.p{padding:44px 52px}
h1{font-size:22px;margin:0 0 4px}.m{color:#5b6470}table{width:100%;border-collapse:collapse;margin-top:14px}
th,td{border-bottom:1px solid #dde2e7;padding:7px 6px;text-align:left}.n{text-align:right}
.foot{position:fixed;bottom:24px;left:52px;right:52px;font-size:10px;color:#a01818}.box{border:1px solid #cfd5dc;padding:10px 12px;margin-top:14px}`;
const wrap = (b) =>
  `<html><head><style>${css}</style></head><body><div class="p">${b}</div><div class="foot">Invented document for software testing. Not a real record.</div></body></html>`;

const docs = {
  "M1A-design-tool-subscription-receipt.pdf": wrap(`<h1>Receipt</h1><div class="m">Brightcanvas Design Studio</div>
<p>Receipt no. BC-77302114<br>Date: 2 March 2026<br>Billed to: Rosa Delgado, rosa.delgado@example.com</p>
<table><tr><th>Item</th><th class="n">Amount</th></tr>
<tr><td>Brightcanvas Pro, annual subscription (1 seat)</td><td class="n">$119.99</td></tr>
<tr><td>Total paid (Visa ending 4417)</td><td class="n"><b>$119.99</b></td></tr></table>
<p class="m">Thank you for your purchase. Subscription renews 2 March 2027.</p>`),
  "M1B-clipart-bundle-order-receipt.pdf": wrap(`<h1>Order receipt</h1><div class="m">Order #3318772041, Pixel &amp; Petal Shop</div>
<p>Order date: 14 November 2025<br>Buyer: Rosa D.</p>
<table><tr><th>Item</th><th class="n">Price</th></tr>
<tr><td>Floral Paw Clipart Bundle, 24 PNG files (digital download)</td><td class="n">$4.99</td></tr></table>
<div class="box"><b>Licence terms</b><br>Personal use only. You may print this artwork for yourself, for gifts and for personal projects.
Commercial use, resale of the artwork or of products carrying it, and redistribution require a commercial licence, sold separately.</div>`),
  "M1C-design-sketch-notes-photo.pdf": wrap(`<h1 style="font-family:cursive">my paw coaster ideas</h1><p class="m">(photo of a notebook page, undated)</p>
<p>flower + paw print, resin, gold flakes, 4 coasters, try cat and dog versions</p>`),
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, html] of Object.entries(docs)) {
    await page.setContent(html);
    await page.pdf({ path: path.join(OUT, name), format: "Letter", printBackground: true });
    console.log("wrote", name);
  }
  await browser.close();
})();

// Session 2 (20 Oct 2026): a seller with partial and wrong documents.
const inv = (o) =>
  wrap(`<h1>${o.title}</h1><div class="m">No. ${o.no}</div>
<p><b>${o.from}</b><br>${o.fromLines}<br>${o.contact}</p>
<p>Bill to: <b>${o.to}</b><br>${o.toLines}</p><p>Date: ${o.date}</p>
<table><tr><th>Item</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Total</th></tr>${o.rows}</table>${o.extra ?? ""}`);
const more = {
  "M2A-proforma-invoice-forgepoint-supply.pdf": inv({
    title: "PRO FORMA INVOICE",
    no: "PF-20881",
    from: "Ridgeway Tool Wholesale LLC",
    fromLines: "9 Commerce Way, Dayton, OH 45402",
    contact: "937 555 0118 | orders@ridgewaytool.example",
    to: "Northline Hardware Supply LLC",
    toLines: "77 Gaskill Street, Toledo, OH 43604",
    date: "11 September 2026",
    rows: `<tr><td>Forgepoint 20V cordless drill kit FP-D20</td><td class="n">48</td><td class="n">$61.00</td><td class="n">$2,928.00</td></tr>`,
    extra: `<p class="m">This is a quotation and not a request for payment. Goods ship after payment is received.</p>`,
  }),
  "M2B-invoice-billed-to-owner-personally.pdf": inv({
    title: "INVOICE",
    no: "RTW-77421",
    from: "Ridgeway Tool Wholesale LLC",
    fromLines: "9 Commerce Way, Dayton, OH 45402",
    contact: "937 555 0118 | orders@ridgewaytool.example",
    to: "Marcus Webb",
    toLines: "14 Linden Court, Toledo, OH 43615",
    date: "29 September 2026",
    rows: `<tr><td>Forgepoint 20V cordless drill kit FP-D20</td><td class="n">24</td><td class="n">$61.00</td><td class="n">$1,464.00</td></tr>`,
    extra: `<p class="m">Paid by card. Thank you for your order.</p>`,
  }),
};
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, html] of Object.entries(more)) {
    await page.setContent(html);
    await page.pdf({ path: path.join(OUT, name), format: "Letter", printBackground: true });
    console.log("wrote", name);
  }
  await browser.close();
})();
