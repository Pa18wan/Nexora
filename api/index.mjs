// Vercel Serverless Function entry point
// Using dynamic import with proper error handling for Vercel's runtime
let appPromise = null;
let cachedApp = null;
let initError = null;

function getApp() {
    if (cachedApp) return Promise.resolve(cachedApp);
    if (initError) return Promise.reject(initError);
    if (!appPromise) {
        appPromise = import('../server/server.js')
            .then(mod => {
                cachedApp = mod.default;
                return cachedApp;
            })
            .catch(err => {
                initError = err;
                console.error('❌ Failed to import server module:', err.message);
                console.error('❌ Stack:', err.stack);
                throw err;
            });
    }
    return appPromise;
}

export default async function handler(req, res) {
    try {
        const app = await getApp();
        return app(req, res);
    } catch (error) {
        console.error('❌ Handler error:', error.message);
        res.status(500).json({
            success: false,
            message: `Server Init Error: ${error.message}`,
            error: error.message,
            stack: error.stack
        });
    }
}
