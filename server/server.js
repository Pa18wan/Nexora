import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars FIRST — resolve path relative to this file so it works both locally and on Vercel
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize Firebase (replaces MongoDB)
import './config/firebase.js';

// Route imports
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import advocateRoutes from './routes/advocates.js';      // Public/Search routes
import advocateRoutesSpecific from './routes/advocate.js'; // Advocate Panel routes
import clientRoutes from './routes/client.js';           // Client Panel routes
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notifications.js';
import documentRoutes from './routes/documents.js';

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable CSP for development/SPA compatibility
}));

// Rate limiting — use higher limit for serverless (cold starts can eat into the limit)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 500 : 200, // Higher limit in production for serverless
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// CORS — On Vercel, frontend and API are on the same domain
app.use(cors({
    origin: isProduction
        ? true // Allow all origins on Vercel (same-domain deployment)
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files — only serve locally (Vercel serverless has no persistent filesystem)
if (!process.env.VERCEL) {
    app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/advocates', advocateRoutes);

// Role-based panels
app.use('/api/client', clientRoutes);
app.use('/api/advocate', advocateRoutesSpecific);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Nexora Legal Services API is running',
        database: 'Firebase Realtime Database',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint - check Firebase connection and env vars (disabled in production)
app.get('/api/debug', async (req, res) => {
    if (isProduction) {
        return res.status(404).json({ success: false, message: 'Route not found' });
    }
    const { db } = await import('./config/firebase.js');
    const checks = {
        env: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
            FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || 'NOT SET (using default)',
            FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
            JWT_SECRET: !!process.env.JWT_SECRET,
            NODE_ENV: process.env.NODE_ENV || 'not set'
        },
        firebase: {
            initialized: false,
            dbConnected: false,
            error: null
        }
    };

    try {
        const admin = (await import('./config/firebase.js')).default;
        checks.firebase.initialized = admin.apps.length > 0;

        // Test RTDB connection
        const testRef = db.ref('.info/connected');
        const snap = await testRef.once('value');
        checks.firebase.dbConnected = snap.val() === true;

        // Try to read users count
        const usersSnap = await db.ref('users').once('value');
        checks.firebase.usersCount = usersSnap.numChildren();
    } catch (error) {
        checks.firebase.error = error.message;
    }

    res.json({ success: true, checks });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Nexora AI Legal Intelligence Platform API',
        version: '2.0.0',
        database: 'Firebase Realtime Database',
        docs: '/api/health'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`
🚀 Nexora Server running on port ${PORT}
🔥 Database: Firebase Realtime Database
📚 API Docs: http://localhost:${PORT}/api/health
🔐 Environment: ${process.env.NODE_ENV || 'development'}
  `);
    });
}

export default app;
