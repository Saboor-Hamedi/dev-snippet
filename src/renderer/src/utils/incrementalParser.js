/**
 * incrementalParser.js
 * Parses large markdown documents in chunks
 * Allows cancellation and progressive rendering
 */

import { markdownToHtml } from './markdownParser'

class IncrementalParser {
  /**
   * Parse markdown in chunks for large files
   * Yields parsed sections progressively
   */
  async *parseInChunks(code, options = {}, onChunk = null) {
    const chunkSize = 10000 // ~10k characters per chunk
    const isTooLarge = code.length > 500000
    const visibleCode = isTooLarge ? code.slice(0, 500000) : code

    // For small docs, parse all at once
    if (visibleCode.length < chunkSize) {
      const result = await markdownToHtml(visibleCode, options)
      yield { html: result, progress: 100, isComplete: true }
      if (onChunk) onChunk({ html: result, progress: 100, isComplete: true })
      return
    }

    // For large docs, parse in chunks
    const chunks = []
    for (let i = 0; i < visibleCode.length; i += chunkSize) {
      chunks.push(visibleCode.slice(i, i + chunkSize))
    }

    let accumulatedHtml = ''
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkHtml = await markdownToHtml(chunks[i], options)
        accumulatedHtml += chunkHtml
        const progress = Math.round(((i + 1) / chunks.length) * 100)
        
        const result = {
          html: accumulatedHtml,
          progress,
          isComplete: i === chunks.length - 1,
          chunkIndex: i,
          totalChunks: chunks.length
        }

        yield result
        if (onChunk) onChunk(result)
      } catch (err) {
        console.error(`Error parsing chunk ${i}:`, err)
        throw err
      }
    }

    // Add truncation notice if needed
    if (isTooLarge) {
      accumulatedHtml += '<div class="preview-performance-notice">Preview truncated for performance.</div>'
      yield { html: accumulatedHtml, progress: 100, isComplete: true, isTruncated: true }
    }
  }

  /**
   * Parse with cancellation support
   */
  async parseWithCancellation(code, abortSignal, options = {}) {
    if (abortSignal?.aborted) {
      throw new DOMException('Parsing cancelled', 'AbortError')
    }

    const listener = () => {
      throw new DOMException('Parsing cancelled', 'AbortError')
    }

    abortSignal?.addEventListener('abort', listener)

    try {
      const isTooLarge = code.length > 500000
      const visibleCode = isTooLarge ? code.slice(0, 500000) : code
      
      const result = await markdownToHtml(visibleCode, options)
      return {
        html: result,
        isTruncated: isTooLarge
      }
    } finally {
      abortSignal?.removeEventListener('abort', listener)
    }
  }
}

export const incrementalParser = new IncrementalParser()
