import { Decoration, ViewPlugin } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { sortDecorations } from './utils'
import { EditorMode, editorModeField, activeLinesField } from './state'

const hideMarkerDeco = Decoration.mark({ class: 'cm-marker-hidden' })
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
      const wikiLinkRegex = /\[\[([^\]\n]+)\]\]/g
      const mode = view.state.field(editorModeField)
      const activeLines = view.state.field(activeLinesField)
      let match
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const start = from + match.index
        const end = from + match.index + match[0].length
        const content = match[1]

        // Reveal logic (Matches Obsidian)
        let isRevealed = mode === EditorMode.SOURCE
        if (mode === EditorMode.LIVE_PREVIEW) {
          const lineNum = doc.lineAt(start).number
          if (activeLines.has(lineNum)) isRevealed = true
        }

        if (isRevealed || mode === EditorMode.SOURCE) {
          // In edit mode or active line, show everything normally
          collected.push({ from: start, to: end, deco: wikiLinkDeco })
        } else {
          // Hide the brackets, show the content as a link
          collected.push({ from: start, to: start + 2, deco: hideMarkerDeco }) // [[
          collected.push({ from: start + 2, to: end - 2, deco: wikiLinkDeco }) // content
          collected.push({ from: end - 2, to: end, deco: hideMarkerDeco }) // ]]
        }
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
