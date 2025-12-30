import { ViewPlugin, EditorView } from '@codemirror/view'
import { EditorMode, editorModeField, setEditorMode } from './state'

export const readingModeLayoutPlugin = ViewPlugin.fromClass(
  class {
    update(update) {
      if (update.startState.field(editorModeField) !== update.state.field(editorModeField)) {
        const mode = update.state.field(editorModeField)
        update.view.dom.classList.toggle('cm-reading-mode', mode === EditorMode.READING)
        update.view.dom.classList.toggle('cm-live-preview-mode', mode === EditorMode.LIVE_PREVIEW)
        update.view.dom.classList.toggle('cm-source-mode', mode === EditorMode.SOURCE)

        window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
      }
    }
    constructor(view) {
      this.listener = (e) => {
        if (e.detail?.mode) {
          view.dispatch({ effects: setEditorMode.of(e.detail.mode) })
        }
      }
      window.addEventListener('app:set-editor-mode', this.listener)
      const mode = view.state.field(editorModeField)
      // Initial classes
      view.dom.classList.toggle('cm-reading-mode', mode === EditorMode.READING)
      view.dom.classList.toggle('cm-live-preview-mode', mode === EditorMode.LIVE_PREVIEW)
      view.dom.classList.toggle('cm-source-mode', mode === EditorMode.SOURCE)

      window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
    }
    destroy() {
      window.removeEventListener('app:set-editor-mode', this.listener)
    }
  }
)
