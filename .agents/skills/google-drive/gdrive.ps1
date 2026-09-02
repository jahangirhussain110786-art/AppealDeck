# Google Drive MCP PowerShell Helper (file-arg-only, uses long-lived HTTP server)
#
# Usage:
#   gdrive <tool_name> @<params-file>
#
# Params MUST be a JSON file path prefixed with '@'. Inline JSON is rejected
# because PowerShell mangles single-quoted JSON on Windows.
#
# Connects to the long-lived google-drive MCP HTTP server on
# http://127.0.0.1:3100/mcp. Start it with:  npm run drive:up
#
# Example:
#   '{ "query": "AppealDeck" }' | Set-Content p.json
#   gdrive search @p.json

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ToolName,

    [Parameter(Position = 1)]
    [string]$JsonParamsPath,

    [int]$Port = 3100
)

$ErrorActionPreference = 'Stop'

if (-not $JsonParamsPath -or -not $JsonParamsPath.StartsWith('@')) {
    Write-Error "Params must be a file path prefixed with '@'. PowerShell breaks inline JSON; use a file."
    Write-Error "Example:  '{ `"query`": `"x`" }' | Set-Content p.json; gdrive search @p.json"
    exit 1
}

$paramsFile = $JsonParamsPath.Substring(1)
if (-not (Test-Path $paramsFile)) {
    Write-Error "Params file not found: $paramsFile"
    exit 1
}

$rawParams = Get-Content -LiteralPath $paramsFile -Raw -Encoding UTF8
try {
    $argumentsObj = $rawParams | ConvertFrom-Json
} catch {
    Write-Error "Invalid JSON in $paramsFile`: $($_.Exception.Message)"
    exit 1
}

$url = "http://127.0.0.1:$Port/mcp"

# Initialize session
$initBody = @{
    jsonrpc    = '2.0'
    id         = 1
    method     = 'initialize'
    params     = @{
        protocolVersion = '2024-11-05'
        capabilities    = @{}
        clientInfo      = @{ name = 'gdrive-ps'; version = '1' }
    }
} | ConvertTo-Json -Compress -Depth 10

try {
    $initResp = Invoke-WebRequest -Uri $url -Method POST -ContentType 'application/json' `
        -Headers @{ Accept = 'application/json, text/event-stream' } `
        -Body $initBody -UseBasicParsing -TimeoutSec 15
} catch {
    Write-Error "Cannot reach google-drive MCP at $url. Is the server running? Start it with: npm run drive:up"
    Write-Error $_.Exception.Message
    exit 1
}

$sessionId = $initResp.Headers['mcp-session-id']
if (-not $sessionId) {
    Write-Error "MCP initialize did not return a session id"
    exit 1
}

# Send initialized notification
$null = Invoke-WebRequest -Uri $url -Method POST -ContentType 'application/json' `
    -Headers @{ Accept = 'application/json, text/event-stream'; 'mcp-session-id' = $sessionId } `
    -Body '{"jsonrpc":"2.0","method":"notifications/initialized"}' -UseBasicParsing -TimeoutSec 10

# Call the tool
$callBody = @{
    jsonrpc = '2.0'
    id      = 2
    method  = 'tools/call'
    params  = @{
        name      = $ToolName
        arguments = $argumentsObj
    }
} | ConvertTo-Json -Compress -Depth 10

$callResp = Invoke-WebRequest -Uri $url -Method POST -ContentType 'application/json' `
    -Headers @{ Accept = 'application/json, text/event-stream'; 'mcp-session-id' = $sessionId } `
    -Body $callBody -UseBasicParsing -TimeoutSec 120

# Response is text/event-stream; extract first data: line
$dataLine = ($callResp.Content -split "`n" | Where-Object { $_ -like 'data: *' } | Select-Object -First 1) -replace '^data: ',''
if (-not $dataLine) {
    Write-Error "No data in MCP response"
    Write-Error $callResp.Content
    exit 1
}

$result = $dataLine | ConvertFrom-Json
if ($result.error) {
    Write-Error $result.error.message
    exit 1
}

if ($result.result.content) {
    $result.result.content | ForEach-Object {
        if ($_.type -eq 'text') { Write-Output $_.text } else { $_ | ConvertTo-Json -Depth 5 }
    }
} else {
    $result.result | ConvertTo-Json -Depth 5
}
