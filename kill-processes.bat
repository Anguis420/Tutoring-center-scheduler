@echo off
REM Node.js Process Cleanup Script for Windows
REM This script only kills Node.js related processes safely

echo 🔍 Checking for Node.js processes...

REM Function to kill Node.js processes by name
:kill_node_processes
echo 🔫 Killing Node.js processes...

REM Kill Node.js processes
taskkill /IM node.exe /F /T 2>nul
if %errorlevel% equ 0 (
    echo ✅ Killed node.exe processes
) else (
    echo ℹ️  No node.exe processes found
)

REM Kill Nodemon processes
taskkill /IM nodemon.exe /F /T 2>nul
if %errorlevel% equ 0 (
    echo ✅ Killed nodemon.exe processes
) else (
    echo ℹ️  No nodemon.exe processes found
)

REM Kill npm processes
taskkill /IM npm.exe /F /T 2>nul
if %errorlevel% equ 0 (
    echo ✅ Killed npm.exe processes
) else (
    echo ℹ️  No npm.exe processes found
)

REM Wait for cleanup
timeout /t 2 /nobreak >nul
goto :eof

REM Function to verify Node.js processes are killed
:verify_node_processes
echo ✅ Verifying Node.js processes are terminated...

REM Check for remaining Node.js processes
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ Some node.exe processes still running
    tasklist /FI "IMAGENAME eq node.exe"
    goto :processes_still_running
)

tasklist /FI "IMAGENAME eq nodemon.exe" 2>nul | findstr "nodemon.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ Some nodemon.exe processes still running
    tasklist /FI "IMAGENAME eq nodemon.exe"
    goto :processes_still_running
)

tasklist /FI "IMAGENAME eq npm.exe" 2>nul | findstr "npm.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ Some npm.exe processes still running
    tasklist /FI "IMAGENAME eq npm.exe"
    goto :processes_still_running
)

echo ✅ All Node.js processes terminated successfully!
goto :processes_killed

:processes_still_running
echo ⚠️  WARNING: Some Node.js processes may still be running.
echo Try running this script again or manually kill them.
goto :end

:processes_killed
echo 🎉 SUCCESS: All Node.js processes killed!
echo You can now start your server and client safely.
goto :end

REM Main execution
echo 🚀 Starting Node.js process cleanup...
echo ========================================

REM Step 1: Kill Node.js processes
call :kill_node_processes

REM Step 2: Verify
call :verify_node_processes

:end
echo ========================================
pause