import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Handle unhandled rejections
process.on('unhandledRejection', (reason, p) => {
    console.error('❌ Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});

// Configuration checks
const databaseURL = process.env.FIREBASE_DATABASE_URL;
if (!databaseURL) {
    console.error('❌ FIREBASE_DATABASE_URL is missing in .env');
    process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
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
            // Fallback for local/emulator if needed, though likely won't work for migration without creds
            admin.initializeApp({ databaseURL });
        }
    } catch (error) {
        console.error('❌ Firebase init failed:', error);
        process.exit(1);
    }
}

const firestore = admin.firestore();
const rtdb = admin.database();

const COLLECTIONS = [
    'users',
    'advocates',
    'cases',
    'notifications',
    'complaints',
    'aiLogs',
    'activityLogs',
    'adminLogs',
    'reviews',
    'systemSettings',
    'documents'
];

async function migrate() {
    console.log(`🚀 Starting migration from Firestore to Realtime Database (${databaseURL})...`);
    console.log(`🔑 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);

    // Test Firestore connection
    try {
        await firestore.listCollections();
        console.log('✅ Connected to Firestore');
    } catch (e) {
        console.error('❌ Failed to connect to Firestore:', e.message);
        throw e;
    }

    // Test RTDB connection
    try {
        await rtdb.ref('.info/connected').once('value');
        console.log('✅ Connected to RTDB');
    } catch (e) {
        console.error('❌ Failed to connect to RTDB:', e.message);
        throw e;
    }

    for (const collectionName of COLLECTIONS) {
        process.stdout.write(`📦 Migrating collection '${collectionName}'... `);
        try {
            const snapshot = await firestore.collection(collectionName).get();
            if (snapshot.empty) {
                console.log('Skipped (Empty)');
                continue;
            }

            const data = {};
            snapshot.forEach(doc => {
                const docData = doc.data();
                data[doc.id] = docData;

                // Helper to recursive convert Dates
                const convertDates = (obj) => {
                    for (const key in obj) {
                        if (obj[key] && typeof obj[key] === 'object') {
                            if (typeof obj[key].toDate === 'function') {
                                obj[key] = obj[key].toDate().toISOString();
                            } else {
                                convertDates(obj[key]);
                            }
                        }
                    }
                };

                convertDates(data[doc.id]);
            });

            await rtdb.ref(collectionName).set(data);
            console.log(`✅ Done (${snapshot.size} docs)`);
        } catch (error) {
            console.log('❌ Failed');
            console.error('Error migrating collection ' + collectionName + ':', error);
        }
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
}

migrate().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
