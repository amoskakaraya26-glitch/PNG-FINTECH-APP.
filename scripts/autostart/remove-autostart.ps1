$taskName = "PNGFintechAppAutoStart"

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Output "Scheduled task not found: $taskName"
  exit 0
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Output "Removed scheduled task: $taskName"
