import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/static/', // Set base path for production builds
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    axios: ['axios']
                },
                // Configure asset file names to include static/assets path
                assetFileNames: 'static/assets/[name]-[hash][extname]',
                chunkFileNames: 'static/assets/[name]-[hash].js',
                entryFileNames: 'static/assets/[name]-[hash].js'
            }
        }
    }
})
