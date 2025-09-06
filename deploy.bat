@echo off
echo 🚀 Deploying Tutoring Center Scheduler to Netlify...
echo.

echo 📦 Building the application...
call npm run netlify-build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.
echo 🌐 Now deploy to Netlify:
echo 1. Go to https://app.netlify.com
echo 2. Click "New site from Git"
echo 3. Choose GitHub and select your repo
echo 4. Set build command: npm run netlify-build
echo 5. Set publish directory: client/build
echo 6. Click "Deploy site"
echo.
echo 🔧 Before building on Netlify, set environment variable:
echo - Key: REACT_APP_API_URL
echo - Value: Your backend URL (e.g., https://api.example.com)
echo   Note: CRA embeds REACT_APP_* at build time; changing it requires triggering a new deploy.
echo.echo 📖 See deploy-to-netlify.md for detailed instructions
echo.
pause
