import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // Enables React fast refresh & JSX transform

  optimizeDeps: {
    exclude: ['lucide-react'], // Optional: prevents pre-bundling `lucide-react`
  },

  server: {
    host: '0.0.0.0',
    port: 12002,
    proxy: {
      '/api': {
        target: 'http://localhost:12000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
