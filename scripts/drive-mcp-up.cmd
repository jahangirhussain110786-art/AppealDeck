@echo off
setlocal
set "PORT=%1"
if "%PORT%"=="" set "PORT=3100"

set "ENTRY=%APPDATA%\npm\node_modules\@piotr-agier\google-drive-mcp\dist\index.js"
if not exist "%ENTRY%" (
  echo Local entry not found at %ENTRY%. Run: npm install -g @piotr-agier/google-drive-mcp
  exit /b 1
)

set "GOOGLE_DRIVE_OAUTH_CREDENTIALS=%USERPROFILE%\.config\google-drive-mcp\gcp-oauth.keys.json"
set "GOOGLE_DRIVE_MCP_TOKEN_PATH=%USERPROFILE%\.config\google-drive-mcp\token.json"

start "" /B node "%ENTRY%" start --transport http --port %PORT%
exit /b 0
