// The "Try a sample notice" button on /decode. A fictional, generic notice
// that mentions Amazon, Seller Central, ASIN, notice and policy so it passes
// both the client-side likeness check and the server-side decode gate.
// SAMPLE_NOTICE_ID stays for reference to the underlying fixture; the fixture
// itself (src/core/fixtures.ts) is untouched and still used by tests.
export const SAMPLE_NOTICE_ID = "policy-1";

export const SAMPLE_NOTICE_TEXT = `Subject: Notice of account deactivation — action required

Hello,

Your Amazon seller account has been deactivated. Your listings have been removed and funds in your account are on hold while we review your account.

Why is this happening?
We have taken this action because your account has repeated violations of our policies on listing practices and product condition. For example, ASIN B0EXAMPLE1 was listed as new while customers reported receiving used items, and detail pages contained claims we could not verify.

How do I reactivate my account?
To appeal, submit a Plan of Action in Seller Central that explains the root cause of the violations, the actions you have taken to resolve them, and the steps you have taken to prevent them going forward. Include supporting documents, such as supplier invoices for the ASINs listed above.

You can appeal within 90 days of this notice from Account Health in Seller Central.

Amazon.com Seller Performance`;
