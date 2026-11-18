@echo off
title Catch the Phish - Launcher
echo ========================================================
echo   Catch the Phish + PHISH TRACE Infrastructure Platform
echo ========================================================
echo.
echo [*] Step 1: Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Catch The Phish - Backend (FastAPI)" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [*] Step 2: Starting React Frontend on http://localhost:5173 ...
start "Catch The Phish - Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo ========================================================
echo   Both servers launched successfully!
echo.
echo   - Web App UI:       http://localhost:5173
echo   - PHISH TRACE:      http://localhost:5173/#phish-trace
echo   - Backend Swagger:  http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause
