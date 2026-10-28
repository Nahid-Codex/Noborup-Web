@echo off
title Noborup E-Commerce Local Server
echo ===================================================
echo   Noborup Full-Stack E-Commerce - Auto Launcher
echo   Kedargonj Bazar, Mujibnagar, Meherpur
echo ===================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on your computer.
    echo Please download and install Node.js LTS from: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
    echo [1/2] Preparing project packages for Windows...
    call npm install
)

echo [2/2] Starting Noborup server at http://localhost:3000 ...
start "" "http://localhost:3000"
call npm run dev
pause
