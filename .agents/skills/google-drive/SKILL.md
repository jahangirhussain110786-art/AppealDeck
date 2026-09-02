---
name: google-drive
description: Access and manipulate Google Drive via MCP — create docs/sheets/slides, search files, read/write content, manage folders. Auto-loads in every session. Falls back to CLI wrapper when native MCP tools aren't loaded.
---

# Google Drive MCP Access

## When to use this skill

Use this skill whenever the user asks to:
- Create, read, update, or delete Google Docs, Sheets, Slides, or files
- Search for files in Google Drive
- Share files or manage permissions
- Organize files into folders
- Export/download file content

This skill is **always loaded** — it documents how to access Google Drive in every session, even when native MCP tools aren't available.

## Architecture

### Native MCP tools (preferred — Kilo loads them automatically)

The `google-drive` MCP server is declared in `kilo.json` as `type: "remote"` pointing at `http://127.0.0.1:3100/mcp`. Kilo's MCP loader connects to that HTTP endpoint on session start and exposes all 116 tools natively with the `google-drive_*` prefix. **This is the default and the fastest path — no per-call startup cost.**

The 116-tool server is the **long-lived** MCP server for this project. It is started once per session, not per call. If the tools don't appear at the start of a session, run `npm run drive:up` from the repo root to (re)start the HTTP server, then re-trigger the session's tool discovery (in Kilo this typically happens automatically on config change; for the CLI a restart is safer).

When the native tools are present, use them directly. Do not call the wrapper.

### Wrappers (fallback only)

For non-Kilo callers (PowerShell scripts, one-off Node scripts, CI), the legacy `gdrive.cjs` and `gdrive.ps1` wrappers in this folder talk to the same long-lived HTTP server. They are **file-arg-only** — params must be a JSON file path prefixed with `@`. Inline JSON is rejected because PowerShell mangles single-quoted JSON on Windows.

### Intent-driven skills (preferred over raw tool calls)

For non-trivial Drive work, load the project-local skills:

- `.agents/skills/drive-quick/SKILL.md` — 1-call markdown / text note creation
- `.agents/skills/drive-workflow/SKILL.md` — every other Drive intent (read, structured create, share, organize, template fill, update)

These codify the right shape for each intent so the agent does not improvise.

## Performance

The HTTP server stays up for the entire session. Each call is one TCP round-trip to `127.0.0.1:3100`, ~100ms. The old 3-5s per-call npx spawn is gone.

`npm run drive:up` starts it (idempotent, polls readiness, exits 0).
`npm run drive:down` stops it (also kills any stragglers by port and command line).

### Fallback: temp JSON + Node wrapper (recommended for Windows)

Use the local Node wrapper with a temp JSON file to avoid PowerShell quoting issues. This is faster and more reliable than inline JSON on Windows.

```powershell
# Write params to a temp JSON file
@'
{"query": "AppealDeck", "pageSize": 5}
'@ | Set-Content -LiteralPath "$env:TEMP\gdrive-search.json" -Encoding utf8

# Call the wrapper
node .agents/skills/google-drive/gdrive.cjs call search "@$env:TEMP\gdrive-search.json"
```

Common operations using this pattern:

```powershell
# Search
$p = @{query='appealdeck'} | ConvertTo-Json -Compress
$p | Set-Content "$env:TEMP\gdrive-search.json"
node .agents/skills/google-drive/gdrive.cjs call search "@$env:TEMP\gdrive-search.json"

# Read a Google Doc
$p = @{documentId='1abc...'} | ConvertTo-Json -Compress
$p | Set-Content "$env:TEMP\gdrive-read.json"
node .agents/skills/google-drive/gdrive.cjs call getGoogleDocContent "@$env:TEMP\gdrive-read.json"

# Create a Google Doc
$p = @{name='My Doc'; content='Hello'} | ConvertTo-Json -Compress
$p | Set-Content "$env:TEMP\gdrive-create.json"
node .agents/skills/google-drive/gdrive.cjs call createGoogleDoc "@$env:TEMP\gdrive-create.json"

# Update a Google Doc
$p = @{documentId='1abc...'; content='New content'} | ConvertTo-Json -Compress
$p | Set-Content "$env:TEMP\gdrive-update.json"
node .agents/skills/google-drive/gdrive.cjs call updateGoogleDoc "@$env:TEMP\gdrive-update.json"

# Create a Google Sheet
$p = @{name='Data'; data=@(@('Name','Value'),@('A','1'))} | ConvertTo-Json -Compress
$p | Set-Content "$env:TEMP\gdrive-sheet.json"
node .agents/skills/google-drive/gdrive.cjs call createGoogleSheet "@$env:TEMP\gdrive-sheet.json"
```

If you want one-line shortcuts in PowerShell, add this to your profile:

