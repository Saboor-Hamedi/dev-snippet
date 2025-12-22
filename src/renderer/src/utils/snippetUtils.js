/**
 * Utility functions for snippet management
 */

/**
 * Ensures a filename has the correct extension (defaulting to .md)
 * @param {string} name - The filename/title
 * @param {string} ext - The extension to enforce (default: .md)
 * @returns {string} - The normalized filename
 */
export const ensureExtension = (name, ext = '.md') => {
  let trimmed = (name || '').trim() || 'Untitled'

  if (!trimmed.toLowerCase().endsWith(ext)) {
    // Remove existing extension if any, then append
    const nameWithoutExt = trimmed.replace(/\.[^.\\/]+$/, '')
    return `${nameWithoutExt}${ext}`
  }

  return trimmed
}

/**
 * Extracts hashtags from a block of text
 * @param {string} text - The source text
 * @returns {string[]} - Array of unique hashtags (without the #)
 */
export const extractTags = (text) => {
  if (!text) return []
  const tags = new Set()
  const re = /(?:^|\s)[#@]([a-zA-Z0-9_-]+)/g
  let m
  const str = String(text)
  while ((m = re.exec(str))) {
    tags.add(m[1].toLowerCase())
  }
  return Array.from(tags)
}

/**
 * Normalizes a snippet payload with defaults and derived data
 * @param {object} snippet - The snippet data
 * @returns {object} - The normalized payload
 */
export const normalizeSnippet = (snippet) => {
  const code = snippet.code || ''
  const title = ensureExtension(snippet.title || 'Untitled')

  return {
    ...snippet,
    title,
    code,
    language: 'markdown', // Enforcement of project standard
    type: snippet.type || 'snippet',
    tags: extractTags(code),
    timestamp: snippet.timestamp || Date.now(),
    is_draft: snippet.is_draft || false
  }
}
