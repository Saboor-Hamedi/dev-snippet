/**
 * Editor Utility Functions
 * Specialized for UI sanitization and display logic
 */

/**
 * Sanitizes a title for file system safety.
 * Removes characters: \ / : * ? " < > |
 * @param {string} title 
 * @returns {string} Clean title
 */
export const sanitizeTitle = (title) => {
  if (!title) return 'Untitled'
  return title.replace(/[\\/:*?"<>|]/g, '').trim() || 'Untitled'
}

/**
 * Prepares a title for UI display (Sidebar/Tabs).
 * Strips the .md extension if present.
 * @param {string} title 
 * @returns {string} Display title
 */
export const getDisplayTitle = (title) => {
  if (!title) return 'Untitled'
  // Only strip .md if it's at the end
  return title.replace(/\.md$/i, '')
}

/**
 * Sanitizes a tag string by removing leading # or @ if they "stick" to the word.
 * Also removes commas entirely.
 * @param {string} tag 
 * @returns {string} Clean tag
 */
export const sanitizeTag = (tag) => {
  if (!tag) return ''
  // Only remove leading # or @ if followed by text (non-space)
  // Also remove commas anywhere
  return tag.replace(/^[#@](?=\S)/, '').replace(/,/g, '').trim()
}
