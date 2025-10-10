# Backend Deployment Guide - Render

## 🔥 URGENT FIX FOR CURRENT DEPLOYMENT ISSUE

**Issue**: The current deployment is failing with `Error: Cannot find module '@google/earthengine'`

**Root Cause**: The Google Earth Engine environment variable is not properly set on Render.

**Immediate Fix**:
1. Go to your Render dashboard for this service
2. Navigate to **Environment** tab
3. Add this environment variable:
   - **Key**: `GOOGLE_EARTH_ENGINE_KEY`
   - **Value**: Copy the EXACT content below (as ONE LINE, no spaces or line breaks):
   ```
   {"type":"service_account","project_id":"sih2k25-472714","private_key_id":"0d8ad68a7c9b4ba76d4f43ce19eb9c2df6c761a9","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDlILxwZqBmGsnU\n6oayejSMYaAx2+RbdayvQQhIoTqLMNwdq3s5aqkMP2VTJGB2tbvhyr12HjpheHrM\n6mSRJ/rSS6+D7JHoh16lygVoi1asuiHyIcOOtI63wU+kgeSIRIIz6zLLVF/DfacN\n90fy5XaK/Ly3Dy0oP84yhxU6GxenFwJZdgh2YRoFk3dUlaftgwlJC9xzdbOHCvSb\nUFilf80wd3maxmYj+HZsojEVzzK8DImPQPA4IDfrsKA9iZlZWsPdVxxSqIC/Jttu\nabHe4Nw8sl5cJfp1NWBNS3QUFhlIpAEO3mb9SKY/TkSRV/uz2FaA2CJynlYOJbxg\nKLU/wnltAgMBAAECggEAWJrdtDvDmGiQl2EwQJGog4b3O4C04LdzVXx5FxkeOhhl\nbqXTK6N3BvD3Hn1JPm7N3qWXubc7zViZaGfWBxomUS+KiqIv1HOQ4tzqVYDYvkfm\ne6uZ47QoIqBDS7MdbKLNlQVFqcKRm9gaA3kWXjRlMJ9G3SWlyVRPSVPanhM/BNJS\nMCarXk9E/QQaj6l+o6ccxIF/2acX67PuQ+BN26+VGvAlHtrQX8nqDjPg5b3Y9VaF\nN22wxM74sC2JVdc/5DHBWL2tmV2w6ryK1+/KBill1YIBeF+zwMYjoiG6t5CaArYG\nCgJPkdLrH4BpCNQ47JJOLEkZ7Xv1OhgwhIox+yHeswKBgQD3GPnUYJppPC5wPtP5\niC8EJWcx5hAUoNb+8ZVYgDvipY6kBol26MvE/NZfb/NOtQ+xQ0xQ6a9wUPnZu0aT\nc0HP4gXutSJQhrq1HIIPW1jCeATIA0n2LRH2sbOazg/ODrM+AJ9eoRLNxR0hEkXl\nIh5R8pHA8oGAJWiTZZ6XbUILwwKBgQDtYgXKtZ8PfiUOUd+T6LEfrIWjAp8/Utpj\nMT9ieIkD/1lCmfYFjcTuFUuIVk84IhWaOGFesvchgOxeBKMjhWwgQV5lsRZYTDTC\nRxw/U1HBle5peo91WElEizCvxQ3edqSygnEjj7dt9LBg0DdUKdfuGEUTXeF72e0j\nwlL6lLWDDwKBgQDn+I2JgItVYgcinwj3SI8C8G45nQbZpslPm9Kdu/z8YHpRqEVi\n2Vd6/fXusLWU3Uv3GPvLNibaZVq5uiOeh2RwWXtCRtAJEwKyximfax0fq/apItVL\ng7JKizbWjL6vroM9IO58svBpNrSK+JGfc3FNc1C79631dKkBPzQsaojHawKBgQDU\nHIKQXzmB3nW+Fepxf7rFUqMWxYEGVEJP3/GDS7EioUhg+rGaxNLy6pRTfsvKnKow\n47Adrkyk405RtFMRqmaza7WtqE8PFwkNj/ztmMW09QPTvG/zqq/NT5JxfOKnpdwE\npgnyfLiqx7nSyDqoObt4RLd0Vq7kvBXpnfoHblnCgQKBgHchzdxEiGOYOFo1bZc2\n95zoqf/kckEXoEP6o16dnKT5gUav231dD69DENxUWR8skcIlb25ZK1sOux+axsV6\n9c/40ZsFyOhCG5Y7WEB3dMXo2YqUsirVqna09OWQv+UsYHTKDGQMAhOheMwPdd2S\nL8cmQrGNAfl6Y4V8f85GSje9\n-----END PRIVATE KEY-----\n","client_email":"earth-engine-service-account@sih2k25-472714.iam.gserviceaccount.com","client_id":"107702517431550820627","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/earth-engine-service-account%40sih2k25-472714.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
   ```
