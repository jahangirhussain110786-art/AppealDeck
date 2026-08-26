$ErrorActionPreference = 'Stop'

$WORKTREE_PATH = $env:WORKTREE_PATH
$REPO_PATH = $env:REPO_PATH

if (-not $WORKTREE_PATH -or -not $REPO_PATH) {
  Write-Output "Setup script skipped: WORKTREE_PATH or REPO_PATH not set."
  exit 0
}

Write-Output "Setting up worktree at: $WORKTREE_PATH"
Write-Output "Main repo at: $REPO_PATH"

if (-not (Test-Path -LiteralPath $WORKTREE_PATH)) {
  Write-Output "Worktree path does not exist. Aborting."
  exit 1
}

Set-Location -LiteralPath $WORKTREE_PATH

if (Test-Path -LiteralPath "$REPO_PATH\.env.example") {
  if (-not (Test-Path -LiteralPath ".env")) {
    Copy-Item -LiteralPath "$REPO_PATH\.env.example" -Destination ".env" -Force
    Write-Output "Copied .env.example to .env"
  }
}

if (Test-Path -LiteralPath "$REPO_PATH\.env.local.example") {
  if (-not (Test-Path -LiteralPath ".env.local")) {
    Copy-Item -LiteralPath "$REPO_PATH\.env.local.example" -Destination ".env.local" -Force
    Write-Output "Copied .env.local.example to .env.local"
  }
}

Write-Output "Setup complete."