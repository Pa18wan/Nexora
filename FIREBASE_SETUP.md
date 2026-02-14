# 🔥 Firebase Setup Guide for Nexora Legal Platform

## Overview
This application uses **Firebase Firestore** as its primary database and **Firebase Admin SDK** on the server for secure data operations.

---

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" → Enter project name → Continue
3. Enable/Disable Google Analytics (optional) → Create Project

## 2. Enable Firestore Database

1. In Firebase Console → Build → **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (or production mode with proper rules)
4. Select a region → Click Enable

## 3. Generate Service Account Key

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (keep it secure!)

## 4. Set Environment Variables

### Option A: Full JSON (Recommended for Vercel/Production)

In your `.env` file or hosting platform, set:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### Option B: Individual Variables (Alternative)

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Other Required Variables

```env
JWT_SECRET=your-secure-jwt-secret-here
DEEPSEEK_API_KEY=your-deepseek-api-key
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

## 5. Client-Side Firebase (Optional)

If you need client-side Firebase features, set these in the client `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 6. Seed the Database

After setting up Firebase credentials:

```bash
cd server
npm run seed
```

This will populate Firestore with demo data including:
- 8 users (1 admin, 3 clients, 4 advocates)
- 4 advocate profiles
- 7 legal cases
- Notifications, complaints, reviews, and more

### Demo Login Credentials
All accounts use password: `password123`

| Role | Email |
|------|-------|
| Admin | admin@nexora.com |
| Client 1 | client@nexora.com |
| Client 2 | client2@nexora.com |
| Client 3 | client3@nexora.com |
| Advocate 1 | advocate@nexora.com |
| Advocate 2 | advocate2@nexora.com |
| Advocate 3 | advocate3@nexora.com |
| Advocate 4 | advocate4@nexora.com *(pending)* |

## 7. Run the Application

```bash
# Server
cd server
npm run dev

# Client (in a separate terminal)
cd client
npm run dev
```

## Firestore Collections Structure

| Collection | Description |
|-----------|-------------|
| `users` | All user accounts (clients, advocates, admins) |
| `advocates` | Advocate profiles linked to users |
| `cases` | Legal cases filed by clients |
| `notifications` | User notifications |
| `complaints` | User complaints |
| `aiLogs` | AI interaction logs |
| `activityLogs` | User activity audit trail |
| `adminLogs` | Admin action logs |
| `reviews` | Advocate reviews |
| `systemSettings` | Platform configuration |
| `documents` | Uploaded documents metadata |

## Security Notes

- **Never commit** the service account JSON file to version control
- Add `*.json` service account files to `.gitignore`
- Use environment variables for all sensitive data
- The Firebase Admin SDK bypasses Firestore security rules (server-side only)
