import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * Vite Configuration for OnboardRash Frontend
 * 
 * Features:
 * - Path aliases for clean imports
 * - API proxy to Flask backend (localhost:5000)
 * - WebSocket proxy for Socket.IO real-time events
 * - Optimized build with code splitting
 * - Tailwind CSS v4 integration
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5173,
    host: true, // Allow external access
    
    // Proxy API requests to Flask backend
    proxy: {
      // REST API endpoints
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      
      // Socket.IO WebSocket connection
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps for production
    
    // Optimize bundle size with code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React core and routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Animation libraries
          'animation-vendor': ['framer-motion', 'lenis'],
          
          // Map libraries
          'map-vendor': ['leaflet', 'react-leaflet'],
          
          // Communication libraries
          'socket-vendor': ['socket.io-client'],
          
          // Utility libraries
          'utils-vendor': ['clsx', 'tailwind-merge', 'lucide-react'],
        },
      },
    },
    
    // Performance optimizations
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    minify: 'esbuild', // Use esbuild for faster builds
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'socket.io-client',
      'leaflet',
      'react-leaflet',
    ],
  },
})
