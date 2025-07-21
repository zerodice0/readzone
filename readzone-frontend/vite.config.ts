/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          // Router chunk
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }
          // UI library
          if (id.includes('node_modules/lucide-react')) {
            return 'ui';
          }
          // Pages chunks (lazy loaded)
          if (id.includes('src/pages/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('src/pages/Library')) {
            return 'library';
          }
          if (id.includes('src/pages/Statistics')) {
            return 'statistics';
          }
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }
        },
        chunkFileNames: () => {
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  define: {
    // Fix for some libraries that expect global to be defined
    global: 'globalThis',
  },
})
