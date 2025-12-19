import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'electron-vite'

export default defineConfig({
  plugins: [react(), electron()],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
