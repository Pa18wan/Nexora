# Firebase Firestore to Realtime Database (RTDB) Migration Status

## Overview
This document summarizes the migration of the entire backend from Firebase Firestore to Firebase Realtime Database. All controllers, routes, and services have been updated to use RTDB methods (`ref()`, `push()`, `update()`, `set()`, `once()`) instead of Firestore methods (`collection()`, `doc()`, `add()`, `get()`).

## Completed Migrations

### Configuration & Utilities
- [x] **`server/config/firebase.js`**: Updated to initialize `admin.database()`. Added `docToObj` and `queryToArray` helpers covering RTDB snapshots.

### Controllers
- [x] **`auth.js`**: User registration, login, profile updates.
- [x] **`clientController.js`**: Dashboard, cases, advocate hiring, notifications.
- [x] **`advocateController.js`**: Dashboard, case requests, assignment, status updates, analytics, profile updates.
- [x] **`adminController.js`**: Dashboard, user management, advocate verification, system settings, complaints, platform analytics.
- [x] **`documentController.js`**: Document upload, listing (with client-side filtering), download.
- [x] **`aiController.js`**: Chat context retrieval, conversation history, logging interactions.

### Routes (Inline Logic)
- [x] **`server/routes/cases.js`**: Case submission, retrieval, assignment, status updates.
- [x] **`server/routes/notifications.js`**: Fetching, marking as read (single & bulk).
- [x] **`server/routes/advocates.js`**: Public advocate search, profile fetching, dashboard stats.

### Services
- [x] **`server/services/deepseek.js`**: Updated `logInteraction` to use `db.ref('aiLogs').push()`.

### Scripts
- [x] **`server/firebase-seeder.js`**: Updated entire seeding logic to populate RTDB.

## Verification
- Validated server startup with `npm run dev`.
- Verified endpoints health check returns "Firebase Realtime Database".
- Checked code for residual `db.collection` calls and fixed found instances.

## Notes
- **Filtering**: Due to RTDB limitations, complex queries (multi-field filtering) are handled by fetching broader datasets and filtering in memory (e.g., `listAllDocuments`, `getAnalytics`). This is acceptable for current scale.
- **Sorting**: Similar to filtering, sorting is performed in memory after fetching data.
- **IDs**: RTDB push keys are used for auto-generated IDs where appropriate, replacing Firestore auto-IDs.
