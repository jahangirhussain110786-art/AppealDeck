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
    dropHint: "PDF, PNG, JPEG or WebP, up to 10 MB",
    reading: "Reading the invoice on your device...",
    again: "Check a different invoice",
    privacy:
      "The file is read in this browser tab. It is not uploaded, not saved and not tied to any account. Close the tab and it is gone.",
    failed: "That file could not be read here. Try a clearer or smaller copy, or a PDF.",
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
    title: "What it does not do",
    items: [
      "It does not tell you whether Amazon will accept the invoice. Amazon decides, and it may contact your supplier.",
      "It does not check that the invoice is genuine. Only your supplier can confirm that.",
      "It reads printed text. A photo of a handwritten page cannot be read, and Amazon may not accept one either.",
    ],
  },
  next: {
    title: "Have a notice in front of you?",
    body: "Paste it into the decoder to see what Amazon is asking for and by when. Then keep this invoice with your case.",
    cta: "Decode a notice",
  },
} as const;
