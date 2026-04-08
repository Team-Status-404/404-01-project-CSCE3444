@echo off
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────
::  StockIQ — Windows setup
::  Usage: double-click or run in Command Prompt
:: ─────────────────────────────────────────────

title StockIQ Dev Setup

echo.
echo  ══════════════════════════════════════════
echo   StockIQ Dev Setup  (Windows)
echo  ══════════════════════════════════════════
echo.

:: ── prerequisite checks ──────────────────────

echo [init] Checking prerequisites...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [error] Python not found.
    echo         Install it from https://python.org
    echo         Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [error] Node.js not found.
    echo         Install it from https://nodejs.org and re-run this script.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [error] npm not found. It ships with Node — check your Node installation.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo [init] Python : %%v
for /f "tokens=*" %%v in ('node --version')           do echo [init] Node   : %%v
for /f "tokens=*" %%v in ('npm --version')            do echo [init] npm    : %%v

:: ── backend ──────────────────────────────────

echo.
echo [init] Setting up backend...

cd backend

if not exist "venv\" (
    echo [init] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [error] Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo [init] Virtual environment already exists, skipping creation.
)

echo [init] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [error] pip install failed. Check your internet connection and try again.
    pause
    exit /b 1
)

if not exist ".env" (
    copy .env.example .env >nul
    echo [warn] backend\.env created — open it and fill in:
    echo [warn]   DB_PASSWORD        ^(ask Lance^)
    echo [warn]   NEWSDATA_API_KEY   ^(newsdata.io dashboard^)
    echo [warn]   GOOGLE_CLIENT_ID   ^(Google Cloud Console^)
) else (
    echo [init] backend\.env already exists, skipping.
)

call deactivate
cd ..

:: ── frontend ─────────────────────────────────

echo.
echo [init] Setting up frontend...

cd frontend

echo [init] Installing Node dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [error] npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
)

if not exist ".env" (
    copy .env.example .env >nul
    echo [warn] frontend\.env created — open it and fill in:
    echo [warn]   VITE_GOOGLE_CLIENT_ID   ^(same as GOOGLE_CLIENT_ID above^)
) else (
    echo [init] frontend\.env already exists, skipping.
)

cd ..

:: ── done ─────────────────────────────────────

echo.
echo  ══════════════════════════════════════════
echo   All done! Here's how to run the app:
echo  ══════════════════════════════════════════
echo.
echo   Terminal 1 - Backend:
echo     cd backend
echo     venv\Scripts\activate
echo     python app.py
echo.
echo   Terminal 2 - Frontend:
echo     cd frontend
echo     npm run dev
echo.
echo   Then open http://localhost:5173 in your browser.
echo.
pause