```powershell
function gd { param([string]$tool,[hashtable]$p=@{}); $f="$env:TEMP\gdrive-$tool.json"; $p | ConvertTo-Json -Compress | Set-Content $f; node "$PWD\.agents\skills\google-drive\gdrive.cjs" call $tool "@$f" }
```

Then use:
```powershell
gd search @{query='appealdeck'}
gd getGoogleDocContent @{documentId='1abc...'}
gd createGoogleDoc @{name='My Doc'; content='Hello'}
gd updateGoogleDoc @{documentId='1abc...'; content='New content'}
gd createGoogleSheet @{name='Data'; data=@(@('Name','Value'))}
```

## Available Tools Reference

### File Operations

| Tool | Description | Key Params |
|------|-------------|------------|
| `search` | Search files in Drive | `query`, `pageSize`, `rawQuery`, `orderBy` |
| `createTextFile` | Create .txt or .md file | `name`, `content`, `parentFolderId` |
| `createGoogleDoc` | Create Google Doc | `name`, `content`, `parentFolderId` |
| `createGoogleSheet` | Create Google Sheet | `name`, `data` (2D array) |
| `createGoogleSlides` | Create Slides presentation | `name`, `slides` |
| `listFiles` | List files in folder | `parentFolderId`, `pageSize` |
| `getFile` | Get file metadata | `fileId` |
| `deleteFile` | Delete a file | `fileId` |

### Google Docs

| Tool | Description | Key Params |
|------|-------------|------------|
| `getGoogleDocContent` | Read doc content | `documentId` |
| `updateGoogleDoc` | Update doc content | `documentId`, `content` |
| `listDocumentTabs` | List tabs in doc | `documentId` |
| `createDocumentTab` | Add tab to doc | `documentId`, `title` |

### Google Sheets

| Tool | Description | Key Params |
|------|-------------|------------|
| `getGoogleSheetContent` | Read sheet data | `spreadsheetId`, `range` |
| `updateGoogleSheet` | Update sheet cells | `spreadsheetId`, `range`, `data` |
| `appendSpreadsheetRows` | Append rows | `spreadsheetId`, `range`, `values` |
| `getSpreadsheetInfo` | Get sheet metadata | `spreadsheetId` |
| `listSheets` | List tabs in sheet | `spreadsheetId` |
| `addSpreadsheetSheet` | Add new sheet | `spreadsheetId`, `sheetTitle` |
| `formatGoogleSheetCells` | Format cells | `spreadsheetId`, `range`, formatting... |
| `formatGoogleSheetText` | Text formatting | `spreadsheetId`, `range`, bold/italic... |
| `formatGoogleSheetNumbers` | Number format | `spreadsheetId`, `range`, pattern |
| `setGoogleSheetBorders` | Cell borders | `spreadsheetId`, `range`, style |
| `mergeGoogleSheetCells` | Merge cells | `spreadsheetId`, `range`, mergeType |
| `setColumnWidth` | Column width | `spreadsheetId`, `sheetId`, pixelSize |
| `setRowHeight` | Row height | `spreadsheetId`, `sheetId`, pixelSize |
| `autoResizeColumns` | Auto-fit columns | `spreadsheetId`, `sheetId` |
| `autoResizeRows` | Auto-fit rows | `spreadsheetId`, `sheetId` |
| `addDataValidation` | Data validation rules | `spreadsheetId`, `range`, conditionType |
| `protectRange` | Protect cells | `spreadsheetId`, `range` |
| `addNamedRange` | Named ranges | `spreadsheetId`, `name`, `range` |

### Google Slides

| Tool | Description | Key Params |
|------|-------------|------------|
| `getGoogleSlidesContent` | Read slides | `presentationId` |
| `updateGoogleSlides` | Update slides | `presentationId`, `slides` |
| `createGoogleSlidesTextBox` | Add text box | `presentationId`, `pageObjectId`, `text` |
| `createGoogleSlidesShape` | Add shape | `presentationId`, `pageObjectId`, `shapeType` |
| `formatGoogleSlidesText` | Format text | `presentationId`, `objectId` |
| `formatGoogleSlidesParagraph` | Paragraph format | `presentationId`, `objectId` |
| `setGoogleSlidesBackground` | Slide background | `presentationId`, `backgroundColor` |
| `getGoogleSlidesSpeakerNotes` | Speaker notes | `presentationId`, `slideIndex` |
| `updateGoogleSlidesSpeakerNotes` | Update notes | `presentationId`, `slideIndex`, `notes` |
| `deleteGoogleSlide` | Delete slide | `presentationId`, `slideObjectId` |
| `duplicateSlide` | Duplicate slide | `presentationId`, `slideObjectId` |
| `reorderSlides` | Reorder slides | `presentationId`, `slideObjectIds` |
| `replaceAllTextInSlides` | Find/replace | `presentationId`, `containsText`, `replaceText` |
| `insertSlidesImageFromUrl` | Insert image | `presentationId`, `pageObjectId`, `imageUrl` |
| `insertSlidesLocalImage` | Insert local image | `presentationId`, `pageObjectId`, `localImagePath` |

