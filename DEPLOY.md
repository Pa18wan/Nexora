# Deploying Nexora on Vercel

Follow these steps to deploy the Nexora Legal Platform to Vercel.

## 1. Prerequisites
- A [Vercel Account](https://vercel.com/signup).
- The project pushed to GitHub (which you have already done).

## 2. Import Project to Vercel
1.  Go to your **Vercel Dashboard**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Find your repository `Nexora` and click **"Import"**.

## 3. Configure Project Settings
Vercel will detect that there are multiple projects. However, we have configured a `vercel.json` file to handle the monorepo deployment automatically.

1.  **Framework Preset**: It might default to "Other" or "Vite". If it asks, selecting **"Other"** is safest due to our custom configuration, but **"Vite"** is fine for the client build.
2.  **Root Directory**: Leave it as `./` (the root of the repo).
3.  **Build Command**: Leave default (our `vercel.json` handles this).
4.  **Output Directory**: Leave default (`dist` is specified in `vercel.json` for client).

## 4. Environment Variables
You MUST add the following environment variables in the Vercel Project Settings > **Environment Variables** section.

**Server Variables:**
- `MONGODB_URI`: Your MongoDB connection string (Must be a cloud database like **MongoDB Atlas**).
- `JWT_SECRET`: A secure random string.
- `NODE_ENV`: `production`
- `DEEPSEEK_API_KEY`: Your AI API key.
- `CLIENT_URL`: The URL of your deployed Vercel app (e.g., `https://nexora.vercel.app`). *You can add this after the first deployment generates a URL.*

**Client Variables:**
*(Note: In Vite, variables must start with `VITE_` to be exposed to the browser)*
- If your client code uses any specific env vars, add them here.
- Since our client makes requests to `/api/...`, and Vercel handles the routing on the same domain, you usually **do not** need to set a base URL variable if usage is relative (e.g., `axios.get('/api/auth')`).
- If you hardcoded `http://localhost:5000` in your client, you needs to change it to relative paths or use an environment variable.

## 5. Deploy
1.  Click **"Deploy"**.
2.  Vercel will build the frontend and set up the serverless functions for the backend.
3.  Once done, you will get a dashboard URL.

## 6. Troubleshooting
- **Database Connection**: Ensure your MongoDB Atlas IP Access List allows `0.0.0.0/0` (Allow Access from Anywhere) because Vercel IP addresses are dynamic.
- **CORS**: If you see CORS errors, ensure your `server/server.js` CORS configuration allows the Vercel domain. We updated the server to verify `process.env.CLIENT_URL`, so make sure that variable is set correctly.

## 7. Important Note on Serverless
This deployment runs your Express API as a "Serverless Function".
- **Cold Starts**: The API might take a few seconds to respond if it hasn't been used recently.
- **Websockets**: If you plan to use Socket.io, Vercel Serverless **does not support** persistent Websocket connections. You would need to use a third-party service like Pusher, or deploy the backend to **Render/Railway**.
