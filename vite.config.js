import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    proxy: {
      '/api/gas': {
        target: 'https://script.google.com/macros/s/AKfycby4No_Yd3lOZ90h4SnwFEohUD_99_q3khqsb8raPeUCQl7bX63R81FCjueejU--GP1O/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gas/, '')
      }
    }
  }
})
