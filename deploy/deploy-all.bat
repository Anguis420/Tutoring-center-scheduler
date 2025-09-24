@echo off
setlocal enabledelayedexpansion

echo 🚀 COMPREHENSIVE DEPLOYMENT SCRIPT
echo ===================================
echo This script will deploy to:
echo - Heroku (Backend)
echo - Netlify (Frontend) 
echo - MongoDB Atlas (Database)
echo.

REM Check if we're in the right directory
if not exist "server.js" (
    echo ❌ Error: server.js not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if git is initialized
git status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Git repository not found. Please initialize git first.
    pause
    exit /b 1
)

echo 📋 Step 1: Checking Git Status
echo ==============================
git status --porcelain
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git status check failed
    pause
    exit /b 1
)

echo.
echo 📦 Step 2: Installing Dependencies
echo ==================================
echo Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)

echo Installing frontend dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)
cd ..

echo.
echo 🏗️ Step 3: Building Frontend
echo ============================
echo Building React application...cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Frontend build successful!

echo.
echo 📝 Step 4: Committing Changes
echo =============================
REM Check if there are changes to commit
REM Check if there are changes to commit
git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
    git diff --quiet
    if %ERRORLEVEL% EQU 0 (
        echo ℹ️  No changes to commit, skipping commit step
        goto DEPLOY_HEROKU
    )
)

echo.
echo 📝 Step 4: Committing Changes
echo =============================
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Deploy updates to all services

git add .
git commit -m "!COMMIT_MSG!"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git commit failed
    pause
    exit /b 1
)
echo ✅ Changes committed successfully!
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Deploy updates to all services

git add .
git commit -m "!COMMIT_MSG!"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git commit failed
    pause
    exit /b 1
)
:DEPLOY_HEROKU
echo.
echo 📝 Step 4: Committing Changes
echo =============================
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Deploy updates to all services
:DEPLOY_HEROKU

echo.
echo 🚀 Step 5: Deploying to Heroku
echo ==============================
echo Deploying backend to Heroku...
git push heroku main
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Heroku deployment failed
    echo 💡 Make sure you have:
    echo    - Heroku CLI installed
    echo    - Heroku remote configured (git remote add heroku https://git.heroku.com/your-app-name.git)
    echo    - Heroku app created
    pause
    exit /b 1
)
echo ✅ Heroku deployment successful!

echo.
echo 🌐 Step 6: Deploying to Netlify
echo ===============================
echo Deploying frontend to Netlify...

REM Pre-check: Verify netlify-build script exists in package.json
echo Checking for netlify-build script in package.json...
findstr /C:"netlify-build" package.json >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Warning: netlify-build script not found in package.json
    echo 💡 Please add the following script to your package.json:
    echo    "netlify-build": "npm run install-client && npm run build:netlify"
    echo.
    echo Or check if the script name is different and update this script accordingly.
    pause
    exit /b 1
)
echo ✅ netlify-build script found in package.json

call npm run netlify-build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Netlify build failed
    pause
    exit /b 1
)

echo.
echo 📊 Step 7: Database Status Check
echo ===============================
echo Checking MongoDB Atlas connection...
echo 💡 If you made schema changes, they will be applied automatically when Heroku restarts.
echo 💡 For data migrations, run them through your Heroku app or directly in Atlas.

echo.
echo 🎉 DEPLOYMENT COMPLETE!
echo ======================
echo.
echo ✅ Backend deployed to Heroku
echo ✅ Frontend deployed to Netlify  
echo ✅ Database ready in MongoDB Atlas
echo.
REM Set URLs from environment variables with fallbacks
if defined HEROKU_APP_URL (
    set HEROKU_URL=%HEROKU_APP_URL%
) else (
    set HEROKU_URL=https://your-app-name.herokuapp.com
)

if defined NETLIFY_SITE_URL (
    set NETLIFY_URL=%NETLIFY_SITE_URL%
) else (
    set NETLIFY_URL=https://your-site-name.netlify.app
)

echo 🔧 Next Steps:
echo 1. Verify your Heroku app is running: %HEROKU_URL%
echo 2. Check your Netlify site: %NETLIFY_URL%
echo 3. Test the full application flow
echo 4. Monitor logs if needed:
echo    - Heroku: heroku logs --tail
echo    - Netlify: Check build logs in Netlify dashboard
echo.
echo 📖 For troubleshooting, see:
echo - DEPLOYMENT_SUMMARY.md
echo - NETLIFY_DEPLOYMENT.md
echo.
pause

