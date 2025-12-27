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
    return `${trimmed}${ext}`
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
    is_draft: false, // Always mark as not draft when normalizing/saving
    is_pinned: snippet.is_pinned || 0,
    folder_id: snippet.folder_id || null
  }
}

/**
 * Strips extensions and standardizes a title for comparison/display logic
 * @param {string} title
 * @returns {string} normalized title (lowercase, no .md)
 */
export const getBaseTitle = (title) => (title || '').toLowerCase().trim().replace(/\.md$/, '')

/**
 * Detects if a title represents a Daily Log/Journal date
 * @param {string} title
 * @returns {boolean}
 */
export const isDateTitle = (title) => {
  const base = getBaseTitle(title)
  return /^\d{4}-\d{2}-\d{2}$/.test(base) || /^[a-zA-Z]{3} \d{1,2}, \d{4}$/.test(base)
}
