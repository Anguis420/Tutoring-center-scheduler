@echo off
REM Test runner script for appointment creation tests (Windows)
REM This script sets up the test environment and runs the tests

echo 🧪 Starting Appointment Creation Tests...
echo ========================================

REM Set test environment
set NODE_ENV=test
set MONGODB_TEST_URI=mongodb://localhost:27017/tutoring_test

REM Check if MongoDB is running
echo 📡 Checking MongoDB connection...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running. Please start MongoDB first.
    echo    On Windows: net start MongoDB
    echo    Or start MongoDB Compass
    pause
    exit /b 1
)

echo ✅ MongoDB is running

REM Install test dependencies if not already installed
echo 📦 Installing test dependencies...
npm install --silent

REM Run the tests
echo 🚀 Running appointment creation tests...
echo.

REM Run specific test files
echo Testing Appointment Model...
npx jest tests/models/appointment.test.js --config=tests/jest.config.js

echo.
echo Testing Appointment API Routes...
npx jest tests/routes/appointments.test.js --config=tests/jest.config.js

echo.
echo 🎉 All tests completed!
echo ========================================
pause
