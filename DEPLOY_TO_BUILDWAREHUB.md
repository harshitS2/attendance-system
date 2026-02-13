# Deploying to attendance.buildwarehub.com

Here are the specific steps to deploy your Attendance App.

## Part 1: Backend (Render.com)

1.  **Push your code to GitHub** (if not already done).
2.  Go to [Render.com](https://render.com) and create a new **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings:**
    *   **Root Directory:** `server`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
5.  **Environment Variables:**
    *   `MONGO_URI`: `(Your MongoDB Connection String)`
    *   `JWT_SECRET`: `(Make up a long random password)`
    *   `CLIENT_URL`: `http://attendance.buildwarehub.com` (Crucial for CORS!)
    *   `PORT`: `10000`
6.  **Deploy**.
7.  **Copy the Backend URL** provided by Render (e.g., `https://attendance-api-xyz.onrender.com`).

---

## Part 2: Frontend (Your Custom Domain)

1.  **Prepare for Build:**
    *   Open `client/.env.production` in your code editor.
    *   Update `VITE_API_URL` with your **Render Backend URL** adding `/api` at the end.
        *   Example: `VITE_API_URL=https://attendance-api-xyz.onrender.com/api`
    *   Save the file.

2.  **Build the Frontend:**
    *   Run this command in your `client` folder:
        ```bash
        npm run build
        ```
    *   This will create a `dist` folder inside `client/`.

3.  **Upload to Hosting (cPanel / FTP / Hostinger):**
    *   Log in to your hosting control panel or use an FTP client (FileZilla).
    *   Go to the folder for `attendance.buildwarehub.com` (often `public_html` or a subdomain folder).
    *   **Upload ALL files** from inside the `client/dist/` folder to your server.
        *   This includes `index.html`, `assets/`, and the `.htaccess` file (I created this for you to handle routing).

4.  **Verify Routing:**
    *   The `.htaccess` file ensures that if someone visits `attendance.buildwarehub.com/login` directly, it loads the app correctly instead of giving a 404 error. ensure this file is uploaded!

## Part 3: Final Config

1.  Go back to Render.com dashboard for your backend service.
2.  Double-check `CLIENT_URL` is set to `http://attendance.buildwarehub.com`.
3.  If you use **HTTPS** for your domain (recommended), set it to `https://attendance.buildwarehub.com`.

**You're done!** Your app should be live.
