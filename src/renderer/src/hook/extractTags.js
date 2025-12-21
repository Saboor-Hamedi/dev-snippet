/**
 * Automatically extracts tags and mentions from a given text string.
 * Supports patterns starting with '#' (hashtags) and '@' (mentions).
 *
 * @param {string} text - The input text to scan.
 * @returns {string} - A comma-separated string of unique tags in lowercase.
 */
export const extractTags = (text) => {
  const t = String(text || '')
  const tags = new Set()
  // Support both #tag and @tag
  const re = /(^|\s)[#@]([a-zA-Z0-9_-]+)/g
  let m

  while ((m = re.exec(t))) {
    tags.add(m[2].toLowerCase())
  }
  return Array.from(tags).join(',')
}

export default extractTags
