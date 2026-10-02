import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GAS_PROXY_PRESENSI = process.env.VITE_GAS_PRESENSI_URL
  || 'https://script.google.com/macros/s/AKfycbx8uUhZCShJqr3uiOXeRcZTzZ59wQtzmC5O-4Npn13aKcyEwn2fwfLDxQWmyf6qZg/exec'

const GAS_PROXY_ANEKDOT = process.env.VITE_GAS_ANEKDOT_URL
  || 'https://script.google.com/macros/s/AKfycby4No_Yd3lOZ90h4SnwFEohUD_99_q3khqsb8raPeUCQl7bX63R81FCjueejU--GP1O/exec'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api/gas': {
        target: GAS_PROXY_PRESENSI,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/gas/, '')
      },
      '/api/backend': {
        target: GAS_PROXY_ANEKDOT,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/backend/, '')
      }
    }
  }
})
