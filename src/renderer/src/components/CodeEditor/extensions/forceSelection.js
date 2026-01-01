import { EditorView, Decoration, ViewPlugin } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

/**
 * THE HYBRID SELECTION HACK (forceSelection.js)
 * ===========================================
 *
 * THE PROBLEM:
 * 1. CodeMirror 6 'drawSelection' is mandatory for custom cursor shapes (Block, Underline).
 * 2. 'drawSelection' renders a full-width background box for the selection.
 * 3. Our user hates full-width selection on headers and wants "Text Only" selection.
 * 4. Simply hiding CM's selection layer and forcing native '::selection' fails because
 *    'drawSelection' suppresses native selection visibility (making it transparent).
 *
 * THE SOLUTION:
 * We create this custom Decoration-based plugin. It listens to selection changes
 * and manually applies a Decoration.mark (an inline <span>-like wrapper) to the
 * exactly selected text range.
 *
 * This gives us pixel-perfect, text-only highlight control without relying on
 * the unstable native ::selection or the blocky CM selection background.
 */

// Define the marker class that will be styled in CodeEditor.css
const selectionMark = Decoration.mark({ class: 'cm-force-selection' })

const forceSelectionPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      // Initialize decorations on load
      this.decorations = this.getDecorations(view)
    }

    update(update) {
      // Re-calculate decorations whenever the document, selection, or viewport changes
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view)
      }
    }

    getDecorations(view) {
      const builder = new RangeSetBuilder()

      // Iterate through all selection ranges (supports multiple selections)
      // and add our 'cm-force-selection' decoration to each non-empty range.
      const ranges = view.state.selection.ranges.slice().sort((a, b) => a.from - b.from)

      for (const { from, to } of ranges) {
        if (from !== to) {
          builder.add(from, to, selectionMark)
        }
      }
      return builder.finish()
    }
  },
  {
    // Register the decorations for the EditorView to render
    decorations: (v) => v.decorations
  }
)

/**
 * Export the extension to be used in buildExtensions.js
 */
export function forceSelection() {
  return forceSelectionPlugin
}
