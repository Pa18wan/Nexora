import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
try {
    if (!admin.apps.length) {
        const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://user-db.firebaseio.com';

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

// Firestore Database
export const db = admin.apps.length ? admin.firestore() : null;

// Firebase Auth
export const auth = admin.apps.length ? admin.auth() : null;

// Helper: Generate a unique ID (like MongoDB _id)
export const generateId = () => db ? db.collection('_temp').doc().id : Date.now().toString();

// Helper: Firestore Timestamp
export const timestamp = () => admin.firestore.FieldValue.serverTimestamp();

// Helper: Convert Firestore doc to plain object with _id
export const docToObj = (doc) => {
    if (!doc.exists) return null;
    return { _id: doc.id, ...doc.data() };
};

// Helper: Convert Firestore QuerySnapshot to array
export const queryToArray = (snapshot) => {
    const results = [];
    snapshot.forEach(doc => {
        results.push({ _id: doc.id, ...doc.data() });
    });
    return results;
};

export default admin;
