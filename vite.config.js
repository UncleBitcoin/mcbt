import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
