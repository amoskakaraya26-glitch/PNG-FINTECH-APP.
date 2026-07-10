# PNG Fintech App - PowerShell Start Script
# This script starts PostgreSQL, runs migrations, and launches the app

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PNG Fintech E-Wallet - Start Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check and start PostgreSQL
Write-Host "[1/4] Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "PostgreSQL*" -ErrorAction SilentlyContinue

if (-not $pgService) {
    Write-Host "[ERROR] PostgreSQL service not found." -ForegroundColor Red
    Write-Host "`nPlease ensure PostgreSQL is installed and configure the service." -ForegroundColor Yellow
    Write-Host "You can start PostgreSQL manually:" -ForegroundColor Yellow
    Write-Host "  - Open Services (services.msc)" -ForegroundColor White
    Write-Host "  - Find 'PostgreSQL' service" -ForegroundColor White
    Write-Host "  - Right-click and select 'Start'" -ForegroundColor White
    Read-Host "`nPress Enter to exit"
    exit 1
}

# Start the service if not already running
if ($pgService.Status -ne "Running") {
    Write-Host "[INFO] Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "[OK] PostgreSQL service is running." -ForegroundColor Green

# Step 2: Wait for PostgreSQL to be ready
Write-Host "`n[2/4] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 15
$attempt = 0

do {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection
        # For PostgreSQL, we use psql command instead
        $pgReady = $false
        
        try {
            & psql -U postgres -h localhost -p 5432 -c "SELECT 1;" 2>$null | Out-Null
            $pgReady = $true
        } catch {
            $pgReady = $false
        }
        
        if ($pgReady) {
            break
        }
        
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 2
        }
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 2
        }
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "[WARNING] PostgreSQL may not be responding, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] PostgreSQL is ready." -ForegroundColor Green
}

# Step 3: Run database migrations
Write-Host "`n[3/4] Running database migrations..." -ForegroundColor Yellow
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

& npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Database migration failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Database migrations completed." -ForegroundColor Green

# Step 4: Start the app
Write-Host "`n[4/4] Starting application servers..." -ForegroundColor Yellow
Write-Host "`nBackend will start on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend will start on: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the servers.`n" -ForegroundColor Yellow

& npm run dev:full
