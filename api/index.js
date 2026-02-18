// Vercel Serverless Function entry point
// This file re-exports the Express app for Vercel's serverless runtime

let app;
let initError = null;

try {
    const serverModule = await import('../server/server.js');
    app = serverModule.default;
} catch (error) {
    initError = error;
    console.error('❌ Failed to import server:', error.message);
    console.error('❌ Stack:', error.stack);
}

// If app failed to load, export a fallback handler that returns the error
export default function handler(req, res) {
    if (initError) {
        return res.status(500).json({
            success: false,
            message: 'Server initialization failed',
            error: initError.message,
            stack: process.env.NODE_ENV !== 'production' ? initError.stack : undefined
        });
    }

    if (!app) {
        return res.status(500).json({
            success: false,
            message: 'App not initialized'
        });
    }

    // Delegate to Express app
    return app(req, res);
}
