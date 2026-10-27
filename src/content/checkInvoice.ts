/**
 * Copy for the free invoice check page (8 Oct 2026).
 *
 * The page is a front door to the document check the case already has, run on the device only:
 * nothing is uploaded, no account is needed, nothing is saved. Every sentence here describes what
 * the check does or does not do; none predicts what Amazon will do with the invoice.
 */
export const CHECK_INVOICE = {
  metadata: {
    title: "Free invoice check for an Amazon authenticity complaint",
    description:
      "Drop in a supplier invoice and see what it shows against what Amazon asks for: the supplier's details, the date, the quantity and your product. Free, no account, and the file never leaves your device.",
  },
  hero: {
    eyebrow: "Free, no account",
    title: "Check your supplier invoice before Amazon reads it.",
    accent: "before Amazon reads it.",
    lede: "Amazon often asks for supplier invoices when a customer says a product is not genuine. A missing supplier address, an old date or a handwritten page is easy to fix now and hard to explain later. This reads your invoice on your own device and tells you what it shows.",
  },
  tool: {
    title: "Check an invoice",
    asinLabel: "Your product's ASIN (optional)",
    asinHelp:
      "Paste the ASIN from Amazon's notice, or several separated by spaces or commas. The check then looks for it on the invoice.",
    asinPlaceholder: "B0C1234567",
    // G-02: two optional numbers turn the field-by-field result into the two sums Amazon's rule is
    // made of. Both stay on the device with everything else on this page.
    noticeDateLabel: "Date on Amazon's notice (optional)",
    noticeDateHelp:
      "With it, the 365 days are counted back from your notice's date, the way Amazon counts them. Without it, from today.",
    unitsLabel: "Units you sold of this product in the last 365 days (optional)",
    unitsHelp:
      "From your Business Reports in Seller Central. With it, we add the invoice's quantity against it.",
    unitsPlaceholder: "131",
    dropHint: "PDF, PNG, JPEG or WebP, up to 10 MB",
    reading: "Reading the invoice on your device...",
    again: "Check a different invoice",
    privacy:
      "The file is read in this browser tab. It is not uploaded, not saved and not tied to any account. Close the tab and it is gone.",
    failed: "That file could not be read here. Try a clearer or smaller copy, or a PDF.",
  },
  sums: {
    title: "The two sums, worked out",
    lead: "Amazon's rule for an authenticity notice comes down to two numbers: how old the invoice is, and whether the invoices cover what you sold. Here is each one with its working.",
    daysTitle: "How old is the invoice?",
    unitsTitle: "Does it cover what you sold?",
    note: "These are sums on what was read from the invoice. Whether Amazon accepts it stays with Amazon, and Amazon may phone your supplier.",
  },
  covers: {
    title: "What it looks at",
    items: [
      "Whether the supplier's name, address and contact details are printed on the invoice.",
      "The invoice date, and whether it is within the last 365 days that Amazon usually asks about.",
      "Whether a product, a quantity and your ASIN can be found.",
      "Whether the page looks like an invoice at all, rather than a quotation, a pro-forma or a credit note.",
    ],
  },
  limits: {
    title: "Where this check stops",
    items: [
      "Amazon may contact your supplier. The check gives you a clearer file to send.",
      "Genuineness is your supplier's to confirm; the check reads what the document shows.",
      "It reads printed text. A typed or printed copy of a handwritten page gives both you and Amazon a document that can be read.",
    ],
  },
  next: {
    title: "Have a notice in front of you?",
    body: "Paste it into the decoder to see what Amazon is asking for and by when. Then keep this invoice with your case.",
    cta: "Decode a notice",
  },
} as const;
