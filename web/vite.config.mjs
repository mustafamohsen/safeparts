import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // In production, /help is static content built into dist/help.
    // In dev, proxy /help to the Starlight dev server for a seamless single-site feel.
    proxy: {
      '/help': {
        target: 'http://localhost:4321',
        changeOrigin: true,
      },
    },
  },
})
