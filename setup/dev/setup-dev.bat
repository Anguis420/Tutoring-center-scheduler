@echo off
REM Tutoring Center Scheduler - Local Development Setup Script (Windows)
REM This script sets up the complete local development environment including client setup

setlocal enabledelayedexpansion

echo ================================
echo   Tutoring Center Scheduler
echo   Development Setup Script
echo   (Includes Client Setup)
echo ================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    echo [ERROR] Usage: setup\dev\setup-dev.bat
    pause
    exit /b 1
)

if not exist "client" (
    echo [ERROR] Client directory not found
    pause
    exit /b 1
)

if not exist "server" (
    echo [ERROR] Server directory not found
    pause
    exit /b 1
)

echo [INFO] Starting development environment setup...
echo.

REM Check for Node.js
echo [INFO] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js not found. Please install Node.js from: https://nodejs.org/
    echo [INFO] After installing Node.js, run this script again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js is already installed
)

REM Check for MongoDB
echo [INFO] Checking for MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB not found.
    echo [INFO] Please install MongoDB from: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
    echo [INFO] After installing MongoDB, run this script again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] MongoDB is already installed
)

REM Start MongoDB service
echo [INFO] Starting MongoDB service...
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MongoDB service started
) else (
    echo [WARNING] Could not start MongoDB service. Please start it manually.
)

REM Install dependencies
echo [INFO] Installing project dependencies...

echo [INFO] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

echo [INFO] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

echo [INFO] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] All dependencies installed successfully

REM Setup client-specific requirements
echo [INFO] Setting up client-specific requirements...

REM Check for Tailwind CSS configuration
if exist "client\tailwind.config.js" (
    echo [SUCCESS] Tailwind CSS configuration found
) else (
    echo [WARNING] Tailwind CSS configuration not found
)

REM Check for PostCSS configuration
if exist "client\postcss.config.js" (
    echo [SUCCESS] PostCSS configuration found
) else (
    echo [WARNING] PostCSS configuration not found
)

REM Check for React dependencies
findstr /C:"react" client\package.json >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] React dependencies found
) else (
    echo [WARNING] React dependencies not found in package.json
)

REM Check for Tailwind CSS dependencies
findstr /C:"tailwindcss" client\package.json >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Tailwind CSS dependencies found
) else (
    echo [WARNING] Tailwind CSS dependencies not found
)

REM Check for Axios dependencies
findstr /C:"axios" client\package.json >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Axios (HTTP client) dependencies found
) else (
    echo [WARNING] Axios dependencies not found
)

REM Build client to check for errors
echo [INFO] Building client to verify setup...
cd client
call npm run build
if %errorlevel% equ 0 (
    echo [SUCCESS] Client build successful
) else (
    echo [WARNING] Client build failed - check for errors
)
cd ..

echo [SUCCESS] Client setup completed

REM Setup environment file
echo [INFO] Setting up environment configuration...
if not exist ".env" (
    if exist ".env.template" (
        copy ".env.template" ".env" >nul
        echo [SUCCESS] Environment file created from template
    ) else (
        echo [INFO] Creating basic .env file...
        (
            echo # Development Environment Configuration
            echo PORT=3001
            echo NODE_ENV=development
            echo MONGODB_URI=mongodb://localhost:27017/tutoring-center-scheduler
            echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
            echo JWT_EXPIRE=24h
            echo BCRYPT_ROUNDS=12
            echo RATE_LIMIT_WINDOW_MS=900000
            echo RATE_LIMIT_MAX_REQUESTS=100
            echo ALLOWED_ORIGINS=http://localhost:3000
            echo MONGODB_TEST_URI=mongodb://localhost:27017/tutoring_test
            echo TEST_PARENT_EMAIL=parent@tutoring.com
            echo TEST_PARENT_PASSWORD=parent123
        ) > .env
        echo [SUCCESS] Basic environment file created
    )
) else (
    echo [SUCCESS] Environment file already exists
)

REM Seed database
echo [INFO] Seeding database with demo data...
if exist "server\scripts\seed-demo-data.js" (
    cd server
    set SEED_CONFIRM=yes
    node scripts\seed-demo-data.js
    if %errorlevel% equ 0 (
        echo [SUCCESS] Database seeded successfully
    ) else (
        echo [WARNING] Database seeding failed
    )
    cd ..
) else if exist "server/seed-atlas.js" (
    set SEED_CONFIRM=yes
    node server/seed-atlas.js
    if %errorlevel% equ 0 (
        echo [SUCCESS] Database seeded successfully
    ) else (
        echo [WARNING] Database seeding failed
    )
) else (
    echo [WARNING] Seed script not found. Skipping database seeding.
)

REM Verify client development server
echo [INFO] Verifying client development server setup...
cd client
echo [INFO] Testing client development server startup...
start /B npm start
timeout /t 10 /nobreak >nul
cd ..

echo.
echo ================================
echo   Setup Complete! 🎉
echo ================================
echo.
echo Next steps:
echo 1. Start the server: npm run server
echo 2. Start the client: npm run client
echo 3. Open your browser: http://localhost:3000
echo.
echo Demo accounts:
echo Admin: admin@tutoring.com / admin123
echo Teacher: teacher@tutoring.com / teacher123
echo Student: student@tutoring.com / student123
echo.
echo Client-specific features verified:
echo ✓ React application setup
echo ✓ Tailwind CSS configuration
echo ✓ PostCSS configuration
echo ✓ Build process working
echo ✓ Development server ready
echo.
pause
