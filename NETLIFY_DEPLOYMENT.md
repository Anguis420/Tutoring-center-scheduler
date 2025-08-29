# Netlify Deployment Guide

This guide will help you deploy your Tutoring Center Scheduler to Netlify.

## Prerequisites

- GitHub repository with your code
- Netlify account
- Backend server deployed separately (Heroku, Railway, Render, etc.)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository contains:
- `netlify.toml` - Netlify configuration
- `client/public/_redirects` - SPA routing support
- All necessary source code

### 2. Deploy to Netlify

#### Option A: Connect to GitHub (Recommended)

1. Go to [Netlify](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run netlify-build`
   - **Publish directory**: `client/build`
5. Click "Deploy site"

#### Option B: Manual Deploy

1. Run locally: `npm run netlify-build`
2. Upload the `client/build` folder to Netlify

### 3. Environment Variables

Set these in Netlify dashboard under Site settings > Environment variables:

```
NODE_ENV=production
REACT_APP_API_URL=https://your-backend-domain.com
```

### 4. Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

## Build Process

The build process:
1. Installs dependencies: `npm install`
2. Installs client dependencies: `cd client && npm install`
3. Builds React app: `npm run build:netlify`
4. Publishes `client/build` directory

## SPA Routing

The `_redirects` file ensures all routes work correctly:
```
/*    /index.html   200
```

## Performance Optimizations

- Static assets are cached for 1 year
- JavaScript and CSS files are optimized
- Source maps are disabled for production builds

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Routing Issues
- Ensure `_redirects` file is in `client/public/`
- Verify `netlify.toml` has correct redirects

### API Connection Issues
- Check `REACT_APP_API_URL` environment variable
- Ensure backend is accessible from Netlify
- Verify CORS settings on backend

## Backend Deployment

Your backend needs to be deployed separately. Options include:
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Simple deployment with built-in database
- **Render**: Free tier available
- **DigitalOcean**: More control, requires setup

## Monitoring

- Netlify provides build logs and deployment status
- Set up notifications for failed deployments
- Monitor site performance in Netlify dashboard

## Support

For issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test locally with `npm run build:netlify`
4. Check Netlify documentation
