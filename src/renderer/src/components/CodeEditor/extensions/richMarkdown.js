import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// Define syntax highlighting colors without changing layout/size
export const richMarkdownStyles = HighlightStyle.define([
  // Headers
  { tag: t.heading, fontWeight: 'bold', color: 'var(--color-text-primary)' },
  { tag: t.heading1, fontWeight: 'bold', color: '#58a6ff' },
  { tag: t.heading2, fontWeight: 'bold', color: '#58a6ff' },

  // Emphasis
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through', opacity: '0.7' },

  // Lists
  { tag: t.list, color: '#f0883e' }, // Orange-ish for bullets

  // Code
  {
    tag: t.monospace,
    color: '#a5d6ff'
  },

  // Links
  { tag: t.link, color: '#58a6ff', textDecoration: 'underline' },
  { tag: t.url, color: '#58a6ff', textDecoration: 'underline' },

  // Blockquotes
  {
    tag: t.quote,
    fontStyle: 'italic',
    color: 'var(--color-text-secondary)'
  },

  // Keywords (for code blocks if detected)
  { tag: t.keyword, color: '#ff7b72' },
  { tag: t.string, color: '#a5d6ff' },
  { tag: t.variableName, color: '#d2a8ff' },
  { tag: t.comment, color: '#8b949e', fontStyle: 'italic' }
])

// Only export the syntax highlighting, NOT the layout-altering theme
export const richMarkdownExtension = [syntaxHighlighting(richMarkdownStyles)]
