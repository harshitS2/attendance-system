# Production Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Environment Variables Setup

**Backend (.env)**
```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_string_here
PORT=10000
CLIENT_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

**Frontend (.env.production)**
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### 2. Code Verification
- [x] CORS configured with environment variable
- [x] All API calls use environment variable for base URL
- [x] Excel export functionality implemented
- [x] Employee ID visibility in Team page
- [x] Separate History page created
- [x] Password reset functionality
- [x] Session approval workflow
- [x] Export to Excel (XLSX format)

### 3. Database Setup (MongoDB Atlas)
1. Create free cluster at https://cloud.mongodb.com
2. Create database user with password
3. Whitelist IP: 0.0.0.0/0 (allow from anywhere)
4. Get connection string
5. Replace `<password>` and `<dbname>` in connection string

### 4. Backend Deployment (Render.com)

**Steps:**
1. Push code to GitHub
2. Go to https://render.com
3. Create New → Web Service
4. Connect GitHub repository
5. Configure:
   - **Name**: attendance-backend
   - **Root Directory**: server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Add Environment Variables (from step 1)
7. Deploy

**Your backend URL**: `https://attendance-backend-xxxx.onrender.com`

### 5. Frontend Deployment (Vercel)

**Steps:**
1. Go to https://vercel.com
2. Import GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: client
   - **Build Command**: `npm run build`
   - **Output Directory**: dist
4. Add Environment Variable:
   - `VITE_API_URL` = your Render backend URL
5. Deploy

**Your frontend URL**: `https://attendance-app-xxxx.vercel.app`

### 6. Post-Deployment Configuration

1. Update backend `.env` on Render:
   - Set `CLIENT_URL` to your Vercel URL
2. Redeploy backend (automatic on Render)
3. Test the application:
   - Login/Register
   - Check-in/Check-out
   - Admin features
   - Export functionality
   - Password reset

### 7. Create Admin User

Run this script on your deployed backend (or locally connected to production DB):

```bash
node createAdmin.js
```

Or use MongoDB Compass to manually create a user with role: "SuperAdmin"

---

## 🚀 Alternative Deployment Options

### Option 1: Railway.app (Backend + Database)
- Supports both Node.js and MongoDB
- Free tier available
- Simpler than separate services

### Option 2: Netlify (Frontend)
- Similar to Vercel
- Free tier with custom domain support

### Option 3: Heroku (Full Stack)
- Can host both frontend and backend
- Free tier discontinued, but hobby tier is affordable

---

## 📝 Important Notes

1. **Free Tier Limitations**:
   - Render: Apps sleep after 15 min of inactivity (first request takes ~30s)
   - MongoDB Atlas: 512MB storage limit
   - Vercel: 100GB bandwidth/month

2. **Security**:
   - Never commit `.env` files to Git
   - Use strong JWT_SECRET (at least 32 characters)
   - Enable 2FA on all deployment platforms

3. **Custom Domain** (Optional):
   - Buy domain from Namecheap, GoDaddy, etc.
   - Add to Vercel: Settings → Domains
   - Update CORS in backend

4. **Monitoring**:
   - Check Render logs for backend errors
   - Use Vercel Analytics for frontend metrics
   - Monitor MongoDB Atlas for database performance

---

## 🔧 Troubleshooting

**Issue**: CORS errors
- **Fix**: Ensure `CLIENT_URL` in backend matches exact Vercel URL (with https://)

**Issue**: API calls failing
- **Fix**: Check `VITE_API_URL` in frontend environment variables

**Issue**: Database connection failed
- **Fix**: Verify MongoDB Atlas IP whitelist and connection string

**Issue**: Session/Cookie not working
- **Fix**: Ensure both frontend and backend use HTTPS in production

---

## ✨ Your App is Live!

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-api.onrender.com

Share the frontend URL with your team! 🎉
