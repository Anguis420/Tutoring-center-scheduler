# 🚀 Complete Deployment Setup Guide

This guide will help you set up automated deployment to all three services: **Heroku**, **Netlify**, and **MongoDB Atlas**.

## 📋 Prerequisites

### 1. **Heroku Setup**
```bash
# Install Heroku CLI
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
# Mac: brew install heroku/brew/heroku
# Linux: curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create a new Heroku app (replace 'your-app-name' with your desired name)
heroku create your-app-name

# Add Heroku remote to your git repository
git remote add heroku https://git.heroku.com/your-app-name.git

# Set environment variables in Heroku
heroku config:set MONGODB_URI="your-mongodb-atlas-connection-string"
heroku config:set JWT_SECRET="your-super-secret-jwt-key"
heroku config:set NODE_ENV="production"
```

### 2. **Netlify Setup**
1. Go to [Netlify](https://app.netlify.com)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run netlify-build`
   - **Publish directory**: `client/build`
5. Set environment variables in Netlify dashboard:
   - `REACT_APP_API_URL`: `https://your-heroku-app-name.herokuapp.com/api`

### 3. **MongoDB Atlas Setup**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string
6. Update the connection string in your Heroku environment variables

## 🚀 Using the Deployment Scripts

### **Windows Users**
```bash
# Run the comprehensive deployment script
deploy-all.bat
```

### **Mac/Linux Users**
```bash
# Run the comprehensive deployment script
./deploy-all.sh
```

## 📝 What the Script Does

1. **Checks Git Status** - Ensures you're in a git repository
2. **Installs Dependencies** - Updates both backend and frontend packages
3. **Builds Frontend** - Creates production build of React app
4. **Commits Changes** - Commits all changes with your message
5. **Deploys to Heroku** - Pushes backend to Heroku
6. **Deploys to Netlify** - Builds and prepares frontend for Netlify
7. **Database Check** - Verifies MongoDB Atlas connection

## 🔧 Manual Deployment Steps

If you prefer to deploy manually:

### **Backend to Heroku**
```bash
git add .
git commit -m "Your update message"
git push heroku main
```

### **Frontend to Netlify**
```bash
cd client
npm run build
cd ..
npm run netlify-build
# Then push to your connected Git repository
git push origin main
```

### **Database Updates**
- Schema changes are applied automatically when Heroku restarts
- For data migrations, run scripts through your Heroku app or directly in Atlas

## 🐛 Troubleshooting

### **Heroku Issues**
```bash
# Check Heroku logs
heroku logs --tail

# Check Heroku app status
heroku ps

# Restart Heroku app
heroku restart
```

### **Netlify Issues**
- Check build logs in Netlify dashboard
- Verify environment variables are set correctly
- Ensure build command and publish directory are correct

### **MongoDB Atlas Issues**
- Verify connection string is correct
- Check IP whitelist settings
- Ensure database user has proper permissions

## 📊 Environment Variables Reference

### **Heroku (Backend)**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
PORT=5000
```

### **Netlify (Frontend)**
```
REACT_APP_API_URL=https://your-heroku-app-name.herokuapp.com/api
NODE_ENV=production
```

## 🎯 Quick Commands

```bash
# Deploy everything at once
deploy-all.bat          # Windows
./deploy-all.sh         # Mac/Linux

# Deploy only backend
git push heroku main

# Deploy only frontend
npm run netlify-build

# Check deployment status
heroku logs --tail      # Backend logs
# Check Netlify dashboard for frontend logs
```

## 📞 Support

If you encounter issues:
1. Check the logs using the commands above
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check the troubleshooting section above

