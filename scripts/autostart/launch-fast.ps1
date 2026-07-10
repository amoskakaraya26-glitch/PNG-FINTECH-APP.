$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$existing = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
  exit 0
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
  $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $npmCommand) {
  throw "npm is not available in PATH"
}

Start-Process -FilePath $npmCommand.Source -WorkingDirectory $repoRoot -ArgumentList @("run", "start:fast") -WindowStyle Hidden
