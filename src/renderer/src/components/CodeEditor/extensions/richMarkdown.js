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
    color: 'var(--color-accent-primary, #58a6ff)',
    borderBottom: '1px solid rgba(88, 166, 255, 0.2)'
  },

  // Emphasis
  { tag: t.strong, fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' },
  { tag: t.emphasis, fontStyle: 'italic', color: 'var(--color-text-primary, #f8fafc)' },
  {
    tag: t.strikethrough,
    textDecoration: 'line-through',
    color: 'var(--color-text-tertiary, #64748b)'
  },

  // Code (inline)
  {
    tag: t.monospace,
    color: 'var(--color-syntax-string, #a5d6ff)'
  },

  // Links
  { tag: t.link, color: 'var(--color-accent-primary, #58a6ff)', textDecoration: 'underline' },
  { tag: t.url, color: 'var(--color-accent-primary, #58a6ff)' },

  // Lists & Quotes
  { tag: t.list, color: 'var(--color-text-secondary, #94a3b8)' },
  { tag: t.quote, color: 'var(--color-text-secondary, #94a3b8)', fontStyle: 'italic' },

  // Markdown formatting characters (*, #, `, etc.) - subtle
  { tag: t.punctuation, color: 'var(--color-syntax-punctuation, #6e7681)', opacity: 0.6 },
  { tag: t.processingInstruction, color: 'var(--color-syntax-punctuation, #6e7681)', opacity: 0.6 },
  { tag: t.meta, color: 'var(--color-syntax-punctuation, #6e7681)', opacity: 0.6 },

  // Tables - Robust header styling
  {
    tag: [t.tableHeader, t.propertyName, t.name, t.atom],
    fontWeight: '700',
    color: 'var(--color-accent-primary, #58a6ff)'
  },
  { tag: t.tableDelimiter, color: 'var(--color-syntax-punctuation, #6e7681)', opacity: 0.5 },

  // Code block syntax (for fenced code blocks)
  { tag: t.keyword, color: 'var(--color-syntax-keyword, #ff7b72)' },
  { tag: t.string, color: 'var(--color-syntax-string, #a5d6ff)' },
  {
    tag: [t.variableName, t.definition(t.variableName)],
    color: 'var(--color-syntax-variable, #79c0ff)'
  },
  { tag: t.comment, color: 'var(--color-syntax-comment, #8b949e)', fontStyle: 'italic' }
]
  .map((s) => ({ ...s, tag: sanitize(s.tag) }))
  .filter((s) => s.tag !== undefined && (Array.isArray(s.tag) ? s.tag.length > 0 : true))

export const richMarkdownStyles = HighlightStyle.define(styles)

// Export only the syntax highlighting
export const richMarkdownExtension = [syntaxHighlighting(richMarkdownStyles)]
