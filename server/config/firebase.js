import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Helper: Properly format Firebase private key for all environments
function formatPrivateKey(key) {
    if (!key) return key;
    // Remove surrounding quotes if present
    let formatted = key.replace(/^["']|["']$/g, '');
    // Replace literal \n (escaped newline strings) with actual newlines
    formatted = formatted.replace(/\\n/g, '\n');
    return formatted;
}

// Initialize Firebase Admin
try {
    if (!admin.apps.length) {
        const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://nexora-3a845-default-rtdb.firebaseio.com/';

        console.log('🔧 Firebase Init - Project:', process.env.FIREBASE_PROJECT_ID || 'NOT SET');
        console.log('🔧 Firebase Init - Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
        console.log('🔧 Firebase Init - Private Key:', process.env.FIREBASE_PRIVATE_KEY ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : 'NOT SET');
        console.log('🔧 Firebase Init - Service Account JSON:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'SET' : 'NOT SET');
        console.log('🔧 Firebase Init - Database URL:', databaseURL);

        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            // Also fix private key in service account JSON
            if (serviceAccount.private_key) {
                serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL
            });
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                }),
                databaseURL
            });
        } else {
            console.warn('⚠️ No Firebase credentials found, using default credentials');
            // Fallback: use default credentials (e.g., in Cloud environments or emulator)
            admin.initializeApp({
                databaseURL
            });
        }
        console.log('🔥 Firebase Admin Initialized Successfully');
        console.log(`📦 Database URL: ${databaseURL}`);
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.error('❌ Full error:', error);
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
