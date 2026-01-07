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
  const safeName = typeof name === 'string' ? name : 'Untitled'
  let trimmed = safeName.trim() || 'Untitled'

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
  // Improved Regex: Must start with a letter or underscore, 
  // followed by alphanumeric/dashes. Prevents #1 or @2024 from being tags.
  const re = /(?:^|\s)[#@]([a-zA-Z_][a-zA-Z0-9_-]*)/g
  let m
  const str = String(text)
  while ((m = re.exec(str))) {
    const tag = m[1].toLowerCase()
    // Additional Safety: Ignore purely numeric tags (redundant with regex but safe)
    if (!/^\d+$/.test(tag)) {
      tags.add(tag)
    }
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
  const title = ensureExtension(snippet.title)

  return {
    ...snippet,
    title,
    code,
    language: 'markdown', // Enforcement of project standard
    type: snippet.type || 'snippet',
    tags: Array.from(
      new Set([
        ...(Array.isArray(snippet.tags)
          ? snippet.tags
          : typeof snippet.tags === 'string'
            ? snippet.tags.split(',').filter(Boolean)
            : []),
        ...extractTags(code)
      ])
    ).filter(t => typeof t === 'string' && t.length > 0 && !/^\d+$/.test(t)),
    timestamp: snippet.timestamp || Date.now(),
    is_draft: false, // Always mark as not draft when normalizing/saving
    is_pinned: snippet.is_pinned || 0,
    is_favorite: snippet.is_favorite || 0,
    folder_id: snippet.folder_id || null
  }
}

/**
 * Strips extensions and standardizes a title for comparison/display logic
 * @param {string} title
 * @returns {string} normalized title (lowercase, no .md)
 */
export const getBaseTitle = (title) => {
  if (typeof title !== 'string') return ''
  return title.toLowerCase().trim().replace(/\.md$/, '')
}

/**
 * Detects if a title represents a Daily Log/Journal date
 * @param {string} title
 * @returns {boolean}
 */
export const isDateTitle = (title) => {
  const base = getBaseTitle(title)
  return /^\d{4}-\d{2}-\d{2}$/.test(base) || /^[a-zA-Z]{3} \d{1,2}, \d{4}$/.test(base)
}

/**
 * Generates a unique title within a folder by appending a counter if needed
 * @param {string} baseTitle - The desired title
 * @param {string|null} folderId - The folder context
 * @param {Array} snippets - The full collection of snippets
 * @param {string|null} excludeId - ID of a snippet to ignore (e.g., current snippet being renamed)
 * @returns {string} - A unique title
 */
export const getUniqueTitle = (baseTitle, folderId, snippets, excludeId = null) => {
  const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')
  const targetBase = normalize(baseTitle)

  let counter = 1
  let finalTitle = baseTitle
  let currentBase = targetBase

  while (
    snippets.find(
      (s) =>
        normalize(s.title) === currentBase &&
        (s.folder_id || null) === (folderId || null) &&
        s.id !== excludeId
    )
  ) {
    const cleanBase = baseTitle.replace(/\.md$/, '')
    if (cleanBase.match(/\sPart\s\d+$/)) {
      const basePart = cleanBase.replace(/\sPart\s\d+$/, '')
      finalTitle = `${basePart} Part ${counter + 1}.md`
    } else if (cleanBase.match(/\scontinue\s?(\d+)?$/)) {
      const match = cleanBase.match(/(.*? continue)\s?(\d+)?$/)
      const base = match ? match[1] : cleanBase
      const num = match && match[2] ? parseInt(match[2]) + 1 : counter + 1
      finalTitle = `${base} ${num}.md`
    } else {
      finalTitle = `${cleanBase} (${counter}).md`
    }
    currentBase = normalize(finalTitle)
    counter++
  }
  return finalTitle
}

/**
 * Sanitizes a title string, removing invalid filename characters and excessive punctuation.
 * @param {string} title
 * @returns {string}
 */
export const sanitizeTitle = (title) => {
  if (!title) return ''
  // Strict Whitelist: Allow only Letters, Numbers, Spaces, Underscores, Hyphens.
  // This removes all symbols like []%^&()@#$ etc.
  // Exception: Dot (.) is allowed for extension or semantic versioning logic.
  return title.replace(/[^a-zA-Z0-9 _.-]/g, '')
}
