import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'convex/_generated': path.resolve(
        __dirname,
        '../backend/convex/_generated'
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react-vendor';
          }

          if (id.includes('/react-router')) {
            return 'router-vendor';
          }

          if (id.includes('/@clerk/') || id.includes('/convex')) {
            return 'services-vendor';
          }

          if (id.includes('/framer-motion') || id.includes('/motion-')) {
            return 'motion-vendor';
          }

          if (
            id.includes('/@radix-ui/') ||
            id.includes('/@floating-ui/') ||
            id.includes('/react-remove-scroll')
          ) {
            return 'ui-vendor';
          }

          if (
            id.includes('/@nivo/') ||
            id.includes('/d3-') ||
            id.includes('/lodash') ||
            id.includes('/@react-spring/') ||
            id.includes('/react-virtualized-auto-sizer')
          ) {
            return 'charts-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});
