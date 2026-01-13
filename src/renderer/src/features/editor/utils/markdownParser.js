/**
 * Headless Markdown Intel Engine
 * Pure logic for extracting metadata, links, and structure from raw markdown.
 * NO DEPENDENCIES on React, CodeMirror, or Browser DOM.
 */

/**
 * Extracts unique hashtags from text.
 * Skips mentions (@) to keep the tag library clean.
 */
export const extractTags = (text) => {
  if (!text) return []
  const tags = new Set()
  const re = /(?:^|\s)#([a-zA-Z_][a-zA-Z0-9_-]*)/g
  const str = String(text)
  let m
  while ((m = re.exec(str))) {
    const tag = m[1].toLowerCase()
    if (!/^\d+$/.test(tag)) {
      tags.add(tag)
    }
  }
  return Array.from(tags)
}

/**
 * Extracts WikiLinks [[Target]] from text.
 */
export const extractWikiLinks = (text) => {
  if (!text) return []
  const links = new Set()
  const re = /\[\[(.*?)(?:\|(.*?))?\]\]/g
  const str = String(text)
  let m
  while ((m = re.exec(str))) {
    const target = m[1].trim()
    if (target) links.add(target)
  }
  return Array.from(links)
}

/**
 * Safely normalizes paths/filenames.
 */
export const normalizeTitle = (title) => {
  if (!title) return 'Untitled.md'
  let normalized = title.trim()
  if (!normalized.toLowerCase().endsWith('.md')) {
    normalized += '.md'
  }
  return normalized
}
