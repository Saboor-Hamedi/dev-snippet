/**
 * parseCache.js
 * Smart caching layer for markdown parsing results
 * Memoizes parse results and invalidates only changed sections
 */

class ParseCache {
  constructor(maxSize = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.accessOrder = []
  }

  /**
   * Generate cache key from content hash + metadata
   */
  generateKey(code, language, options = {}) {
    const hash = this.simpleHash(code)
    const optionsStr = JSON.stringify(options)
    return `${language}:${hash}:${optionsStr}`
  }

  /**
   * Simple hash function for content
   */
  simpleHash(str) {
    let hash = 0
    if (str.length === 0) return hash.toString()
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cached result or null
   */
  get(code, language, options) {
    const key = this.generateKey(code, language, options)
    if (this.cache.has(key)) {
      // Move to end (LRU)
      this.accessOrder = this.accessOrder.filter(k => k !== key)
      this.accessOrder.push(key)
      return this.cache.get(key)
    }
    return null
  }

  /**
   * Set cache entry with LRU eviction
   */
  set(code, language, result, options) {
    const key = this.generateKey(code, language, options)
    
    // Evict oldest if full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift()
      this.cache.delete(oldest)
    }

    this.cache.set(key, result)
    this.accessOrder = this.accessOrder.filter(k => k !== key)
    this.accessOrder.push(key)
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: this.accessOrder.length
    }
  }
}

export const parseCache = new ParseCache(50)