4. Click **Save Changes**
5. Render will automatically redeploy

**Why this fixes it**: The backend tries to load Google Earth Engine credentials from environment variable first, then falls back to a file. Since the file is gitignored (security), it's not available in production, so the environment variable is required.

---

## Pre-deployment Checklist ✅

Your backend has been prepared for Render deployment with the following changes:

### 1. Updated Files:
- ✅ `package.json` - Added Node.js version requirement and build script
- ✅ `app.js` - Updated CORS for production environment
- ✅ `utils/geeInit.js` - Added environment variable support for Google Earth Engine
- ✅ `.env.example` - Created environment template
- ✅ `.gitignore` - Added comprehensive ignore rules
- ✅ `render.yaml` - Optional deployment configuration

### 2. Frontend Configuration:
- ✅ Updated `Frontend/src/config/env.ts` for production API URL

## Step-by-Step Deployment Instructions

### Step 1: Prepare Google Earth Engine Credentials
1. Open your `Backend/earth-engine-service-account.json` file
2. Copy the entire JSON content (it should start with `{` and end with `}`)
3. Minify it to a single line (remove all line breaks and spaces)
4. Save this for the environment variable setup

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up/Sign in with your GitHub account
3. Make sure your code is pushed to GitHub (but NOT the service account JSON file)

### Step 3: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository and the branch (usually `main`)
4. **Important**: Set Root Directory to `Backend`

### Step 4: Configure Service Settings
```
Name: CropLab-backend (or your preferred name)
Environment: Node
Region: Choose closest to your users (e.g., Oregon for US West)
Branch: main
Root Directory: Backend
Build Command: npm install
Start Command: npm start
```

### Step 5: Environment Variables Setup
In the Render dashboard, go to **Environment** tab and add these variables:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_jwt_secret_here
OPENWEATHER_API_KEY=your_openweather_api_key
FRONTEND_URL=https://your-vercel-app.vercel.app
GOOGLE_EARTH_ENGINE_KEY={"type":"service_account","project_id":"your-project",...} (your JSON as single line)
```

**Optional Variables:**
```
VITE_API_TIMEOUT=30000
```

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your server
3. Wait for deployment (usually 2-5 minutes)
4. You'll get a URL like: `https://CropLab-backend.onrender.com`

### Step 7: Test Backend
1. Visit your Render URL - should show: `{"message":"CropLab Backend is running!","status":"healthy"}`
2. Test API endpoint: `https://CropLab.onrender.com/user` (should return route info)

**✅ DEPLOYMENT SUCCESSFUL!** 
Your backend is now live at: **https://CropLab.onrender.com**

### Step 8: Update Frontend
1. Go to your Vercel dashboard
2. Update environment variable:
   ```
   VITE_API_BASE_URL=https://CropLab.onrender.com
   ```
3. Redeploy your frontend

### Step 9: Database Setup (MongoDB Atlas)
1. Make sure you're using MongoDB Atlas (cloud database)
2. In MongoDB Atlas → Network Access:
   - Add IP: `0.0.0.0/0` (allows Render to connect)
   - Or specific Render IP ranges if you prefer

### Step 10: Test Full Application
1. Visit your Vercel frontend URL
2. Try user registration/login
3. Test farm creation and data processing

## Troubleshooting Common Issues

### Build Failures:
- Check build logs in Render dashboard
- Ensure Node.js version compatibility
- Verify all dependencies are listed in package.json

### Authentication Errors:
- Verify JWT_SECRET is set correctly
- Check CORS configuration includes your frontend URL

### Database Connection Issues:
- Verify MongoDB connection string
- Check MongoDB Atlas network access settings
- Ensure username/password are correct

### Google Earth Engine Errors:
- Verify GOOGLE_EARTH_ENGINE_KEY is properly formatted as single-line JSON
- Check service account permissions in Google Cloud Console

### CORS Errors:
- Verify FRONTEND_URL environment variable matches your Vercel domain
- Check that credentials are included in frontend requests

## Important Notes

### Free Tier Limitations:
- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down may take 30+ seconds
- Consider upgrading to paid plan for production use

### Monitoring:
- Monitor logs in Render dashboard → Logs tab
- Set up health check monitoring if needed

### Custom Domain (Optional):
- In Render dashboard → Settings → Custom Domains
- Add your custom domain and configure DNS

## Security Checklist

- ✅ Service account JSON is in environment variable, not committed to git
- ✅ JWT secret is strong and unique
- ✅ MongoDB connection uses authentication
- ✅ CORS is configured for production domains only
- ✅ Environment variables are properly secured

## Next Steps After Deployment

1. **Monitor Performance**: Check response times and error rates
2. **Set Up Monitoring**: Consider using Render's monitoring features
3. **SSL Certificate**: Render provides free SSL automatically
4. **Custom Domain**: Configure custom domain if needed
5. **Backup Strategy**: Ensure MongoDB Atlas backups are configured

Your backend is now ready for production deployment on Render! 🚀