@echo off
title Deploy Catch the Phish to Vercel
echo ========================================================
echo   Catch the Phish - 1-Click Vercel Deployment
echo   Target Account: 2025a7r052@mietjammu.in
echo ========================================================
echo.

cd /d "%~dp0\frontend"

echo [*] Step 1: Building production frontend package...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [!] Build failed! Please review the error above.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 2: Deploying to Vercel Production...
call npx.cmd vercel --prod

echo.
echo ========================================================
echo   All Done! Your live Vercel domain is ready above.
echo ========================================================
pause
