import { StateField, StateEffect } from '@codemirror/state'

// --- Global Editor State: Triple Mode (Obsidian-Style) ---
export const EditorMode = {
  SOURCE: 'source',
  LIVE_PREVIEW: 'live_preview',
  READING: 'reading'
}

export const setEditorMode = StateEffect.define()

export const editorModeField = StateField.define({
  create() {
    return EditorMode.LIVE_PREVIEW
  },
  update(value, tr) {
    for (let e of tr.effects) if (e.is(setEditorMode)) return e.value
    return value
  }
})

/**
 * Tracks the current lines occupied by the selection/cursor.
 * Used for the "Reveal on Focus" logic to show Markdown source only on active lines.
 */
export const activeLinesField = StateField.define({
  create() {
    return new Set()
  },
  update(value, tr) {
    // If selection changed, recalculate active line numbers
    if (tr.selection || tr.docChanged) {
      const active = new Set()
      tr.state.selection.ranges.forEach((range) => {
        const fromLine = tr.state.doc.lineAt(range.from).number
        const toLine = tr.state.doc.lineAt(range.to).number
        for (let i = fromLine; i <= toLine; i++) {
          active.add(i)
        }
      })
      return active
    }
    return value
  }
})
