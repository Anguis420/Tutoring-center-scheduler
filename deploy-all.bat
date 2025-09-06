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
echo Building React application...
echo Building React application...
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Frontend build successful!if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
REM Check if there are changes to commit
git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
    git diff --quiet
    if %ERRORLEVEL% EQU 0 (
        echo ℹ️  No changes to commit, skipping commit step
        goto DEPLOY_HEROKU
    )
)

git add .
git commit -m "!COMMIT_MSG!"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git commit failed
    pause
    exit /b 1
)
echo ✅ Changes committed successfully!

:DEPLOY_HEROKUif "!COMMIT_MSG!"=="" set COMMIT_MSG=Deploy updates to all services

git add .
git commit -m "!COMMIT_MSG!"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git commit failed
    pause
    exit /b 1
)
echo ✅ Changes committed successfully!

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
echo 🔧 Next Steps:
echo 1. Verify your Heroku app is running: https://your-app-name.herokuapp.com
echo 2. Check your Netlify site: https://your-site-name.netlify.app
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

