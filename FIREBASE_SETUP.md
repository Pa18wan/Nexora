# 🔥 Adding Firebase to Nexora

This guide explains how to set up Firebase (Firestore Database & Authentication) for the Nexora project.

## 1. Create a Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the setup wizard.
3.  Disable Google Analytics (optional, simplifies setup).

## 2. Get Configuration Credentials

### A. Client Configuration (For Frontend)
1.  In your Firebase Project Overview, click the **Web icon (</>)** to add a web app.
2.  Register the app (e.g., "Nexora Client").
3.  Copy the `firebaseConfig` object shown. You'll need these values for your `.env` file.

### B. Server Configuration (For Backend Admin SDK)
1.  Go to **Project Settings** (gear icon) -> **Service accounts**.
2.  Click **"Generate new private key"**.
3.  This will download a JSON file. **KEEP THIS SECURE!**
4.  Open the file and copy the contents. You will need to convert this to environment variables.

## 3. Configure Environment Variables

### Client (`client/.env`)
Add these variables using the values from Step 2A:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Server (`server/.env`)
Add the service account details from Step 2B. Since most hosting platforms (like Vercel) prefer single-line variables, you can either stringify the JSON or add fields individually. For local development, individual fields are clearer:
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
```
*Note: Ensure the private key is wrapped in quotes and `\n` characters are preserved.*

## 4. Install Dependencies
You need to install the Firebase SDKs locally.

**Server:**
```bash
cd server
npm install firebase-admin
```

**Client:**
```bash
cd client
npm install firebase
```

## 5. Verify Integration
The project now includes configuration files at:
- `server/config/firebase.js`: Initializes Firebase Admin SDK.
- `client/src/firebase.ts`: Initializes Firebase Client SDK.

You can import `db` (Firestore), `auth`, or `storage` from these files to start using Firebase services alongside your existing MongoDB data.
