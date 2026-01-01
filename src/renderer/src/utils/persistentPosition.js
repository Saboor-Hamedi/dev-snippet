/**
 * Persistent Position Utility
 * Saves and retrieves element coordinates from localStorage to maintain UI state across sessions.
 */

/**
 * Retrieves a saved position or returns the default.
 * @param {string} key Unique identifier for the element
 * @param {Object} defaultValue Default { left, top } position
 */
export const getPersistentPosition = (key, defaultValue = { left: '50%', top: '20%' }) => {
  try {
    const saved = localStorage.getItem(`pos_${key}`)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn(`[PersistentPosition] Failed to load ${key}:`, e)
  }
  return defaultValue
}

/**
 * Saves a position to localStorage.
 * @param {string} key Unique identifier for the element
 * @param {Object} pos { left, top } coordinates
 */
export const savePersistentPosition = (key, pos) => {
  try {
    if (!pos || (pos.left === undefined && pos.top === undefined)) return
    localStorage.setItem(`pos_${key}`, JSON.stringify(pos))
  } catch (e) {
    console.warn(`[PersistentPosition] Failed to save ${key}:`, e)
  }
}

/**
 * Saves cursor selection for a specific snippet.
 */
export const saveCursorPosition = (snippetId, selection) => {
  if (!snippetId || !selection) return
  try {
    localStorage.setItem(
      `cursor_${snippetId}`,
      JSON.stringify({
        anchor: selection.anchor,
        head: selection.head
      })
    )
  } catch (e) {}
}

/**
 * Retrieves cursor selection for a specific snippet.
 */
export const getCursorPosition = (snippetId) => {
  if (!snippetId) return null
  try {
    const saved = localStorage.getItem(`cursor_${snippetId}`)
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    return null
  }
}
