# Google Drive MCP Health Check & Repair

## Quick Check
1. Do I have Google Drive tools in my toolset? (Look for tools starting with `google` or `gdrive`)
2. If YES → Confirm working by listing files. Done.
3. If NO → Proceed to diagnose & fix

## Architecture

The project uses a **long-lived HTTP MCP server** (not per-call npx stdio). The flow:

- `kilo.json` declares `google-drive` as `type: "remote"` at `http://127.0.0.1:3100/mcp`
- `npm run drive:up` starts the server (idempotent, polls readiness, exits 0)
- `npm run drive:down` stops it (kills by PID + port + command-line scan)
- Native tools appear in Kilo when the server is up and Kilo's tool discovery runs
- Fallback CLI: `.agents/skills/google-drive/gdrive.cjs call <tool> @<params-file>`

## Diagnosis & Fix

### a. Verify kilo.json config

```
Read V:\AppealDeck\kilo.json
Confirm "google-drive" entry exists under "mcp":
  "google-drive": {
    "type": "remote",
    "url": "http://127.0.0.1:3100/mcp",
    "enabled": true
  }
```

### b. Check the MCP is running

```
npm run drive:up
If already running, it prints: "google-drive MCP already running (pid <N>)"
If port 3100 is in use by something else, it prints an error — run: npm run drive:down first
```

### c. Check credentials files exist

```
Test path: C:\Users\Hawlton Alliance\.config\google-drive-mcp\
Required: gcp-oauth.keys.json AND token.json
```

### d. Inspect token.json state

```
Read token.json
Check:
  - "email" should be a real email, not "unknown"
  - "pendingIdentity" should be false (NOT true)
  - "expiryDate" should be in the future (check expiry timestamp)
```

### e. If pendingIdentity: true OR email: "unknown"

```
Run the auth flow:
  $env:GOOGLE_DRIVE_MCP_TOKEN_PATH="C:\Users\Hawlton Alliance\.config\google-drive-mcp\token.json"
  $env:GOOGLE_DRIVE_OAUTH_CREDENTIALS="C:\Users\Hawlton Alliance\.config\google-drive-mcp\gcp-oauth.keys.json"
  npx @piotr-agier/google-drive-mcp auth

This opens a browser for OAuth consent. Complete the flow.
Then restart the MCP: npm run drive:down; npm run drive:up
```

### f. Verify the MCP package is installed & runnable

```
npx @piotr-agier/google-drive-mcp version
(Should print version, e.g. v2.6.0)

Check the server log:
  Read V:\AppealDeck\.drive-mcp.log
  (Runtime file — gitignored, not committed)
```

### g. Test the server responds to MCP protocol

```
Spawn the HTTP server (if not already running):
  npm run drive:up

Then hit the HTTP endpoint:
  curl http://127.0.0.1:3100/mcp
  (Should return a 200 or MCP protocol response, not ECONNREFUSED)
```

### h. If tools still don't appear in Kilo after server works

Restart the Kilo CLI — it caches MCP connections at startup. If the `remote` transport was recently added to `kilo.json`, a restart ensures tool discovery re-runs.

## Fix Actions

- **Server down**: `npm run drive:up` (starts the HTTP server)
- **Port conflict**: `npm run drive:down` (kills stragglers by port + command line)
- **Re-auth**: If pendingIdentity or token expired → run `npx @piotr-agier/google-drive-mcp auth`, then restart server
- **Wrong paths**: Ensure `GOOGLE_DRIVE_OAUTH_CREDENTIALS` and `GOOGLE_DRIVE_MCP_TOKEN_PATH` point to the right files (set in `scripts/drive-mcp-up.cmd`)
- **Package broken**: Reinstall via `npm install -g @piotr-agier/google-drive-mcp` or use `npx -y` to auto-fetch
- **kilo.json missing entry**: Add the google-drive `remote` MCP block (see step a)
- **Still failing**: Delete token.json, re-run the auth flow (step e), then `npm run drive:up`

## Confirm Working

After fix, run:

```powershell
# Write params to a temp JSON file
{"query": "name != ''", "pageSize": 5, "orderBy": "modifiedTime desc"} > $env:TEMP\gdrive-search.json

# Call via the fallback wrapper
node .agents/skills/google-drive/gdrive.cjs call search "@$env:TEMP\gdrive-search.json"
```

Should return 5 files. If it does, the MCP server is healthy and the `gdrive.cjs` wrapper works as fallback.

## Restart Kilo

If native `google-drive_*` tools still don't appear in the active toolset after the server works standalone, restart the Kilo CLI — it caches MCP connections at startup.