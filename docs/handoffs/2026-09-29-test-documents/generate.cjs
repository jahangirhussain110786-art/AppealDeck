// Generates the test documents in this folder (29 Sep 2026).
//
//   node docs/handoffs/2026-09-29-test-documents/generate.cjs
//
// Every business, person, bank, lab and address here is invented; phone numbers use 555 and email
// domains end in .example. Every file carries "TEST DOCUMENT" so it can never pass for a real
// record. They exist to test uploading and the document checks, nothing else.

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const OUT = __dirname;

const SELLER = {
  name: "Brightwater Home Goods LLC",
  lines: ["214 Juniper Lane, Suite 5", "Austin, TX 78701", "United States"],
  phone: "+1 (512) 555-0172",
  email: "accounts@brightwater-home.example",
};

const MARK = "TEST DOCUMENT — NOT VALID";
const FOOT =
  "Test document made for AppealDeck. The business, people and figures are invented. Never submit it to Amazon or anyone else.";

const css = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1c1f23; font-size: 13px; }
  .page { padding: 44px 52px 90px; }
  h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: 0.5px; }
  h2 { font-size: 15px; margin: 22px 0 8px; }
  .muted { color: #5b6470; }
  .row { display: flex; justify-content: space-between; gap: 24px; }
  .box { border: 1px solid #cfd5dc; border-radius: 6px; padding: 12px 14px; flex: 1; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #5b6470; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border-bottom: 1px solid #dde2e7; padding: 8px 6px; text-align: left; vertical-align: top; }
  th { background: #f1f4f7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td.n, th.n { text-align: right; white-space: nowrap; }
  .total td { font-weight: 700; border-bottom: 2px solid #1c1f23; }
  .wm { position: fixed; top: 42%; left: 0; right: 0; text-align: center; transform: rotate(-28deg);
        font-size: 42px; font-weight: 800; color: rgba(190, 20, 20, 0.13); letter-spacing: 2px; white-space: nowrap; }
  .foot { position: fixed; bottom: 26px; left: 52px; right: 52px; border-top: 1px solid #e3c0c0;
          padding-top: 6px; font-size: 10px; color: #a01818; }
  .sig { font-family: "Segoe Script", "Brush Script MT", cursive; font-size: 26px; margin: 18px 0 2px; }
  .stamp { display: inline-block; border: 3px solid #1f7a3a; color: #1f7a3a; font-weight: 800;
           padding: 6px 14px; border-radius: 6px; transform: rotate(-6deg); font-size: 18px; }
`;

const page = (
  title,
  body,
) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>${css}</style></head><body><div class="wm">${MARK}</div><div class="page">${body}</div>
<div class="foot">${FOOT}</div></body></html>`;

const address = (p) =>
  `<strong>${p.name}</strong><br>${p.lines.join("<br>")}${p.phone ? `<br>${p.phone}` : ""}${p.email ? `<br>${p.email}` : ""}`;

const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function invoice({
  heading,
  supplier,
  number,
  date,
  extra = [],
  buyer = SELLER,
  items,
  shipping,
  status,
}) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const rows = items
    .map(
      (
        i,
      ) => `<tr><td>${i.sku}</td><td>${i.desc}${i.asin ? `<br><span class="muted">ASIN ${i.asin}</span>` : ""}</td>
      <td class="n">${i.qty}</td><td class="n">${money(i.price)}</td><td class="n">${money(i.qty * i.price)}</td></tr>`,
    )
    .join("");
  return page(
    heading,
    `<div class="row"><div><h1>${heading}</h1><div class="muted">${supplier.name}</div></div>
      <div style="text-align:right;white-space:nowrap"><div><strong>No.</strong> ${number}</div><div><strong>Date:</strong> ${date}</div>
      ${extra.map((e) => `<div>${e}</div>`).join("")}</div></div>
    <div class="row" style="margin-top:22px">
      <div class="box"><div class="label">From (supplier)</div>${address(supplier)}</div>
      <div class="box"><div class="label">Bill to</div>${address(buyer)}</div>
    </div>
    <table><tr><th>Item</th><th>Description</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr>
      ${rows}
      <tr><td colspan="4" class="n">Subtotal</td><td class="n">${money(subtotal)}</td></tr>
      <tr><td colspan="4" class="n">Shipping</td><td class="n">${money(shipping)}</td></tr>
      <tr class="total"><td colspan="4" class="n">Total (USD)</td><td class="n">${money(subtotal + shipping)}</td></tr>
    </table>
    <h2>Payment</h2><p>${status}</p>`,
  );
}

const HARBOR = {
  name: "Harbor Goods Wholesale Ltd",
  lines: ["88 Dockside Road", "Newark, NJ 07105", "United States"],
  phone: "+1 (201) 555-0148",
  email: "orders@harborgoods.example",
};
const CRESTLINE = {
  name: "Crestline Trade Supply Co.",
  lines: ["1450 Industrial Parkway, Unit 12", "Columbus, OH 43219", "United States"],
  phone: "+1 (614) 555-0193",
  email: "sales@crestline-supply.example",
};

const PDFS = {
  "01-supplier-invoice-sample-notice.pdf": invoice({
    heading: "INVOICE",
    supplier: HARBOR,
    number: "HGW-2026-0714",
    date: "14 July 2026",
    extra: ["<strong>Your PO:</strong> PO-BW-2291"],
    items: [
      {
        sku: "J-104",
        desc: "Stainless steel insulated water bottle, 750 ml, new in sealed box",
        asin: "B0EXAMPLE1",
        qty: 40,
        price: 6.2,
      },
      { sku: "J-105", desc: "Replacement lid for J-104, new", qty: 40, price: 0.9 },
    ],
    shipping: 22,
    status: "Paid in full by bank transfer on 16 July 2026. Reference HGW-2026-0714.",
  }),
  "02-order-and-complaint-log-sample-notice.pdf": page(
    "Order and complaint log",
    `<h1>Order and complaint log</h1><div class="muted">${SELLER.name} · ASIN B0EXAMPLE1 (J-104 water bottle) · 1 June to 31 August 2026 · from our own order records</div>
    <table><tr><th>Order</th><th>Date</th><th class="n">Units</th><th>Condition shipped</th><th>Complaint</th><th>How it was resolved</th></tr>
      <tr><td>112-4830291-5520134</td><td>04 Jun 2026</td><td class="n">1</td><td>New, sealed</td><td>None</td><td>—</td></tr>
      <tr><td>112-7719402-1184420</td><td>19 Jun 2026</td><td class="n">2</td><td>Returned unit resold as new</td><td>"Received a used bottle"</td><td>Full refund and a new unit sent, 21 Jun 2026</td></tr>
      <tr><td>113-0092184-6631207</td><td>02 Jul 2026</td><td class="n">1</td><td>New, sealed</td><td>None</td><td>—</td></tr>
      <tr><td>114-5518820-9902314</td><td>28 Jul 2026</td><td class="n">1</td><td>Returned unit resold as new</td><td>"Scratches, box opened"</td><td>Full refund, customer kept the item, 29 Jul 2026</td></tr>
      <tr><td>111-3390147-2275861</td><td>15 Aug 2026</td><td class="n">3</td><td>New, sealed</td><td>None</td><td>—</td></tr>
    </table>
    <h2>Summary</h2><p>5 orders, 8 units. 2 complaints, both traced to returned units put back on sale as new; both refunded within two days. Since 20 September 2026 every return is inspected and sold only as used, or disposed of.</p>`,
  ),
  "03-supplier-invoice-t01-authenticity.pdf": invoice({
    heading: "INVOICE",
    supplier: CRESTLINE,
    number: "CTS-58213",
    date: "3 June 2026",
    extra: ["<strong>Terms:</strong> Net 15"],
    items: [
      {
        sku: "BB-3S",
        desc: "Bamboo cutting board set, 3 pieces",
        asin: "B07KJ3M8QA",
        qty: 120,
        price: 7.4,
      },
      {
        sku: "SU-12",
        desc: "Silicone kitchen utensil set, 12 pieces",
        asin: "B08RT2N6LX",
        qty: 80,
        price: 9.15,
      },
    ],
    shipping: 65,
    status: "Paid in full by bank transfer on 12 June 2026.",
  }),
  "04-supplier-invoice-WITH-PROBLEMS.pdf": invoice({
    heading: "PRO FORMA INVOICE — QUOTATION",
    supplier: {
      name: "Quickdeal Sourcing",
      lines: ["(no address given)"],
      email: "quickdeal.sourcing@mail.example",
    },
    buyer: { name: "B. Water Trading", lines: ["Austin, TX"] },
    number: "Q-0311",
    date: "11 March 2024",
    extra: ["<strong>Valid for:</strong> 30 days"],
    items: [
      {
        sku: "LOT",
        desc: "Assorted kitchen items, mixed lot, condition not stated",
        qty: 1,
        price: 950,
      },
    ],
    shipping: 0,
    status: "Not paid. This is a quotation, not a record of a sale.",
  }),
  "05-letter-of-authorization-t03.pdf": page(
    "Letter of authorization",
    `<div class="row"><div><h1>Northfield Outdoor Gear LLC</h1><div class="muted">77 Pinecrest Avenue, Burlington, VT 05401, United States · legal@northfield-outdoor.example · +1 (802) 555-0131</div></div></div>
    <p style="margin-top:28px">2 September 2026</p>
    <h2>Letter of authorization</h2>
    <p>To whom it may concern,</p>
    <p>Northfield Outdoor Gear LLC, owner of United States trademark registration no. 5123456 (NORTHFIELD), authorizes
    <strong>${SELLER.name}</strong>, ${SELLER.lines.join(", ")}, to sell genuine Northfield products on Amazon.com, including
    ASIN <strong>B09WQ4ZP7C</strong> (Northfield Ridgeline 2-person trekking tent).</p>
    <p>${SELLER.name} buys these products from Summit Ridge Distribution Inc., an authorized Northfield distributor.</p>
    <p>This authorization is valid from 2 September 2026 to 31 August 2027. Complaint ID 11223344556 was sent in error, and we have asked Amazon to withdraw it.</p>
    <div class="sig">Dana Whitfield</div><div>Dana Whitfield, Brand Protection Manager</div><div class="muted">Northfield Outdoor Gear LLC</div>`,
  ),
  "06-lab-test-report-t07.pdf": page(
    "Test report",
    `<div class="row"><div><h1>Test report</h1><div class="muted">Meridian Test Laboratories · 5 Foundry Street, San Jose, CA 95112 · ISO/IEC 17025 accreditation no. AC-TEST-00417</div></div>
      <div style="text-align:right;white-space:nowrap"><div><strong>Report no.</strong> MTL-2026-08-3316</div><div><strong>Issued:</strong> 22 August 2026</div></div></div>
    <div class="row" style="margin-top:22px">
      <div class="box"><div class="label">Product</div><strong>20W USB-C wall charger</strong><br>Model BW-C20<br>ASIN B0CX9L4TQ2</div>
      <div class="box"><div class="label">Manufacturer</div>Shenlan Power Electronics Co., Ltd.<br>Building 3, 18 Kexing Road, Shenzhen, China</div>
      <div class="box"><div class="label">Applicant</div>${address(SELLER)}</div>
    </div>
    <h2>Standard: UL 62368-1, 3rd edition</h2>
    <table><tr><th>Clause</th><th>Test</th><th>Result</th><th>Verdict</th></tr>
      <tr><td>5.4.9</td><td>Electric strength</td><td>3000 V AC, 60 s, no breakdown</td><td>Pass</td></tr>
      <tr><td>5.4.1.4</td><td>Temperature rise, full load 20 W, 25 °C ambient</td><td>Cable surface max 41.6 °C; enclosure max 58.2 °C (limit 77 °C)</td><td>Pass</td></tr>
      <tr><td>B.3</td><td>Abnormal operation: output short circuit</td><td>Protection tripped, no fire, no hazard</td><td>Pass</td></tr>
      <tr><td>Annex Q</td><td>Limited power source</td><td>Within limits</td><td>Pass</td></tr>
    </table>
    <h2>Conclusion</h2><p>The sample tested complies with UL 62368-1, 3rd edition. Samples received 8 August 2026; tested 11 to 19 August 2026.</p>
    <div class="sig">R. Okafor</div><div>Rachel Okafor, Technical Manager</div>`,
  ),
  "07-certificate-of-compliance-t07.pdf": page(
    "Certificate of compliance",
    `<div style="text-align:center"><h1>Certificate of Compliance</h1><div class="muted">Certificate no. BW-COC-2026-017 · Issued 25 August 2026</div></div>
    <table style="margin-top:26px">
      <tr><th style="width:32%">Product</th><td>20W USB-C wall charger, model BW-C20 (ASIN B0CX9L4TQ2)</td></tr>
      <tr><th>Manufacturer</th><td>Shenlan Power Electronics Co., Ltd., Building 3, 18 Kexing Road, Shenzhen, China</td></tr>
      <tr><th>Importer</th><td>${SELLER.name}, ${SELLER.lines.join(", ")}, ${SELLER.phone}</td></tr>
      <tr><th>Safety standard</th><td>UL 62368-1, 3rd edition</td></tr>
      <tr><th>Test report</th><td>Meridian Test Laboratories report MTL-2026-08-3316, 22 August 2026 (ISO/IEC 17025 accredited)</td></tr>
      <tr><th>Production batch</th><td>Batch 2026-07-B, manufactured July 2026, 1,200 units</td></tr>
    </table>
    <p style="margin-top:22px">We certify that the product above complies with the listed safety standard, based on the test report named above.</p>
    <div class="sig">M. Reyes</div><div>Marta Reyes, Compliance Lead, ${SELLER.name}</div>`,
  ),
  "10-bank-statement-t06.pdf": page(
    "Bank statement",
    `<div class="row"><div><h1>Riverside Federal Bank</h1><div class="muted">Business checking statement</div></div>
      <div style="text-align:right;white-space:nowrap"><div><strong>Statement period:</strong> 1 to 31 August 2026</div><div><strong>Account:</strong> ending 4821</div></div></div>
    <div class="row" style="margin-top:22px"><div class="box"><div class="label">Account holder</div>${address({ ...SELLER, phone: "", email: "" })}</div>
      <div class="box"><div class="label">Summary</div>Opening balance ${money(18240.55)}<br>Money in ${money(9612.4)}<br>Money out ${money(7325.18)}<br><strong>Closing balance ${money(20527.77)}</strong></div></div>
    <table><tr><th>Date</th><th>Description</th><th class="n">Money in</th><th class="n">Money out</th><th class="n">Balance</th></tr>
      <tr><td>03 Aug</td><td>Marketplace disbursement</td><td class="n">${money(4812.3)}</td><td></td><td class="n">${money(23052.85)}</td></tr>
      <tr><td>06 Aug</td><td>Transfer to Harbor Goods Wholesale Ltd</td><td></td><td class="n">${money(306)}</td><td class="n">${money(22746.85)}</td></tr>
      <tr><td>12 Aug</td><td>Warehouse rent, Juniper Lane</td><td></td><td class="n">${money(2150)}</td><td class="n">${money(20596.85)}</td></tr>
      <tr><td>17 Aug</td><td>Marketplace disbursement</td><td class="n">${money(4800.1)}</td><td></td><td class="n">${money(25396.95)}</td></tr>
      <tr><td>21 Aug</td><td>Transfer to Crestline Trade Supply Co.</td><td></td><td class="n">${money(4869.18)}</td><td class="n">${money(20527.77)}</td></tr>
    </table>`,
  ),
};

// Photos: the case checks identity and proof-of-address pictures on the device for size, focus,
// lighting and framing, so these are real photographs in shape: an object on a textured surface.
const surface = (base, a, b) =>
  `background-color:${base};background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/><feColorMatrix values='0 0 0 0 ${a} 0 0 0 0 ${b} 0 0 0 0 0.18 0 0 0 0.85 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"),repeating-linear-gradient(88deg,rgba(0,0,0,.08) 0 3px,transparent 3px 19px);`;

const photo = (w, h, bg, body, extra = "") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:${w}px;height:${h}px;${bg}display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;${extra}}</style></head><body>${body}</body></html>`;

const idCard = (
  size,
) => `<div style="width:${856 * size}px;height:${540 * size}px;border-radius:${28 * size}px;background:linear-gradient(135deg,#dfe8ee,#c9d6df);box-shadow:0 ${18 * size}px ${40 * size}px rgba(0,0,0,.45);padding:${30 * size}px ${36 * size}px;position:relative;color:#16202a;transform:rotate(-3deg)">
  <div style="font-size:${30 * size}px;font-weight:800;letter-spacing:${2 * size}px">TEST IDENTITY CARD</div>
  <div style="font-size:${17 * size}px;color:#8a1111;font-weight:700;margin-top:${4 * size}px">SPECIMEN · NOT ISSUED BY ANY GOVERNMENT · NOT VALID</div>
  <div style="display:flex;gap:${30 * size}px;margin-top:${26 * size}px">
    <div style="width:${190 * size}px;height:${240 * size}px;border-radius:${10 * size}px;background:#9fb2c1;position:relative;overflow:hidden">
      <div style="position:absolute;left:50%;top:${40 * size}px;width:${90 * size}px;height:${90 * size}px;margin-left:${-45 * size}px;border-radius:50%;background:#5f7587"></div>
      <div style="position:absolute;left:50%;top:${140 * size}px;width:${160 * size}px;height:${160 * size}px;margin-left:${-80 * size}px;border-radius:50%;background:#5f7587"></div></div>
    <div style="font-size:${20 * size}px;line-height:1.55">
      <div style="font-size:${13 * size}px;color:#4c5a66">SURNAME</div><div style="font-weight:700">SAMPLE</div>
      <div style="font-size:${13 * size}px;color:#4c5a66">GIVEN NAMES</div><div style="font-weight:700">ALEX JORDAN</div>
      <div style="font-size:${13 * size}px;color:#4c5a66">DATE OF BIRTH</div><div>01 JAN 1990</div>
      <div style="font-size:${13 * size}px;color:#4c5a66">DOCUMENT NO.</div><div style="font-family:Consolas,monospace">TEST-0000-0000</div>
      <div style="font-size:${13 * size}px;color:#4c5a66">EXPIRES</div><div>31 DEC 2030</div></div></div>
  <div style="position:absolute;bottom:${20 * size}px;left:${36 * size}px;right:${36 * size}px;font-family:Consolas,monospace;font-size:${17 * size}px;letter-spacing:${2 * size}px;color:#33424f">TEST&lt;&lt;SAMPLE&lt;&lt;ALEX&lt;JORDAN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div></div>`;

const IMAGES = {
  "08-product-photo-t07.jpg": [
    1600,
    1200,
    photo(
      1600,
      1200,
      surface("#7b7f86", "0.52", "0.54"),
      `<div style="display:flex;gap:90px;align-items:flex-end;transform:rotate(-2deg)">
        <div style="width:520px;height:640px;background:linear-gradient(160deg,#f3f5f7,#d9dee3);border-radius:16px;box-shadow:0 26px 50px rgba(0,0,0,.45);padding:44px">
          <div style="font-size:26px;letter-spacing:3px;color:#1f5f99;font-weight:800">BRIGHTWATER</div>
          <div style="font-size:54px;font-weight:800;margin-top:60px;color:#16202a">20W</div>
          <div style="font-size:30px;color:#16202a">USB-C wall charger</div>
          <div style="font-size:22px;color:#4c5a66;margin-top:14px">Model BW-C20</div>
          <div style="margin:70px auto 0;width:210px;height:250px;background:#fbfbfb;border-radius:26px;box-shadow:inset 0 -12px 20px rgba(0,0,0,.08),0 10px 20px rgba(0,0,0,.2)"></div>
          <div style="font-size:15px;color:#8a1111;margin-top:34px;font-weight:700">TEST IMAGE — NOT A REAL PRODUCT</div></div>
        <div style="position:relative;width:260px;height:320px;background:linear-gradient(180deg,#fdfdfd,#e6e9ec);border-radius:34px;box-shadow:0 20px 40px rgba(0,0,0,.5)">
          <div style="position:absolute;top:-70px;left:70px;width:26px;height:80px;background:#c7ccd1;border-radius:4px"></div>
          <div style="position:absolute;top:-70px;left:164px;width:26px;height:80px;background:#c7ccd1;border-radius:4px"></div>
          <div style="position:absolute;bottom:60px;left:95px;width:70px;height:26px;background:#2b3138;border-radius:13px"></div></div></div>`,
    ),
  ],
  "09-label-photo-t07.png": [
    1400,
    1000,
    photo(
      1400,
      1000,
      surface("#8d9197", "0.6", "0.6"),
      `<div style="width:1000px;background:#f4f5f2;border-radius:12px;box-shadow:0 22px 44px rgba(0,0,0,.45);padding:48px 56px;font-size:30px;line-height:1.6;color:#16202a;transform:rotate(1.5deg)">
        <div style="font-weight:800;font-size:40px">BRIGHTWATER · Model BW-C20</div>
        <div>20W USB-C wall charger</div>
        <div>Input: 100–240 V ~ 50/60 Hz 0.6 A</div>
        <div>Output: 5 V ⎓ 3 A · 9 V ⎓ 2.22 A (20 W max)</div>
        <div>Manufacturer: Shenlan Power Electronics Co., Ltd., Shenzhen, China</div>
        <div>Imported by: ${SELLER.name}, Austin, TX 78701</div>
        <div>Tested to UL 62368-1 · Batch 2026-07-B</div>
        <div style="font-size:20px;color:#8a1111;font-weight:700;margin-top:10px">TEST IMAGE — NOT A REAL LABEL</div></div>`,
    ),
  ],
  "11-utility-bill-proof-of-address.jpg": [
    1600,
    1200,
    photo(
      1600,
      1200,
      surface("#6d5440", "0.43", "0.31"),
      `<div style="width:900px;height:1080px;background:#efece4;box-shadow:0 24px 50px rgba(0,0,0,.5);padding:56px 60px;transform:rotate(-2.5deg);font-size:22px;line-height:1.5;color:#1c1f23">
        <div style="display:flex;justify-content:space-between"><div style="font-size:36px;font-weight:800;color:#1f5f99">Lakeside Power &amp; Water</div><div style="text-align:right;font-size:18px">Bill date: 5 Sep 2026<br>Account: 7710-3342-09</div></div>
        <div style="font-size:18px;color:#5b6470">PO Box 5510, Austin, TX 78711 · +1 (512) 555-0110</div>
        <div style="margin-top:60px;font-size:18px;color:#5b6470">SERVICE ADDRESS AND ACCOUNT HOLDER</div>
        <div style="font-weight:700;font-size:26px">${SELLER.name}</div><div>${SELLER.lines.join("<br>")}</div>
        <div style="margin-top:50px;border-top:2px solid #b9b4a8;padding-top:20px">Electricity, 4 Aug to 3 Sep 2026: 1,284 kWh ........ $178.40</div>
        <div>Water and sewer, 4 Aug to 3 Sep 2026 ........ $64.15</div>
        <div style="font-weight:800;margin-top:14px;font-size:28px">Amount due by 25 Sep 2026: $242.55</div>
        <div style="margin-top:80px;font-size:18px;color:#8a1111;font-weight:700">TEST DOCUMENT — NOT VALID · invented company and account</div></div>`,
    ),
  ],
  // Should pass all four picture checks: large, sharp, evenly lit, with all corners in frame.
  "12-id-card-specimen-GOOD-photo.jpg": [
    1600,
    1100,
    photo(1600, 1100, surface("#5a4637", "0.38", "0.28"), idCard(1.25)),
  ],
  // Should warn: small (640 px), soft, washed out, and cropped so the card runs off every edge.
  "13-id-card-specimen-BAD-photo.jpg": [
    640,
    420,
    photo(
      640,
      420,
      "background:#dfe8ee;",
      `<div style="transform:scale(1.25)">${idCard(0.7)}</div>`,
      "filter:blur(2.4px) brightness(1.55);overflow:hidden;",
    ),
  ],
};

// The notices these documents answer, as plain text to paste into the case (the JSON escapes
// every line break).
const notices = require("../2026-09-29-test-notices/notices.json");
for (const id of [
  "t01-inauthentic-section3",
  "t03-ip-trademark",
  "t04-related-account",
  "t05-verification-video",
  "t06-funds-disbursement",
  "t07-product-safety",
]) {
  const file = `paste-notice-${id}.txt`;
  fs.writeFileSync(path.join(OUT, file), notices.find((n) => n.id === id).text + "\n");
  console.log("made", file);
}

(async () => {
  const browser = await chromium.launch();
  const tab = await browser.newPage();

  for (const [file, html] of Object.entries(PDFS)) {
    await tab.setContent(html, { waitUntil: "load" });
    await tab.pdf({ path: path.join(OUT, file), format: "A4", printBackground: true });
    console.log("made", file);
  }

  for (const [file, [width, height, html]] of Object.entries(IMAGES)) {
    await tab.setViewportSize({ width, height });
    await tab.setContent(html, { waitUntil: "load" });
    const type = file.endsWith(".png") ? "png" : "jpeg";
    await tab.screenshot({
      path: path.join(OUT, file),
      type,
      ...(type === "jpeg" ? { quality: 90 } : {}),
    });
    console.log("made", file);
  }

  // Random noise does not compress, so the file size is close to width × height × 3 bytes.
  // Not committed (see .gitignore): run this script to make them.
  const noise = async (file, width, height) => {
    await tab.setContent("<canvas id=c></canvas>");
    const b64 = await tab.evaluate(
      ([w, h]) => {
        const c = document.getElementById("c");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        const img = ctx.createImageData(w, h);
        for (let i = 0; i < img.data.length; i++)
          img.data[i] = i % 4 === 3 ? 255 : (Math.random() * 256) | 0;
        ctx.putImageData(img, 0, 0);
        return c.toDataURL("image/png").split(",")[1];
      },
      [width, height],
    );
    fs.writeFileSync(path.join(OUT, file), Buffer.from(b64, "base64"));
    const mb = (fs.statSync(path.join(OUT, file)).size / 1e6).toFixed(1);
    console.log("made", file, `${mb} MB`);
  };
  await noise("14-too-big-to-check-about-4MB.png", 1200, 1150);
  await noise("15-too-big-to-store-about-12MB.png", 2000, 2000);

  await browser.close();
})();
