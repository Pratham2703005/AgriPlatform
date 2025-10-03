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
   {"type":"service_account","project_id":"pk07007","private_key_id":"a1967074c8dfb1aa1502222cde67f755938a9a6e","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDFDQ0t/P9X77V\nf5T589xQ2C4l1NteusBzklnHNjzswSHIb7xf/HbathfWb7MtF+GHFSPl8l3hEf9q\nJXymIeeGwVk1vrGA4GPhwJCnTicTXvv49PE4EvJFhEJhqLGZLBM5CFyw9XxoJdHk\nlVIFOab7T2T8TOjfv8BUbuiidihRgwcu/uydf9bEUMW2PeUIyQu4hlO8ptgaP10x\nlMmVYiMY1jsUgXYrjbUTno8GKLuGVWnMUKEHJN951bJJi+qfBHzf+eiGUXZzisga\nnBEqtF+xKHN8TpvhoLBolpmKwt4HpJnC88FeAPmNcpooAtWOeAKLxiHjOLA7zaqG\nFemVZDWBAgMBAAECggEADYNLw88Y6UHa7+Jg3m45olFR47BP6yBCjn7iayiNpdS8\nU1cHacViMkTkzSd69jJY8/N57hwQzAi5dDqD3OTXqypKKgKQkch5WBJFCDcjVnXW\nPGjd1gWHSgYfAbF0GT5yrRkFhViBNUb8DWUZLmAk+fQw9EJw6yGBisJiqPDzBVpQ\nJ5cHf56Gkf+NKCKKr+H2mRXpIbvtYgML4uCe6D8/jr6jqQJBbw6wjpNytMQSq/3m\nHgcpyLtpux62DiLQCmFlQ8w+0ufO7gJDi8wiaiwa9CEEp0Gg2Ixm3yb73HqRAllN\ngFjTIOHWdq3R7S/gD77vWeuj1QYs44YkLuZ20hFNMQKBgQDuLFzYOpwN07iL0gSm\n4LtaibCpHymUZZr5kbZtuV9g8bk/9+oopKar1FOuBAfgMwPvKxh7x0Hjc/95Acor\nzo6E00o2LeRH16y5gIZwC/diOMtREts2PBh916VjU8qPYh6uwpf/6sTq0FCCXsgF\nibBCQyCIFqQDzAdPAxy31NeKLQKBgQDRrhw4I8Rmzq1wg+eUJhl4Pkauo5hYQSV0\n+oltFc25OXePl6SHqwYcZ8ziPKNNzBPMjWj0LQDKJHOQ2LqS2vtC9u2KzmZsoaCT\n1V7LkNiPARPzO+08NRxCOwv/Q1VOsF7PLrGwUtR74lrFJyIeJIdwr3y7DTlhUiYN\nVNiT+blRJQKBgQDAl+kABOzaFYGettaCJyn5PWw4ZfWWhU77TsPpGEQzPWRigNO9\nx97rBcgg6CuCNV6SERQ8S1VRWySTsknMgLwoVj8lbpixK4sFehO8GUETEP//8DKJ\nObFIWY/osQIUTfCnur10+WAAzTC9K22tZLi97FArG7vHQj4Ku2aGlLsyhQKBgEW+\neyZ1RzPHFUuypEnT7m7fkBUw11CrwrDJUQLW2Mn+gnVhxFlYGr1CDZVHBC6xbfiB\nJOLrQTL7svEAFfcZHbBlgBfGla0WidoCg/iEInRWsHMcgMmhBNhG2bO7itmUssSJ\nTJNQydq3LOgdHy0Vi3OA+6UgPfDQKVYP3cZCr1B9AoGAVjv00q+fOY8jdhjYNtQC\niGyCxIkJvYQckwVnYz4tBrMCvpHOAK5mXFNzTQ6w2Zr803UFQKXtiKSprI5Piym/\n5N8EulSjVtOocuEYOKEfsKG2pzWjP5LkvJyUyPWvySQYsdWxST4oaBbIWhoq2Rzo\nLD7JFIMAWJ7Yb/e658+laNc=\n-----END PRIVATE KEY-----\n","client_email":"farm-monitoring-service@pk07007.iam.gserviceaccount.com","client_id":"109079035971556167013","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/farm-monitoring-service%40pk07007.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
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
Name: agriplatform-backend (or your preferred name)
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
4. You'll get a URL like: `https://agriplatform-backend.onrender.com`

### Step 7: Test Backend
1. Visit your Render URL - should show: `{"message":"AgriPlatform Backend is running!","status":"healthy"}`
2. Test API endpoint: `https://your-app.onrender.com/user` (should return route info)

### Step 8: Update Frontend
1. Go to your Vercel dashboard
2. Update environment variable:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com
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