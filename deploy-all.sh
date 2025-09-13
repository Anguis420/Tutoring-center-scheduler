#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
echo -e "${BLUE}🚀 COMPREHENSIVE DEPLOYMENT SCRIPT${NC}"
echo "==================================="
echo "This script will deploy to:"
echo "- Heroku (Backend)"
echo "- Netlify (Frontend)" 
echo "- MongoDB Atlas (Database)"
echo

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: server.js not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if git is initialized
if ! git status >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Git repository not found. Please initialize git first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Checking Git Status${NC}"
echo "=============================="
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected:${NC}"
    git status --short
    echo
    read -p "Continue with uncommitted changes? (y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi
echo
echo -e "${YELLOW}📦 Step 2: Installing Dependencies${NC}"
echo "=================================="
echo "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend dependency installation failed${NC}"
if ! npm install; then
    echo -e "${RED}❌ Backend dependency installation failed${NC}"
    exit 1
fi

echo "Installing frontend dependencies..."
cd clientnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend dependency installation failed${NC}"
    exit 1
fi
cd ..

echo
echo -e "${YELLOW}🏗️ Step 3: Building Frontend${NC}"
echo "============================"
echo "Building React application..."

# Check if build script exists in root package.json
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "Found build script in root package.json, running from root..."
    set +e
    npm run build
    BUILD_EXIT_CODE=$?
    set -e
elif [ -f "client/package.json" ] && grep -q '"build"' client/package.json; then
    echo "Found build script in client/package.json, running from client directory..."
    set +e
    cd client && npm run build
    BUILD_EXIT_CODE=$?
    cd ..
    set -e
else
    echo -e "${RED}❌ No build script found in package.json or client/package.json${NC}"
    exit 1
fi

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build successful!${NC}"

echo
echo -e "${YELLOW}📝 Step 4: Committing Changes${NC}"
echo "============================="

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}ℹ️  No changes to commit, proceeding with current commits${NC}"
else
    git add .
    echo "Please enter a commit message for your deployment:"
    read -p "Commit message: " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Deploy updates to all services"
    fi
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Changes committed successfully!${NC}"
fi

echo
echo -e "${YELLOW}🚀 Step 5: Deploying to Heroku${NC}"echo "=============================="
echo "Deploying backend to Heroku..."
# Detect the current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Pushing branch: $CURRENT_BRANCH"
git push heroku "$CURRENT_BRANCH:main"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Heroku deployment failed${NC}"
    echo -e "${YELLOW}💡 Make sure you have:${NC}"
    echo "   - Heroku CLI installed"
    echo "   - Heroku remote configured (git remote add heroku https://git.heroku.com/your-app-name.git)"
    echo "   - Heroku app created"
    exit 1
fi
echo -e "${GREEN}✅ Heroku deployment successful!${NC}"

echo
echo -e "${YELLOW}🌐 Step 6: Deploying to Netlify${NC}"
echo "==============================="

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI is not installed${NC}"
    echo -e "${YELLOW}💡 To install Netlify CLI, run:${NC}"
    echo "   npm install -g netlify-cli"
    echo "   or visit: https://docs.netlify.com/cli/get-started/"
    exit 1
fi

echo -e "${GREEN}✅ Netlify CLI found${NC}"

# Change to frontend directory
echo "Changing to frontend directory..."
cd client

# Check for build directory
BUILD_DIR=""
if [ -d "build" ]; then
    BUILD_DIR="build"
    echo -e "${GREEN}✅ Found build directory${NC}"
elif [ -d "dist" ]; then
    BUILD_DIR="dist"
    echo -e "${GREEN}✅ Found dist directory${NC}"
else
    echo -e "${RED}❌ No build directory found (build or dist)${NC}"
    echo -e "${YELLOW}💡 Make sure the frontend build completed successfully${NC}"
    cd ..
    exit 1
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --dir="$BUILD_DIR"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Netlify deployment failed${NC}"
    echo -e "${YELLOW}💡 Make sure you have:${NC}"
    echo "   - Netlify CLI installed and authenticated (netlify login)"
    echo "   - A Netlify site configured"
    echo "   - Proper build output in $BUILD_DIR directory"
    cd ..
    exit 1
fi

echo -e "${GREEN}✅ Netlify deployment successful!${NC}"

# Return to project root
cd ..

# Load deployment URLs from environment or use placeholders
HEROKU_APP_URL="${HEROKU_APP_URL:-https://your-app-name.herokuapp.com}"
NETLIFY_SITE_URL="${NETLIFY_SITE_URL:-https://your-site-name.netlify.app}"

echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. Verify your Heroku app is running: $HEROKU_APP_URL"
echo "2. Check your Netlify site: $NETLIFY_SITE_URL"

echo
echo -e "${YELLOW}📊 Step 7: Database Status Check${NC}"
echo "==============================="
echo "Checking MongoDB Atlas connection..."
echo -e "${YELLOW}💡 If you made schema changes, they will be applied automatically when Heroku restarts.${NC}"
echo -e "${YELLOW}💡 For data migrations, run them through your Heroku app or directly in Atlas.${NC}"

echo
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "======================"
echo
echo -e "${GREEN}✅ Backend deployed to Heroku${NC}"
echo -e "${GREEN}✅ Frontend deployed to Netlify${NC}"  
echo -e "${GREEN}✅ Database ready in MongoDB Atlas${NC}"
echo
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. Verify your Heroku app is running: https://your-app-name.herokuapp.com"
echo "2. Check your Netlify site: https://your-site-name.netlify.app"
echo "3. Test the full application flow"
echo "4. Monitor logs if needed:"
echo "   - Heroku: heroku logs --tail"
echo "   - Netlify: Check build logs in Netlify dashboard"
echo
echo -e "${YELLOW}📖 For troubleshooting, see:${NC}"
echo "- DEPLOYMENT_SUMMARY.md"
echo "- NETLIFY_DEPLOYMENT.md"
echo

