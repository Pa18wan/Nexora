import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { initialAdmin, initialClients, initialAdvocates, advocateProfiles, casesData, notificationsData, complaintsData, aiLogsData, activityLogsData, adminLogsData, documentsData, reviewsData, systemSettingsData } from './seedData.js';
import { db, auth } from './config/firebase.js';

dotenv.config();

const BATCH_SIZE = 500;

async function seedFirebase() {
    console.log('\n========== NEXORA FIREBASE SEEDING ==========\n');

    try {
        if (!db) {
            throw new Error('Firebase Admin not initialized. Check credentials.');
        }

        console.log('Using Firestore Database...');

        const collections = [
            'users', 'advocates', 'cases', 'notifications', 'complaints',
            'aiLogs', 'activityLogs', 'adminLogs', 'documents', 'reviews', 'systemSettings'
        ];

        // 1. Clear Collections (Optional - Use with caution)
        // console.log('Clearing collections...');
        // for (const col of collections) {
        //     const snapshot = await db.collection(col).get();
        //     const batch = db.batch();
        //     snapshot.docs.forEach((doc) => {
        //         batch.delete(doc.ref);
        //     });
        //     await batch.commit();
        // }
        // console.log('Collections cleared (simulated for safety)\n');

        // Helper to Create Auth User and Firestore Doc
        const createdUsers = [];
        const createUsers = async (users, role) => {
            for (const user of users) {
                try {
                    // Create in Auth
                    let userRecord;
                    try {
                        userRecord = await auth.getUserByEmail(user.email);
                        // console.log(`User ${user.email} already exists in Auth`);
                    } catch (e) {
                        userRecord = await auth.createUser({
                            email: user.email,
                            password: 'password123',
                            displayName: user.name,
                            emailVerified: true
                        });
                        // console.log(`Created Auth User: ${user.email}`);
                    }

                    // Create in Firestore
                    const userRef = db.collection('users').doc(userRecord.uid);
                    await userRef.set({
                        ...user,
                        _id: userRecord.uid, // Map _id for compatibility
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }, { merge: true });

                    createdUsers.push({ ...user, _id: userRecord.uid, role });
                } catch (error) {
                    console.error(`Error creating user ${user.email}:`, error.message);
                }
            }
        };

        console.log('Creating Users...');
        await createUsers(initialAdmin, 'admin');
        await createUsers(initialClients, 'client');
        await createUsers(initialAdvocates, 'advocate');
        console.log(`  Processed ${createdUsers.length} users\n`);

        // Map Helper
        const getRandomUser = (role) => {
            const roleUsers = createdUsers.filter(u => u.role === role);
            return roleUsers[Math.floor(Math.random() * roleUsers.length)];
        };

        // 2. Advocate Profiles
        console.log('Creating Advocate Profiles...');
        const createdAdvocates = [];
        for (const profile of advocateProfiles) {
            // Find corresponding user
            const user = createdUsers.find(u => u.email === profile.email); // Need to link by email in seedData
            if (user) {
                const advRef = db.collection('advocates').doc(); // Auto-ID
                const advData = {
                    ...profile,
                    userId: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                delete advData.email; // Remove temp email linker
                await advRef.set(advData);
                createdAdvocates.push({ ...advData, _id: advRef.id });
            }
        }
        console.log(`  Created ${createdAdvocates.length} advocate profiles\n`);

        // 3. Cases
        console.log('Creating Cases...');
        const createdCases = [];
        for (const caseData of casesData) {
            const client = getRandomUser('client');
            const advocate = Math.random() > 0.3 ? createdAdvocates[Math.floor(Math.random() * createdAdvocates.length)] : null;

            const caseRef = db.collection('cases').doc();
            const newCase = {
                ...caseData,
                clientId: client._id,
                advocateId: advocate ? advocate._id : null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await caseRef.set(newCase);
            createdCases.push({ ...newCase, _id: caseRef.id });
        }
        console.log(`  Created ${createdCases.length} cases\n`);

        // 4. Notifications (Quick Batch)
        console.log('Creating Notifications...');
        const notifBatch = db.batch();
        for (const notif of notificationsData) {
            const user = getRandomUser('client'); // Simply assign to random client
            const ref = db.collection('notifications').doc();
            notifBatch.set(ref, {
                ...notif,
                userId: user._id,
                relatedCase: createdCases[0]._id, // Dummy link
                createdAt: new Date()
            });
        }
        await notifBatch.commit();
        console.log(`  Created ${notificationsData.length} notifications\n`);

        console.log('\n========== SEEDING COMPLETE ==========');
        console.log('Note: This script requires FIREBASE_SERVICE_ACCOUNT_JSON env var to be set.');
        process.exit(0);

    } catch (error) {
        console.error('\nSEEDING FAILED:', error);
        process.exit(1);
    }
}

seedFirebase();
