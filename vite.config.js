import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'electron-vite'
import { visualizer } from 'rollup-plugin-visualizer'
export default defineConfig({
  plugins: [react(), electron(), visualizer()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
