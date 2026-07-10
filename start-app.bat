@echo off
REM PNG Fintech App - Automated Start Script
REM This script starts PostgreSQL, runs migrations, and launches the app

setlocal enabledelayedexpansion

echo.
echo ========================================
echo PNG Fintech E-Wallet - Start Script
echo ========================================
echo.

REM Step 1: Check if PostgreSQL service exists
echo [1/4] Checking PostgreSQL service...
sc query PostgreSQL >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL service not found. Attempting to start PostgreSQL...
    REM Try to start PostgreSQL if it's installed
    net start PostgreSQL >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] PostgreSQL service could not be started.
        echo Please ensure PostgreSQL is installed and running.
        echo.
        echo You can start PostgreSQL manually:
        echo   - Open Services (services.msc)
        echo   - Find "PostgreSQL" service
        echo   - Right-click and select "Start"
        echo.
        pause
        exit /b 1
    )
) else (
    echo [OK] PostgreSQL service found. Starting...
    net start PostgreSQL >nul 2>&1
    if errorlevel 1 (
        echo [INFO] PostgreSQL may already be running.
    ) else (
        echo [OK] PostgreSQL service started.
    )
)

REM Step 2: Wait for PostgreSQL to be ready
echo.
echo [2/4] Waiting for PostgreSQL to be ready...
timeout /t 3 /nobreak >nul
:pg_check
psql -U postgres -h localhost -p 5432 -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto pg_check
)
echo [OK] PostgreSQL is ready.

REM Step 3: Run database migrations
echo.
echo [3/4] Running database migrations...
cd /d "%~dp0"
call npm run db:migrate
if errorlevel 1 (
    echo [ERROR] Database migration failed.
    pause
    exit /b 1
)
echo [OK] Database migrations completed.

REM Step 4: Start the app
echo.
echo [4/4] Starting application servers...
echo.
echo Backend will start on: http://localhost:3000
echo Frontend will start on: http://localhost:3001
echo.
echo Press Ctrl+C to stop the servers.
echo.

call npm run dev:full

endlocal
