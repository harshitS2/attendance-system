
# Deployment Guide (Attendance App)

## 1. Prerequisites
- **Frontend Code** (`client` folder)
- **Backend Code** (`server` folder)
- **MongoDB Database** (Cloud hosted, e.g., MongoDB Atlas)
- **GitHub Account** (for repository hosting)

---

## 2. Database: MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster.
3. Create a Database User (Username/Password).
4. Whitelist IP Address (Allow access from anywhere `0.0.0.0/0` for initial ease, or specific IPs).
5. Get the **Connection String**: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/attendance_db?retryWrites=true&w=majority`.

---

## 3. Backend Deployment: Render.com (Free Tier)
Render is an excellent platform for hosting Node.js apps for free.

1. **Push your code to GitHub**:
   - Ensure `server` and `client` are in the repository.
   - Ideally, the root of the repo can be the `server` folder content, or keep the structure `server/client` and specify Root Directory.

2. **Create Web Service on Render**:
   - Connect your GitHub repo.
   - **Root Directory**: `server` (if your repo has the `server` folder).
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (Make sure `package.json` scripts has `"start": "node index.js"`).
   - **Environment Variables**: Add these in the Render dashboard:
     - `MONGO_URI`: (Your MongoDB Connection String)
     - `JWT_SECRET`: (A simpler random string)
     - `PORT`: `10000` (Render sets this automatically usually, but good to have code listen `process.env.PORT`).

3. **Deploy**. Render will give you a URL (e.g., `https://attendance-api.onrender.com`).

---

## 4. Frontend Deployment: Vercel / Netlify (Free)
Since the frontend is a Vite React app, it's static.

1. **Update Frontend Config**:
   - In `client/.env.production` (create if needed), add:
     ```
     VITE_API_URL=https://attendance-api.onrender.com/api
     ```
   - *Important*: Update your axios calls to use this variable.
     - Replace `http://localhost:5000/api` with `import.meta.env.VITE_API_URL`.

2. **Deploy on Vercel**:
   - Import GitHub Repo.
   - **Root Directory**: `client`.
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
   - **Environment Variables**: Add `VITE_API_URL` here too.

3. **Deploy**. Vercel will give you a domain (e.g., `https://attendance-app.vercel.app`).

---

## 5. Final Configuration
1. Go back to your Backend code/env.
2. Update **CORS** settings in `server/index.js`:
   ```javascript
   app.use(cors({
       origin: 'https://attendance-app.vercel.app', // Your Vercel domain
       credentials: true
   }));
   ```
3. Commit and Push. Render will auto-redeploy.

**You are now Live!** 🚀
