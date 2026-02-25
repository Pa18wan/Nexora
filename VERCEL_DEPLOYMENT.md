# 🚀 Vercel Deployment Guide — Nexora Legal Platform

> **Live URL:** [https://nexora-olive.vercel.app/](https://nexora-olive.vercel.app/)

## Prerequisites
- A [Vercel account](https://vercel.com/signup)
- Your code pushed to a **GitHub** (or GitLab/Bitbucket) repository
- Firebase project configured with Realtime Database

---

## Step 1: Push Code to GitHub

Make sure your `.gitignore` is clean (we've already updated it), then:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

> ⚠️ **IMPORTANT:** The `server/.env` file is git-ignored for security. Environment variables will be configured in the Vercel dashboard instead.

---

## Step 2: Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your repository
4. Vercel will auto-detect the `vercel.json` configuration

**Do NOT change the build settings** — they are already configured in `vercel.json`:
- Install Command: `npm install && cd server && npm install && cd ../client && npm install`
- Build Command: `cd client && npm run build`
- Output Directory: `client/dist`

---

## Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Project Settings → Environment Variables** and add these:

### Required (Server-side):

| Variable | Value | Notes |
|---|---|---|
| `FIREBASE_PROJECT_ID` | `nexora-3a845` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@nexora-3a845.iam.gserviceaccount.com` | Service account email |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | ⚠️ Paste the FULL key with `\n` line breaks |
| `FIREBASE_DATABASE_URL` | `https://nexora-3a845-default-rtdb.firebaseio.com/` | RTDB URL |
| `JWT_SECRET` | Your secret key | Any strong random string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `NODE_ENV` | `production` | Must be "production" |

### Optional (Client-side — only if using Firebase client SDK):

| Variable | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Your Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `nexora-3a845.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `nexora-3a845` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `nexora-3a845.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID |

### ⚠️ Important Note About `FIREBASE_PRIVATE_KEY`:

On Vercel, paste the private key exactly as-is with the `\n` characters. Our server code handles both escaped (`\\n`) and real newlines automatically.

---

## Step 4: Deploy

Click **"Deploy"** in the Vercel dashboard. The deployment will:
1. Install all dependencies (root + server + client)
2. Build the React client
3. Deploy the static files + serverless API function

---

## Step 5: Verify Deployment

After deployment, check these endpoints:

| URL | Expected |
|---|---|
| `https://nexora-olive.vercel.app/` | Landing page loads |
| `https://nexora-olive.vercel.app/api/health` | Returns JSON health check |
| `https://nexora-olive.vercel.app/login` | Login page loads |
| `https://nexora-olive.vercel.app/register` | Registration page loads |

---

## Architecture on Vercel

```
your-app.vercel.app
├── / (static)          → client/dist/index.html (React SPA)
├── /login (static)     → client/dist/index.html (SPA routing)
├── /dashboard (static) → client/dist/index.html (SPA routing)
├── /api/* (serverless)  → api/index.mjs → server/server.js (Express)
└── /api/health         → Health check endpoint
```

- **Frontend:** Served as static files from `client/dist/`
- **Backend:** Runs as a Vercel Serverless Function via `api/index.mjs`
- **Database:** Firebase Realtime Database (cloud-hosted, no extra setup needed)

---

## Troubleshooting

### API returns 500 errors
1. Check Vercel Function Logs (Dashboard → Deployments → Functions tab)
2. Verify all environment variables are set correctly
3. Test the `/api/debug` endpoint (only available in development)

### Firebase connection fails
1. Ensure `FIREBASE_PRIVATE_KEY` is pasted correctly with line breaks
2. Verify `FIREBASE_DATABASE_URL` points to your RTDB instance  
3. Check that Firebase RTDB rules allow read/write for authenticated requests

### SPA routing shows 404
- The `vercel.json` rewrites handle this — all non-API routes serve `index.html`
- If still failing, redeploy after checking `vercel.json` is committed

### File uploads don't persist
- Vercel serverless functions have a read-only filesystem (except `/tmp`)
- Uploaded files are saved to `/tmp` during the function invocation but **do not persist between requests**
- For production file storage, integrate Firebase Storage or AWS S3

---

## Re-deploying

After making code changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```
Vercel will **automatically redeploy** on every push to the main branch.
