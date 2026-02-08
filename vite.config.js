import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    proxy: {
      '/tron': {
        target: 'https://api.trongrid.io',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/tron/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'ethers'],
          tronweb: ['tronweb'],
        },
      },
    },
  },
})
