// vite.config.js
import path from 'path'
export default {
  resolve: {
    alias: {
      '@codemirror/state': path.resolve(__dirname, 'node_modules/@codemirror/state'),
      '@codemirror/view': path.resolve(__dirname, 'node_modules/@codemirror/view')
    }
  }
}
