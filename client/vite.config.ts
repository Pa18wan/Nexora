import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    },
    build: {
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['chart.js', 'react-chartjs-2'],
                    ui: ['lucide-react']
                }
            }
        }
    },
    // Ensure environment variables are available at build time
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify('2.0.0')
    }
})
