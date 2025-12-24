import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/**
 * Safely sanitize tags. CodeMirror crashes if an undefined tag or an
 * array containing an undefined tag is passed to HighlightStyle.define.
 */
const sanitize = (tag) => {
  if (Array.isArray(tag)) return tag.filter((t) => t !== undefined)
  return tag
}

const styles = [
  // Headings - blue and bold with beautiful underline
  {
    tag: t.heading,
    fontWeight: 'bold',
    color: '#58a6ff',
    borderBottom: '1px solid rgba(88, 166, 255, 0.2)'
  },

  // Emphasis
  { tag: t.strong, fontWeight: 'bold', color: '#c9d1d9' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#c9d1d9' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: '#8b949e' },

  // Code
  {
    tag: t.monospace,
    color: '#a5d6ff'
  },

  // Links
  { tag: t.link, color: '#58a6ff', textDecoration: 'underline' },
  { tag: t.url, color: '#58a6ff' },

  // Lists & Quotes
  { tag: t.list, color: '#8b949e' },
  { tag: t.quote, color: '#8b949e', fontStyle: 'italic' },

  // Markdown formatting characters (*, #, `, etc.) - subtle
  { tag: t.punctuation, color: '#6e7681', opacity: 0.6 },
  { tag: t.processingInstruction, color: '#6e7681', opacity: 0.6 },
  { tag: t.meta, color: '#6e7681', opacity: 0.6 },

  // Tables - Robust header styling
  {
    tag: [t.tableHeader, t.propertyName, t.name, t.atom],
    fontWeight: '700',
    color: '#58a6ff'
  },
  { tag: t.tableDelimiter, color: '#6e7681', opacity: 0.5 },

  // Code block syntax (for fenced code blocks)
  { tag: t.keyword, color: '#ff7b72' },
  { tag: t.string, color: '#a5d6ff' },
  { tag: t.variableName, color: '#d2a8ff' },
  { tag: t.comment, color: '#8b949e', fontStyle: 'italic' }
]
  .map((s) => ({ ...s, tag: sanitize(s.tag) }))
  .filter((s) => s.tag !== undefined && (Array.isArray(s.tag) ? s.tag.length > 0 : true))

export const richMarkdownStyles = HighlightStyle.define(styles)

// Export only the syntax highlighting
export const richMarkdownExtension = [syntaxHighlighting(richMarkdownStyles)]
