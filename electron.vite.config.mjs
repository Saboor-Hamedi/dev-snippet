import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['electron', 'better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      visualizer({
        open: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ],
    css: {
      postcss: './postcss.config.js'
    },
    build: {
      // Optimize bundle size with esbuild (faster than terser)
      minify: 'esbuild',
      // Code splitting configuration
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            'react-vendor': ['react', 'react-dom'],
            'codemirror-vendor': ['@uiw/react-codemirror', '@codemirror/state', '@codemirror/view'],
            'ui-vendor': ['lucide-react']
          }
        }
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000 // 1MB
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js']
  }
})
