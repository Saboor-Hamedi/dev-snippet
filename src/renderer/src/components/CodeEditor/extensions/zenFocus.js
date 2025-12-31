import { ViewPlugin, Decoration } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

/**
 * Zen Focus Extension
 * Dims all lines except the one containing the cursor (or the current paragraph).
 */
const dimmedLineDeco = Decoration.line({
  class: 'cm-zen-dimmed'
})

const activeLineDeco = Decoration.line({
  class: 'cm-zen-active'
})

export const zenFocusExtension = (enabled = false) => {
  if (!enabled) return []

  return [
    ViewPlugin.fromClass(
      class {
        constructor(view) {
          this.decorations = this.getDecorations(view)
        }

        update(update) {
          if (update.docChanged || update.selectionSet || update.viewportChanged) {
            this.decorations = this.getDecorations(update.view)
          }
        }

        getDecorations(view) {
          const builder = new RangeSetBuilder()
          const { state } = view
          const selection = state.selection.main

          // Get the line range of the current selection/cursor
          const startLine = state.doc.lineAt(selection.from).number
          const endLine = state.doc.lineAt(selection.to).number

          // We zoom out to the "paragraph" level for a better writing experience
          // A paragraph is a block of lines surrounded by empty lines
          let paraStart = startLine
          while (paraStart > 1 && state.doc.line(paraStart - 1).text.trim() !== '') {
            paraStart--
          }
          let paraEnd = endLine
          while (paraEnd < state.doc.lines && state.doc.line(paraEnd + 1).text.trim() !== '') {
            paraEnd++
          }

          for (const { from, to } of view.visibleRanges) {
            for (let pos = from; pos <= to; ) {
              const line = state.doc.lineAt(pos)
              const isParaHeader = line.text.startsWith('#') // Keep headers slightly visible? No, dim them if not active.

              if (line.number >= paraStart && line.number <= paraEnd) {
                builder.add(line.from, line.from, activeLineDeco)
              } else {
                builder.add(line.from, line.from, dimmedLineDeco)
              }

              pos = line.to + 1
            }
          }

          return builder.finish()
        }
      },
      {
        decorations: (v) => v.decorations
      }
    )
  ]
}
