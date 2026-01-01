import { ViewPlugin, Decoration } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

/**
 * Zen Focus Extension
 * Dims everything in the editor except the current "writing zone" (active paragraph).
 *
 * Performance: Uses a single pass over visible ranges and minimizes doc lookups.
 * Coverage: Dims both text lines and block widgets (via CSS sibling selectors).
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
          // Re-calculate if layout changes, selection moves, or typing happens
          if (update.docChanged || update.selectionSet || update.viewportChanged) {
            this.decorations = this.getDecorations(update.view)
          }
        }

        getDecorations(view) {
          const builder = new RangeSetBuilder()
          const { state } = view
          const selection = state.selection.main
          const doc = state.doc

          // 1. Identify the "Active Paragraph"
          // We find the block of lines touching the cursor that aren't separated by empty lines.
          // LIMIT: We only expand up/down by 100 lines to prevent O(N) scans in massive files.
          const currentLineNum = doc.lineAt(selection.from).number
          let paraStart = currentLineNum
          let paraEnd = currentLineNum

          const MAX_EXPANSION = 100

          // Expand Up
          let upCount = 0
          while (paraStart > 1 && upCount < MAX_EXPANSION) {
            const prevLine = doc.line(paraStart - 1)
            if (prevLine.text.trim() === '') break
            paraStart--
            upCount++
          }
          // Expand Down
          let downCount = 0
          while (paraEnd < doc.lines && downCount < MAX_EXPANSION) {
            const nextLine = doc.line(paraEnd + 1)
            if (nextLine.text.trim() === '') break
            paraEnd++
            downCount++
          }

          // 2. Apply Decorations
          // We only process what's currently on screen (visibleRanges) for P0 performance.
          for (const { from, to } of view.visibleRanges) {
            const startLine = doc.lineAt(from).number
            const endLine = doc.lineAt(to).number

            for (let l = startLine; l <= endLine; l++) {
              const line = doc.line(l)
              const isActive = line.number >= paraStart && line.number <= paraEnd
              builder.add(line.from, line.from, isActive ? activeLineDeco : dimmedLineDeco)
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
