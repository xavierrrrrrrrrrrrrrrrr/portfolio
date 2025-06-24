import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // Enables React fast refresh & JSX transform

  optimizeDeps: {
    exclude: ['lucide-react'], // Optional: prevents pre-bundling `lucide-react`
  },

  server: {
    proxy: {
      '/api': 'http://localhost:3001', // Routes like /api/repos → server at port 3001
    },
  },
});
