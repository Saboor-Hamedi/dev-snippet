import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['electron', 'path', 'fs', 'os', 'child_process']
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
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'codemirror-vendor': ['@uiw/react-codemirror', '@codemirror/state', '@codemirror/view'],
            'ui-vendor': ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      exclude: [
        'unified',
        'remark-parse',
        'remark-gfm',
        'remark-breaks',
        'remark-directive',
        'remark-rehype',
        'rehype-raw',
        'rehype-highlight',
        'rehype-stringify',
        'unist-util-visit'
      ]
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js']
  }
})
