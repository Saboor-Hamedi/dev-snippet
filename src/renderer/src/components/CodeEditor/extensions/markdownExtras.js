import { Decoration, EditorView, ViewPlugin, keymap } from '@codemirror/view'
import { RangeSetBuilder, Prec } from '@codemirror/state'

/**
 * Decorator for WikiLinks [[link]], @mentions, #hashtags, and TABLES
 * Adds visual styling without modifying the parser
 */

/**
 * Decorator for WikiLinks [[link]], @mentions, #hashtags, and TABLES
 * Optimized for zero-latency in large documents.
 */

const wikiLinkDeco = Decoration.mark({ class: 'cm-wikilink' })
const mentionDeco = Decoration.mark({ class: 'cm-mention' })
const hashtagDeco = Decoration.mark({ class: 'cm-hashtag' })
const tableRowDeco = Decoration.line({ class: 'cm-md-table-row' })

function buildDecorations(view) {
  const builder = new RangeSetBuilder()
  const doc = view.state.doc

  // 1. VIEWPORT-AWARE PROCESSING (Crucial for stability and performance)
  // We only calculate decorations for the visible part + some buffer
  const viewport = view.viewport
  const from = viewport.from
  const to = viewport.to

  // Slice only the visible part for regex matching
  const text = doc.sliceString(from, to)
  const matches = []

  // 2. INLINE MATCHES (WikiLinks, Mentions, Hashtags)
  // Regexes are applied to the viewport slice. Indices are then offset by 'from'.

  // WikiLinks: [[text]]
  const wikiLinkRegex = /\[\[[^\]\n]+\]\]/g
  let match
  while ((match = wikiLinkRegex.exec(text)) !== null) {
    matches.push({
      from: from + match.index,
      to: from + match.index + match[0].length,
      deco: wikiLinkDeco
    })
  }

  // @mentions: @word
  const mentionRegex = /(?:^|\s)(@[\w]+)/g
  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMatch = match[0]
    const mention = match[1]
    const start = match.index + (fullMatch.length - mention.length)
    matches.push({ from: from + start, to: from + start + mention.length, deco: mentionDeco })
  }

  // #hashtags: #word
  const hashtagRegex = /(?:^|\s)(#[\w]+)/g
  while ((match = hashtagRegex.exec(text)) !== null) {
    const fullMatch = match[0]
    const hashtag = match[1]
    const start = match.index + (fullMatch.length - hashtag.length)
    matches.push({ from: from + start, to: from + start + hashtag.length, deco: hashtagDeco })
  }

  // 3. LINE-BASED DECORATIONS (Tables)
  // We iterate through lines only within the visible viewport
  try {
    const startLine = doc.lineAt(from).number
    const endLine = doc.lineAt(to).number

    for (let i = startLine; i <= endLine; i++) {
      const line = doc.line(i)
      const lineText = line.text.trim()
      // Detect Markdown tables: start/end with pipes and have meaningful content
      if (lineText.startsWith('|') && lineText.endsWith('|') && lineText.length > 2) {
        matches.push({ from: line.from, to: line.from, deco: tableRowDeco, isLine: true })
      }
    }
  } catch (e) {
    // Safety for edge cases during rapid doc updates
  }

  // 4. SORT AND BUILD
  // CodeMirror requires RangeSetBuilder to receive decorations in ascending order.
  // Line decorations MUST come before mark decorations at the same position.
  matches.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from
    if (a.isLine && !b.isLine) return -1
    if (!a.isLine && b.isLine) return 1
    return 0
  })

  for (const m of matches) {
    // Final boundary check to prevent out-of-bounds errors
    const safeFrom = Math.max(0, Math.min(m.from, doc.length))
    const safeTo = Math.max(safeFrom, Math.min(m.to || safeFrom, doc.length))

    if (m.isLine) {
      builder.add(safeFrom, safeFrom, m.deco)
    } else if (safeTo > safeFrom) {
      builder.add(safeFrom, safeTo, m.deco)
    }
  }

  return builder.finish()
}

export const markdownExtrasPlugin = ViewPlugin.fromClass(
  class {
    decorations
    constructor(view) {
      this.decorations = buildDecorations(view)
    }
    update(update) {
      // Re-calculate on content change OR scroll (viewport changed)
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)

/**
 * SMART PAIRS & DELETION logic (Highest Precedence)
 */
const smartKeymap = [
  {
    key: 'Backspace',
    run: (view) => {
      const { state, dispatch } = view
      const { selection } = state
      if (!selection.main.empty) return false
      const pos = selection.main.head
      const docLen = state.doc.length

      const pairs = [
        { b: '[[', a: ']]' },
        { b: '***', a: '***' },
        { b: '```', a: '```' },
        { b: '**', a: '**' },
        { b: '~~', a: '~~' },
        { b: '==', a: '==' },
        { b: '[', a: ']' },
        { b: '{', a: '}' },
        { b: '(', a: ')' },
        { b: '*', a: '*' },
        { b: '_', a: '_' },
        { b: '`', a: '`' }
      ]

      for (const pair of pairs) {
        const blen = pair.b.length
        const alen = pair.a.length
        if (pos >= blen && pos <= docLen - alen) {
          const before = state.doc.sliceString(pos - blen, pos)
          const after = state.doc.sliceString(pos, pos + alen)
          if (before === pair.b && after === pair.a) {
            dispatch({ changes: { from: pos - blen, to: pos + alen, insert: '' } })
            return true
          }
        }
      }
      return false
    }
  },
  {
    key: '[',
    run: (view) => {
      const { state, dispatch } = view
      const { selection } = state
      if (!selection.main.empty) return false
      const pos = selection.main.head
      const before1 = pos >= 1 ? state.doc.sliceString(pos - 1, pos) : ''
      const after1 = pos < state.doc.length ? state.doc.sliceString(pos, pos + 1) : ''

      if (before1 === '[' && after1 === ']') {
        dispatch({
          changes: { from: pos - 1, to: pos + 1, insert: '[[]]' },
          selection: { anchor: pos + 1 }
        })
        return true
      }
      if (before1 === '[') {
        dispatch({ changes: { from: pos, to: pos, insert: '[]]' }, selection: { anchor: pos + 1 } })
        return true
      }
      return false
    }
  },
  {
    key: '`',
    run: (view) => {
      const { state, dispatch } = view
      const { selection } = state
      if (!selection.main.empty) return false
      const pos = selection.main.head
      const before2 = pos >= 2 ? state.doc.sliceString(pos - 2, pos) : ''
      const after1 = pos < state.doc.length ? state.doc.sliceString(pos, pos + 1) : ''

      // If user types 3rd backtick -> ```|```
      if (before2 === '``' && after1 === '`') {
        dispatch({
          changes: { from: pos - 2, to: pos + 1, insert: '``````' },
          selection: { anchor: pos + 1 }
        })
        return true
      }
      return false
    }
  }
]

export const markdownExtrasExtension = [markdownExtrasPlugin, Prec.highest(keymap.of(smartKeymap))]
