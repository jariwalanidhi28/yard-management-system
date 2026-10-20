# 🚀 100% Free Live Deployment Guide: Yard Management System (YMS)

This guide provides step-by-step instructions to deploy the entire **Yard Management System (MERN Stack)** to a public live server **completely for free ($0/month)**.

---

## 🏗️ Free Production Architecture ($0 Total Cost)

| Layer | Recommended Free Provider | Free Tier Limits | Cost |
| :--- | :--- | :--- | :--- |
| **Database** | **MongoDB Atlas (M0 Shared)** | 512 MB Storage, Replica Set enabled by default | **$0 / Free Forever** |
| **Backend & Frontend (Unified)** | **Render.com (Web Service)** | 750 free compute hours/month, Free Automatic SSL HTTPS | **$0 / Free Forever** |
| **Alternative Frontend (Decoupled)** | **Vercel** | Unlimited edge deployments, 100 GB bandwidth | **$0 / Free Forever** |

> [!TIP]
> **Why the Unified Render Deployment is Recommended:**
> By default, the application is configured so that the Express backend automatically serves the built React SPA (`frontend/dist`) on the exact same domain (`https://your-app.onrender.com`).
> **Benefits:**
> 1. You only need to maintain **one single free service**.
> 2. **Zero CORS configuration issues**.
> 3. **Secure HTTP-only cookies** (`SameSite: strict`) work natively without cross-domain browser restrictions.

---

## 📋 STEP 1: Set Up MongoDB Atlas Free Cloud Database (2 Minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account (no credit card required).
2. Click **Create Deployment** &rarr; select **M0 (Free)**.
3. Choose your preferred cloud provider (AWS / Google Cloud / Azure) and a region closest to your users.
4. Click **Create Cluster**.
5. In the **Security Quickstart**:
   - Create a database user (e.g. Username: `yms_admin`, Password: `YmsSecretPassword123!`). Save these credentials.
   - Under **Where would you like to connect from?**, select **Cloud Environment** or add IP Address: `0.0.0.0/0` (Description: `Allow all connections for cloud deployment`).
6. Click **Finish and Close**.
7. In the Atlas dashboard, click **Connect** &rarr; **Drivers** (Node.js).
8. Copy your connection string. It will look like this:
   ```text
   mongodb+srv://yms_admin:<password>@cluster0.abcde.mongodb.net/yms_db?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and ensure the database name `/yms_db` is included).*

---

## 📋 STEP 2: Push Your Project to GitHub (3 Minutes)

If you haven't pushed this project to your GitHub account yet, open your terminal in `c:\wamp64\www\yms` and run:

```bash
# 1. Initialize git in the project root
git init

# 2. Add all files (large videos are automatically ignored by .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete production yard management system"

# 4. Set main branch
git branch -M main

# 5. Link your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<your-username>/yard-management-system.git

# 6. Push to GitHub
git push -u origin main
```

---

## 📋 STEP 3: Deploy on Render.com (100% Free Full-Stack)

1. Go to [Render.com](https://render.com/) and click **Sign In** (log in with your GitHub account).
2. From the dashboard, click **New +** &rarr; select **Web Service**.
3. Under **Connect a repository**, find and select your `yard-management-system` repository.
4. Fill in the following settings:
   - **Name**: `yard-management-system` (or any custom name)
   - **Region**: Choose the region closest to your MongoDB Atlas cluster (e.g. Oregon or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root of repo)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Select **Free** ($0 / month)

5. Scroll down to **Environment Variables** and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security & caching |
| `PORT` | `10000` | Port used by Render |
| `MONGODB_URI` | `mongodb+srv://yms_admin:YourPassword@cluster0.abcde.mongodb.net/yms_db?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | `yms_production_jwt_super_secret_key_2026_xyz` | Secret key for signing user tokens |
| `COOKIE_SECRET` | `yms_production_cookie_secret_key_2026_abc` | Secret key for signing HTTP-only cookies |
| `CSRF_SECRET` | `yms_production_csrf_secret_key_2026_def` | Secret key for CSRF tokens |
| `ADMIN_NAME` | `Super Admin` | Initial Admin display name |
| `ADMIN_EMAIL` | `admin@yms.local` | Initial Admin login email |
| `ADMIN_PASSWORD` | `Admin@123456` | Initial Admin secure password |

6. Click **Deploy Web Service** at the bottom of the page.
7. Render will automatically:
   - Install dependencies for both backend and frontend.
   - Build the production React bundle into `frontend/dist`.
   - Start the Express server.
   - Provide you with a free live HTTPS URL (e.g., `https://yard-management-system.onrender.com`).

---

## 📋 STEP 4: Seed Demo Data to Your Live Database (1 Minute)

Once your Render web service is deployed:
1. In your Render Dashboard, click on your service (`yard-management-system`).
2. Click on the **Shell** tab in the left sidebar to open a terminal inside your live container.
3. Type the following command and hit Enter:
   ```bash
   npm run seed
   ```
4. Output will show:
   ```text
   [Seed] Connected to cloud database...
   [Seed] Default Admin ready: admin@yms.local / Admin@123456
   [Seed] Vehicles, Drivers, Yard Slots, Dock Appointments & Shipments seeded successfully!
   ```
5. You can now visit `https://yard-management-system.onrender.com/login` and log in immediately using the Admin quick-fill!

---

## 🌐 OPTIONAL ALTERNATIVE: Decoupled Deployment (Vercel Frontend + Render API)

If you prefer to host the React frontend on **Vercel** and the API on **Render**:

### A. Deploy Backend to Render:
- Follow Step 3 above, but set **Root Directory** to `backend`.
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- Set `CLIENT_URL` to your Vercel URL (e.g. `https://yms-frontend.vercel.app`).
- Note your live API URL (e.g. `https://yms-api.onrender.com`).

### B. Deploy Frontend to Vercel:
1. Go to [Vercel.com](https://vercel.com/) & log in with GitHub.
2. Click **Add New...** &rarr; **Project**.
3. Import your `yard-management-system` repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://yms-api.onrender.com/api/v1`
6. Click **Deploy**. Vercel will build and deploy the React frontend globally for free.

---

## 🔒 Verification Checklist Once Live

- [ ] **Health Endpoint**: Visit `https://your-app.onrender.com/api/health` &rarr; returns `{ "status": "UP" }`.
- [ ] **Login**: Visit `https://your-app.onrender.com/login` & sign in with `admin@yms.local` / `Admin@123456`.
- [ ] **Interactive Visual Yard Map**: Visit `https://your-app.onrender.com/yard-map` & check color-coded slots.
- [ ] **Printable Gate Pass**: Open any gate visit and click **Print Gate Pass** to verify receipt modal.
- [ ] **Public Tracking**: Visit `https://your-app.onrender.com/track/TRK-20261019-0001` without logging in to verify customer tracking.
