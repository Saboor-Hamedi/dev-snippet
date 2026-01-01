import { Decoration, ViewPlugin } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { sortDecorations } from './utils'

const wikiLinkDeco = Decoration.mark({ class: 'cm-wikilink' })
const mentionDeco = Decoration.mark({ class: 'cm-mention' })
const hashtagDeco = Decoration.mark({ class: 'cm-hashtag' })

// -----------------------------------------------------------------------------
// 2. Inline Regex-based Decorations (ViewPlugin)
// -----------------------------------------------------------------------------
export const inlineRegexPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.getDecorations(view)
    }

    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view)
      }
    }

    getDecorations(view) {
      if (!view || !view.state || !view.state.doc) return Decoration.none
      const doc = view.state.doc
      const viewport = view.viewport

      if (!viewport || typeof viewport.from !== 'number' || typeof viewport.to !== 'number')
        return Decoration.none
      const docLen = doc.length
      if (viewport.to > docLen) return Decoration.none

      const from = viewport.from
      const to = viewport.to
      const text = doc.sliceString(from, to)

      const collected = []

      // 1. WikiLinks
      const wikiLinkRegex = /\[\[[^\]\n]+\]\]/g
      let match
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        collected.push({
          from: from + match.index,
          to: from + match.index + match[0].length,
          deco: wikiLinkDeco
        })
      }

      // 2. Mentions
      const mentionRegex = /(?:^|\s)(@[\w]+)/g
      while ((match = mentionRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const mention = match[1]
        const start = match.index + (fullMatch.length - mention.length)
        collected.push({ from: from + start, to: from + start + mention.length, deco: mentionDeco })
      }

      // 3. Hashtags
      const hashtagRegex = /(?:^|\s)(#[\w]+)/g
      while ((match = hashtagRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const hashtag = match[1]
        const start = match.index + (fullMatch.length - hashtag.length)
        collected.push({ from: from + start, to: from + start + hashtag.length, deco: hashtagDeco })
      }

      const builder = new RangeSetBuilder()
      const valid = collected.filter((d) => d.from >= 0 && d.to <= docLen && d.from <= d.to)

      sortDecorations(valid).forEach((d) => {
        try {
          if (builder.lastFrom <= d.from) builder.add(d.from, d.to, d.deco)
        } catch (e) {}
      })
      return builder.finish()
    }
  },
  { decorations: (v) => v.decorations }
)
