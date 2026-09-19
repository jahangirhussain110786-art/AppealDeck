# Supporting pages: workspace design — 18 September 2026

The founder requested a review of the remaining pages and an implementation pass to match the new case workspace. This follows the workspace, homepage, Decode, dashboard, FAQ and expectations refinements.

## Updated surfaces

| Surface | Changes |
| --- | --- |
| Vault | Files, Backup and Security tabs; searchable file library; adjacent upload tools; compact metadata and file-specific action labels; separate backup/restore panels; protection settings and encryption details. |
| Vault access and unlock states | Clear guidance for signed-out visitors versus accounts without a pass; consistent heading, icon and form treatment; manual locking returns a protected vault to its unlock form. |
| Billing and devices | Workspace header, readable plan/purchase details, device cards and receipt/refund support links. Failed device requests now show a retry state rather than claiming the device list is empty. |
| Login, signup, password recovery/reset | Shared account panel, concise copy, existing workspace illustration explicitly labeled as an example; removed the dated sample deadline and duplicate main landmark. |
| Privacy, terms and refund | Related-policy navigation, numbered section cards, sticky desktop contents and keyboard-accessible mobile contents. Policy paragraphs remain available in full. |
| Older interview and composer | Shared workspace header, expandable introductory guidance and updated purchase gate. Existing saved-case compatibility remains intact. |
| Loading, empty, error and missing pages | Consistent icon, typography and surface treatment; app loading no longer duplicates its parent header/main; an app-level error boundary retains the app shell. |

The new `PageIntro` and `PageState` components use the existing Inter/Newsreader typography, Lucide icons, semantic color tokens and restrained translucent surfaces. No dependencies were added. The internal development component gallery was not redesigned.

## Interaction and copy corrections

- Vault filters now operate over the complete loaded list, so refreshing a filtered view does not discard the rest of the library from local component state. File-loading failures have a visible retry action.
- Manual lock remounts the vault gate so the file interface is replaced immediately by the unlock form. The manual lock action is offered for passphrase-protected vaults; automatic-unlock users can set a passphrase in Security.
- The cloud backup action has a visible label and is disabled until its required passphrase is supplied in automatic-unlock mode. No backup or restore is performed by the review scripts.
- Vault copy now distinguishes encrypted file contents from visible backup metadata. Deletion copy accurately says that local deletion does not change an existing cloud backup. The vault no longer shows a decoder-specific “nothing sent” badge.
- Billing describes the implemented one-case pass and directs inactive accounts to free case work and pass details. Refund and statutory consent terms are unchanged.
- Narrow-width testing identified an implicit vault grid track that expanded to the select/file content width. An explicit single column and bounded children correct it. Two small tinted text treatments were adjusted after automated contrast checks.

## Verification

Final results are recorded after the browser and presentation checks below are complete.

## Review artifacts

- [Login, light desktop](screenshots/2026-09-18-supporting-surfaces/login-light-desktop.png)
- [Signup, dark mobile](screenshots/2026-09-18-supporting-surfaces/signup-dark-mobile.png)
- [Vault files, light desktop](screenshots/2026-09-18-supporting-surfaces/vault-files-light-desktop.png)
- [Vault files, light mobile](screenshots/2026-09-18-supporting-surfaces/vault-files-light-mobile.png)
- [Backup, dark mobile](screenshots/2026-09-18-supporting-surfaces/vault-backup-dark-mobile.png)
- [Billing, light desktop](screenshots/2026-09-18-supporting-surfaces/billing-light-desktop.png)
- [Privacy, light desktop](screenshots/2026-09-18-supporting-surfaces/privacy-light-desktop.png)
- [Presentation check report](screenshots/2026-09-18-supporting-surfaces/verification.json)

The local preview remains at `http://localhost:3100`. Automated preview checks use IPv6 loopback because an unrelated IPv4 service shares that port. Existing guest sessions are retained by reloading their original tab. No commit, push, deployment, database migration, payment, cloud backup or device revocation was performed in this pass. Existing production launch checks remain in the integrity handoff.
