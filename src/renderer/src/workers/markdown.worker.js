/**
 * Worker Entry Point
 * Dynamically imports the parser only when needed to avoid top-level side effects.
 */

// Polyfill document for stubborn libraries (like certain versions of highlight.js/lowlight)
// that perform strict environment checks.
if (typeof self.document === 'undefined') {
  self.document = {
    createElement: () => ({}),
    documentElement: { style: {} },
    getElementsByTagName: () => [],
    head: { appendChild: () => {} }
  }
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data

  try {
    // Lazy load the parser engine inside the worker
    const { markdownToHtml, codeToHtml } = await import('../utils/markdownParser')

    let result = ''
    if (type === 'markdown') {
      const { text, options } = payload
      result = await markdownToHtml(text, options)
    } else if (type === 'code') {
      const { code, language } = payload
      result = await codeToHtml(code, language)
    }

    self.postMessage({ id, result, success: true })
  } catch (error) {
    console.error('[Markdown Worker] Task failed:', error)
    self.postMessage({ id, error: error.message, success: false })
  }
}