### Calendar (bonus — same MCP server)

| Tool | Description | Key Params |
|------|-------------|------------|
| `listCalendars` | List calendars | — |
| `getCalendarEvents` | Get events | `calendarId`, `timeMin`, `timeMax` |
| `getCalendarEvent` | Single event | `eventId` |
| `createCalendarEvent` | Create event | `summary`, `start`, `end` |
| `updateCalendarEvent` | Update event | `eventId`, fields... |
| `deleteCalendarEvent` | Delete event | `eventId` |

### Account Management

| Tool | Description | Key Params |
|------|-------------|------------|
| `manage_accounts` | List/manage accounts | `action: "list"` |

## Common Operations

### Create a Google Doc with content

**Native tool:**
```
google-drive_createGoogleDoc(name: "Title", content: "Body text here")
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call createGoogleDoc '{"name": "Title", "content": "Body text here"}'
```

### Search for files

**Native tool:**
```
google-drive_search(query: "AppealDeck", pageSize: 10)
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call search '{"query": "AppealDeck", "pageSize": 10}'
```

### Create a Google Sheet with data

**Native tool:**
```
google-drive_createGoogleSheet(name: "Data", data: [["Name", "Value"], ["A", "1"]])
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call createGoogleSheet '{"name": "Data", "data": [["Name","Value"],["A","1"]]}'
```

### Update a Google Doc

**Native tool:**
```
google-drive_updateGoogleDoc(documentId: "1abc...", content: "New content")
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call updateGoogleDoc '{"documentId": "1abc...", "content": "New content"}'
```

### Read a Google Doc

**Native tool:**
```
google-drive_getGoogleDocContent(documentId: "1abc...")
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call getGoogleDocContent '{"documentId": "1abc..."}'
```

### Create a folder

**Native tool:**
```
google-drive_createFolder(name: "Folder Name")
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call createFolder '{"name": "Folder Name"}'
```

### Upload a file

**Native tool:**
```
google-drive_uploadFile(filePath: "V:\\path\\to\\file.pdf", name: "file.pdf")
```

**Fallback:**
```bash
node .agents/skills/google-drive/gdrive.cjs call uploadFile '{"filePath": "V:\\path\\to\\file.pdf", "name": "file.pdf"}'
```

## Configuration

### MCP Server Config (kilo.json)

```json
{
  "mcp": {
    "google-drive": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@piotr-agier/google-drive-mcp"],
      "enabled": true,
      "env": {
        "GOOGLE_DRIVE_OAUTH_CREDENTIALS": "C:\\Users\\Hawlton Alliance\\.config\\google-drive-mcp\\gcp-oauth.keys.json",
        "GOOGLE_DRIVE_MCP_TOKEN_PATH": "C:\\Users\\Hawlton Alliance\\.config\\google-drive-mcp\\token.json"
      }
    }
  }
}
```

### OAuth Credentials

- **Credentials file**: `C:\Users\Hawlton Alliance\.config\google-drive-mcp\gcp-oauth.keys.json`
- **Token file**: `C:\Users\Hawlton Alliance\.config\google-drive-mcp\token.json`
- **Account**: jahangirhussain110786@gmail.com
- **Scopes**: drive, drive.file, drive.readonly, documents, spreadsheets, presentations, calendar, calendar.events, userinfo.email

### Permissions (auto-approve)

```json
{
  "permission": {
    "google-drive_*": "allow"
  }
}
```

## Troubleshooting

See `troubleshooting.md` in this folder for the full health-check & repair playbook.

### Token expired / auth error

The token auto-refreshes. If it fails:
1. Check `C:\Users\Hawlton Alliance\.config\google-drive-mcp\token.json` exists
2. Re-run OAuth flow if refresh token is invalid

### Google Docs API not enabled

Visit: https://console.developers.google.com/apis/api/docs.googleapis.com/overview?project=322861054648

### Google Sheets API not enabled

Visit: https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=322861054648

### npx not found

Ensure Node.js is in PATH. The wrapper uses `npx -y @piotr-agier/google-drive-mcp`.

## Self-Enhancement Protocol

After every new usage pattern or tool discovery:
1. Add the new pattern to this skill's "Common Operations" section
2. Document any new params or edge cases discovered
3. Update the tools reference if new tools are added to the MCP server

This ensures the skill grows with usage and every future session benefits.
