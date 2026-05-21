@echo off
title APPONCOHB - Oncologia Integrada
color 0A
cls
echo.
echo  ================================================
echo    APPONCOHB - Oncologia Integrada
echo    Hospital do Bem - Dr. Silas Negrao
echo  ================================================
echo.

REM Mata processo anterior na porta 3001 se houver
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  Iniciando servidor...
echo.

REM Inicia o backend (serve frontend + API)
cd /d "%~dp0"
set NODE_ENV=production
node server/index.js

pause
