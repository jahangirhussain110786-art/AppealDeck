---
name: drive-workflow
description: Multi-step Google Drive workflows — read-then-write, template fill, share, organize, create docs/sheets/slides, update existing files. Use when the intent is not a single markdown note (for that, see drive-quick).
---

# drive-workflow

The general-purpose Drive skill. Covers every intent the 116-tool `@piotr-agier/google-drive-mcp` server supports, grouped by user intent (not by API verb).

## When to use
- Read a Drive file: "show me what's in X", "read the appealdeck-budget sheet"
- Create a structured doc/sheet/slide: "make me a sheet of Z", "draft a google doc with Y", "build a 3-slide summary of W"
- Fill a known template: "generate this week's status from the template", "produce a Q3 plan from Planning/templates/quarterly.md"
- Update an existing file: "fix the date in the project plan", "add a row to the budget sheet"
- Share with someone: "give read access to <email>", "make this public to anyone with the link"
- Organize: "move all PDFs older than a year to /Archive", "rename the meeting notes to YYYY-MM-DD format"

## When NOT to use
- Pure single-file text/markdown write → `drive-quick` (1 call).

## Connection model
A long-lived google-drive MCP HTTP server runs on `http://127.0.0.1:3100/mcp`. All Drive tools in this session (native or wrapper) talk to that one server. Lifecycle:

- `npm run drive:up` — start the server (idempotent, exits 0 when ready, ~3-5s first run while npx downloads the package)
- `npm run drive:down` — stop it
- The skill should **never start or stop the server itself** in the middle of a workflow. If a tool call returns "Cannot reach MCP at http://127.0.0.1:3100/mcp", the agent should `npm run drive:up` once and then retry — not loop.

## Preferred path — native MCP tools
If `google-drive_search`, `google-drive_getGoogleDocContent`, `google-drive_createGoogleSheet`, `google-drive_updateGoogleSheet`, `google-drive_managePermissions`, etc. appear in the session tool list, **use them directly**. The 116-tool server exposes them as native Kilo tools via the `type: "remote"` entry in `kilo.json`. Each call is one round-trip to the HTTP server, ~100ms.

## Fallback path — gdrive.cjs file-arg wrapper
When native tools are not loaded, use the wrapper:

```
echo '<json>' > p.json
node .agents/skills/google-drive/gdrive.cjs call <tool_name> @p.json
```

Where `<json>` is the tool's `arguments` object. The wrapper is file-arg-only because PowerShell breaks inline JSON. See `gdrive.cjs help` for the full pattern.

The PowerShell helper (`.agents/skills/google-drive/gdrive.ps1`) is the equivalent for `.ps1` callers. It also takes `@params-file`.

## Intent playbooks (the 8 common workflows)

### 1. Find a file
```
search { query: "appealdeck", pageSize: 10 }
```
1 call. Use rawQuery for advanced filters (mimeType, modifiedTime, etc.).

### 2. Read a file
```
search -> getGoogleDocContent | getGoogleSheetContent | readGoogleDocPaginated
```
2 calls. Use `readGoogleDocPaginated` with `offset`/`limit` for large docs.

### 3. Quick text note
→ Use `drive-quick` skill instead.

### 4. Create a doc / sheet / slide from data
```
createGoogleDoc | createGoogleSheet | createGoogleSlides
```
1 call. For data with structure, prefer Sheet over Doc. For HTML conversion with native styles, use `createDocFromHTML`.

### 5. Fill a known template
```
1. search  -> find the template file
2. copyFile -> make a copy with the new name
3. updateGoogleDoc { documentId, content } OR
   (for Sheets) read template values, then write the new content
```
3 calls. Templates live in `Planning/templates/<name>.md` or `Planning/templates/<name>.json` (read them in-repo, not from Drive, unless the template itself is in Drive).

### 6. Update an existing file
```
updateGoogleDoc | updateGoogleSheet | updateTextFile
```
1 call. For surgical edits with formatting, use the `applyTextStyle` / `applyParagraphStyle` / `insertText` / `findAndReplaceInDoc` tools after the initial update.

### 7. Share with someone
```
addPermission { fileId, emailAddress, role: "reader"|"writer"|"commenter", type: "user", sendNotificationEmail: true|false }
```
1 call. Defaults: `role: "reader"`, `sendNotificationEmail: true`. Never share publicly without explicit user confirmation.

### 8. Organize (move / rename / delete / archive)
```
moveItem | renameItem | deleteItem (move to trash, not permanent) | createFolder
```
1-2 calls per item. For bulk operations, use `search` first to gather file ids, then loop. Always confirm before `deleteItem` — it's a trash, not a permanent delete, but it's still the user's data.

## Templates folder convention
Recurring docs that the agent will create more than once belong in `Planning/templates/` as plain `.md` or `.json` files. The agent reads them from the repo (no Drive fetch) and composes the final file in-context before one `createGoogleDoc` or `createTextFile` call. Add a new template by adding a file; do not add a new skill.

Current templates: (none yet — add as needs emerge.)

## Pitfalls
- **PowerShell mangles inline JSON.** Use `@params-file` always.
- **UTF-8 BOM from `Set-Content`.** Use `[IO.File]::WriteAllText` with `[Text.UTF8Encoding]::new($false)` for clean UTF-8.
- **The `npx` startup cost is gone.** HTTP server is shared. Each call is ~100ms, not 3-5s.
- **Don't re-fetch from Drive what you have in repo.** AGENTS.md and Planning/ are the source of truth for project facts. The user's prompt + those files are enough to compose most writes without any Drive read.
- **Confirmation gates.** Sharing publicly, deleting, or moving 10+ files at once should ask the user first (per the global orchestrator rules in `.config/kilo/AGENTS.md`).
