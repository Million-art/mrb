import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';
import rollupNodePolyfills from 'rollup-plugin-node-polyfills';

// Resolve __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(), // Vite React plugin
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'], // Inject Buffer for Node.js compatibility
        }),
        rollupNodePolyfills(), // Add Node.js polyfills for Rollup
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6', 
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // Use globalThis to define global
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true, // Polyfill Buffer for esbuild
        }),
      ],
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    // allowedHosts: ['.loca.lt'], // Allow localtunnels subdomains
    //  allowedHosts: ['https://9d50-185-183-33-221.ngrok-free.app'], // Allow localtunnels subdomains
     allowedHosts: [
      "b5de-102-213-69-194.ngrok-free.app",  
    ],
    
  },
});
