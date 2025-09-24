import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://6ek4lvmwpc.execute-api.eu-central-1.amazonaws.com',
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, ''), // strip "/api" → upstream sees "/dev/..."
            },
        },
    },
});
