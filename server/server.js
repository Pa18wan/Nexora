import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load env vars FIRST
dotenv.config();

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
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// CORS - On Vercel, frontend and API are on the same domain, so allow all origins
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.CLIENT_URL || true) // true = allow all origins (same domain on Vercel)
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (not available in serverless; uploads would need cloud storage in production)
app.use('/uploads', express.static('uploads'));

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
        database: 'Firebase Firestore',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Nexora AI Legal Intelligence Platform API',
        version: '2.0.0',
        database: 'Firebase Firestore',
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
🔥 Database: Firebase Firestore
📚 API Docs: http://localhost:${PORT}/api/health
🔐 Environment: ${process.env.NODE_ENV || 'development'}
  `);
    });
}

export default app;
