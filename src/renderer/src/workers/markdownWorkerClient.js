/**
 * markdownWorkerClient.js
 *
 * A robust, promise-based client for the Markdown Worker.
 * Handles task queuing, concurrency control, and lifecycle management.
 */

// We use Vite's native worker support
import MarkdownWorker from './markdown.worker?worker'

class MarkdownWorkerClient {
  constructor() {
    this.worker = null
    this.callbacks = new Map()
    this.idCounter = 0
    this.init()
  }

  init() {
    if (typeof Worker === 'undefined') {
      console.error('[WorkerClient] Web Workers are not supported in this environment.')
      return
    }

    try {
      // Restore Worker with STRICT Environment Check
      // This worker now runs a lighter parser (no rehype-raw/highlight) for max speed
      this.worker = new MarkdownWorker()
      this.worker.onmessage = this.handleMessage.bind(this)
      this.worker.onerror = (err) => {
        console.error('[WorkerClient] Worker error:', err)
      }
      console.log('[WorkerClient] ✅ Web Worker active (Optimized Mode).')
    } catch (err) {
      console.error('[WorkerClient] Failed to initialize worker:', err)
    }
  }

  handleMessage(event) {
    const { id, result, error, success } = event.data
    const callback = this.callbacks.get(id)

    if (callback) {
      if (success) {
        callback.resolve(result)
      } else {
        callback.reject(new Error(error))
      }
      this.callbacks.delete(id)
    }
  }

  /**
   * parseMarkdown - Sends a string to the worker for parsing.
   */
  async parseMarkdown(text, options = {}) {
    if (!this.worker) {
      const { markdownToHtml } = await import('../utils/markdownParser')
      return markdownToHtml(text, options)
    }

    return new Promise((resolve, reject) => {
      const id = ++this.idCounter
      this.callbacks.set(id, { resolve, reject })
      this.worker.postMessage({
        id,
        type: 'markdown',
        payload: { text, options }
      })
    })
  }

  /**
   * parseCode - Highlighting code blocks in the worker.
   */
  async parseCode(code, language) {
    if (!this.worker) {
      const { codeToHtml } = await import('../utils/markdownParser')
      return codeToHtml(code, language)
    }

    return new Promise((resolve, reject) => {
      const id = ++this.idCounter
      this.callbacks.set(id, { resolve, reject })
      this.worker.postMessage({
        id,
        type: 'code',
        payload: { code, language }
      })
    })
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}

// Export a singleton instance
export const markdownWorkerClient = new MarkdownWorkerClient()
