import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
try {
    if (!admin.apps.length) {
        const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://nexora-3a845-default-rtdb.firebaseio.com/';

        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL
            });
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                }),
                databaseURL
            });
        } else {
            // Fallback: use default credentials (e.g., in Cloud environments or emulator)
            admin.initializeApp({
                databaseURL
            });
        }
        console.log('🔥 Firebase Admin Initialized');
        console.log(`📦 Database URL: ${databaseURL}`);
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
}

// Realtime Database
const rtdb = admin.database();
export const db = rtdb; // Export as db to keep import compatibility, but methods are different

// Firebase Auth
export const auth = admin.apps.length ? admin.auth() : null;

// Helper: Generate a unique ID
export const generateId = () => rtdb.ref().push().key;

// Helper: Server Timestamp
export const timestamp = () => admin.database.ServerValue.TIMESTAMP;

// Helper: Convert RTDB snapshot to object with _id
export const docToObj = (snapshot) => {
    if (!snapshot.exists()) return null;
    return { _id: snapshot.key, ...snapshot.val() };
};

// Helper: Convert RTDB Snapshot (list) to array
export const queryToArray = (snapshot) => {
    const results = [];
    snapshot.forEach(childSnap => {
        results.push({ _id: childSnap.key, ...childSnap.val() });
    });
    return results;
};

export default admin;
