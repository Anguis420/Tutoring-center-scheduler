@echo off
REM Comprehensive process and port cleanup script for Windows
REM This script handles all scenarios where ports don't get released

echo 🔍 Checking for running processes on ports 3000 and 3001...

REM Function to kill processes by port
:kill_by_port
set port=%1
echo 🔫 Killing processes on port %port%...

REM Find processes using the port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%port%"') do (
    echo Found process %%a on port %port%
    echo Attempting graceful termination...
    taskkill /PID %%a /T 2>nul
    timeout /t 2 /nobreak >nul
    
    REM Force kill if still running
    taskkill /PID %%a /F /T 2>nul
)

REM Wait for cleanup
timeout /t 1 /nobreak >nul

REM Verify port is free
netstat -ano | findstr ":%port%" >nul
if %errorlevel% equ 0 (
    echo ❌ Port %port% still in use
) else (
    echo ✅ Port %port% is now free
)
goto :eof

REM Function to kill Node.js processes
:kill_node_processes
echo 🔫 Killing all Node.js processes...

REM Kill by process name
taskkill /IM node.exe /F /T 2>nul
taskkill /IM nodemon.exe /F /T 2>nul
taskkill /IM npm.exe /F /T 2>nul

REM Kill by port
call :kill_by_port 3000
call :kill_by_port 3001

REM Wait for cleanup
timeout /t 2 /nobreak >nul
goto :eof

REM Function to kill processes by pattern
:kill_by_pattern
set pattern=%1
echo 🔫 Killing processes matching pattern: %pattern%

REM Find and kill processes
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| findstr /V "INFO"') do (
    echo Found Node.js process %%a
    taskkill /PID %%a /F /T 2>nul
)
goto :eof

REM Function to verify ports are free
:verify_ports
echo ✅ Verifying ports are free...

netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo ❌ Port 3000 still in use
    netstat -ano | findstr ":3000"
    goto :ports_not_free
)

netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo ❌ Port 3001 still in use
    netstat -ano | findstr ":3001"
    goto :ports_not_free
)

echo ✅ All ports are free!
goto :ports_free

:ports_not_free
echo ⚠️  WARNING: Some ports may still be in use.
echo Try running this script again or restart your computer.
goto :end

:ports_free
echo 🎉 SUCCESS: All processes killed and ports released!
echo You can now start your server and client.
goto :end

REM Main execution
echo 🚀 Starting comprehensive process cleanup...
echo ========================================

REM Step 1: Kill Node.js processes
call :kill_node_processes

REM Step 2: Kill by specific patterns
call :kill_by_pattern "tutoring-center-scheduler"

REM Step 3: Verify
call :verify_ports

:end
echo ========================================
pause
