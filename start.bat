@echo off
title MarketMind India Launcher
echo ===================================================
echo Starting MarketMind India Full-Stack Platform...
echo ===================================================

if exist frontend\.next (
    echo Cleaning stale Next.js cache...
    rd /s /q frontend\.next >nul 2>&1
)

echo Pre-compiling Tailwind styles...
cd frontend
call npx.cmd tailwindcss -i ./src/app/globals.css -o ./public/globals.compiled.css --minify >nul 2>&1
cd ..

echo [1/2] Launching FastAPI Backend on http://localhost:8000...
start "MarketMind Backend (Port 8000)" cmd /k "python run_backend.py"

echo [2/2] Launching Next.js Frontend on http://localhost:3000...
start "MarketMind Frontend (Port 3000)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo ===================================================
echo Both services are booting up!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - API Docs: http://localhost:8000/docs
echo.
echo Note: If your browser shows unstyled cached content,
echo press Ctrl + F5 (Hard Refresh) to clear the browser cache.
echo ===================================================
ping 127.0.0.1 -n 3 >nul
