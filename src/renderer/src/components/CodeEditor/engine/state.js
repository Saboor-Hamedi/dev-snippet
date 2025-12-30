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
