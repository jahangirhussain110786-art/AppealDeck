$ErrorActionPreference = 'Stop'
$script:STARTED_PIDS = @()

function Stop-Started {
  foreach ($pid in $script:STARTED_PIDS) {
    try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
  }
}

try {
  if ($args -contains 'stop') {
    Stop-Started
    exit 0
  }

  if (Get-Command -Name 'npm' -ErrorAction SilentlyContinue) {
    if (Test-Path -LiteralPath 'package.json') {
      Write-Output "Starting npm dev..."
      $p = Start-Process -FilePath 'npm' -ArgumentList 'run','dev' -PassThru -NoNewWindow
      $script:STARTED_PIDS += $p.Id
    }
  }

  Write-Output "Run script active. Close this terminal to stop."
  while ($true) {
    Start-Sleep -Seconds 5
  }
} finally {
  Stop-Started
}