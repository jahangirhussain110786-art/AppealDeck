import { newWorkspace, proposedRequirements, type Workspace } from "./workspace";

/**
 * A confirmed document-request workspace with one reviewed requirement — the shape most workspace
 * tests start from.
 *
 * Extracted from `workspace.test.ts` on 23 Sep 2026, where it lived as an export. Importing one
 * test file from another makes Vitest collect the imported file's suites **inside the importing
 * file as well**, so every test in `workspace.test.ts` was being registered and run twice: once on
 * its own and once through `workspaceExport.test.ts`. Nothing failed because of it, which is why
 * it survived — but it doubled that file's runtime and, worse, made the suite total misreport by
 * exactly the size of the file. Adding seven tests moved the count by fourteen, which is how this
 * was noticed.
 *
 * Not a `.test.ts` file, so Vitest does not collect it. Test-support only.
 */
export function documentWorkspace(): Workspace {
  const w = {
    ...newWorkspace(),
    notice: "Please provide the supplier invoice for the affected product.",
    formInstructions: "Upload the invoice and explain the product mapping.",
    protocol: "documents" as const,
    confirmed: true,
    requirementsConfirmed: true,
    explanation:
      "The supplied invoice identifies our product by its manufacturer product code and records the purchase.",
  };
  w.requirements = proposedRequirements(w).map((r) => ({
    ...r,
    status: "reviewed",
    recordId: "file-1",
    filename: "invoice.pdf",
    contentHash: "hash-1",
    page: 2,
    note: "Product code J-104 appears on the invoice line.",
  }));
  return w;
}
