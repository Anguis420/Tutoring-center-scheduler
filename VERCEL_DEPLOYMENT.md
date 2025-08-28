# 🚀 Vercel Deployment Guide

This guide will help you deploy your Tutoring Center Scheduler to Vercel successfully.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster for production

## 🔧 Environment Variables Setup

Before deploying, you need to set up these environment variables in Vercel:

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tutoring-center-scheduler

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRE=7d

# Server Configuration
NODE_ENV=production
PORT=5000

# CORS (replace with your Vercel domain)
CORS_ORIGIN=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with the appropriate values

## 🚀 Deployment Steps

### 1. Connect Your Repository

1. **Import Git Repository** in Vercel
2. **Select the repository** containing your code
3. **Choose the main branch** (usually `main` or `master`)

### 2. Configure Build Settings

Vercel will automatically detect the configuration from `vercel.json`, but you can verify these settings:

- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/build`
- **Install Command**: `npm install`

### 3. Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Check the deployment logs for any errors

## 🔍 Troubleshooting Common Issues

### Issue: "react-scripts: command not found"

**Solution**: This is now fixed with the updated `vercel.json` and build scripts.

### Issue: Build fails with dependency errors

**Solution**: 
1. Check that all dependencies are in `package.json`
2. Ensure `react-scripts` is in `client/package.json`
3. Verify the build command is correct

### Issue: API routes not working

**Solution**:
1. Check that environment variables are set correctly
2. Verify MongoDB connection string
3. Check CORS configuration

### Issue: React app shows 404 on refresh

**Solution**: This is now fixed with the updated server.js routing configuration.

## 📁 File Structure for Vercel

```
your-project/
├── vercel.json              # Vercel configuration
├── .vercelignore            # Files to ignore during deployment
├── package.json             # Root dependencies and scripts
├── server.js               # Express server
├── client/
│   ├── package.json        # React dependencies
│   ├── src/                # React source code
│   └── public/             # Static files
└── routes/                 # API routes
```

## 🔄 Deployment Workflow

### 1. Development
```bash
# Local development
npm run dev:full
```

### 2. Testing Build Locally
```bash
# Test production build
npm run build
npm start
```

### 3. Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Vercel will automatically deploy from GitHub
```

## 🌐 Post-Deployment

### 1. Verify Deployment
- Check that your app loads correctly
- Test API endpoints
- Verify database connections

### 2. Set Up Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

### 3. Monitor Performance
- Use Vercel Analytics
- Monitor API response times
- Check error logs

## 🚨 Important Notes

1. **MongoDB Atlas**: Ensure your MongoDB Atlas cluster allows connections from Vercel's IP ranges
2. **Environment Variables**: Never commit sensitive information to your repository
3. **Build Time**: The first build may take longer due to dependency installation
4. **Cold Starts**: Vercel functions may have cold starts, especially for the first request

## 📞 Support

If you encounter issues:

1. **Check Vercel Build Logs** for specific error messages
2. **Verify Environment Variables** are set correctly
3. **Test Locally** with `npm run build` and `npm start`
4. **Check MongoDB Connection** and network access

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

**Happy Deploying! 🎉** 