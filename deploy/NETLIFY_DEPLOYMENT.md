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
3. Builds React app: `npm run netlify-build`
4. Publishes `client/build` directory

### Node.js Version Pinning

To ensure consistent builds, pin your Node.js version to 18:

**Option 1: Using netlify.toml (Recommended)**
Add a `[build.environment]` section to your `netlify.toml`:

```toml
[build.environment]
  NODE_VERSION = "18"
  GENERATE_SOURCEMAP = "false"
```

**Option 2: Using .nvmrc file**
Create a `.nvmrc` file in your project root containing:
```
18
```

This ensures CI builds use Node 18+ and prevents build failures due to Node version mismatches.

## SPA Routing

The `_redirects` file ensures all routes work correctly:
```
/*    /index.html   200
```

## Performance Optimizations

### Static Asset Caching
Static assets are cached for 1 year using Cache-Control headers configured in `netlify.toml`:

```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Content-Type = "application/javascript"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Content-Type = "text/css"
    Cache-Control = "public, max-age=31536000, immutable"
```

### Source Map Configuration
Source maps are disabled for production builds by setting the `GENERATE_SOURCEMAP` environment variable in `netlify.toml`:

```toml
[build]
  command = "npm run netlify-build"
  publish = "client/build"

[build.environment]
  NODE_VERSION = "18"
  GENERATE_SOURCEMAP = "false"
```

**Alternative method:** You can also set this environment variable in the Netlify site UI:
1. Go to Site settings → Environment variables
2. Add new variable: `GENERATE_SOURCEMAP` = `false`

### Verification Steps
After deployment, verify the configuration:

1. **Check caching headers:**
   ```bash
   curl -I https://your-site.netlify.app/static/js/main.xyz.js
   ```
   Look for: `Cache-Control: public, max-age=31536000, immutable`

2. **Verify source maps are disabled:**
   - Open browser dev tools → Sources tab
   - Confirm no `.map` files are loaded
   - Check Network tab for any `.map` file requests (should be 404)

3. **Redeploy if needed:**
   - After making changes to `netlify.toml`, trigger a new deployment
   - Or push changes to your connected Git repository

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+) - ensure NODE_VERSION is set in netlify.toml or .nvmrc file exists
- Verify all dependencies are in package.json
- Check build logs for specific errors
- Ensure build command (`npm run netlify-build`) and publish directory (`client/build`) are correctly configured

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
3. Test locally with `npm run netlify-build`
4. Check Netlify documentation
