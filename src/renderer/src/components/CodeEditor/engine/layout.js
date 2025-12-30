import { ViewPlugin, EditorView } from '@codemirror/view'
import { EditorMode, editorModeField, setEditorMode } from './state'

export const readingModeLayoutPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.lastLine = 1
      this.lastOffset = null

      this.listener = (e) => {
        if (e.detail?.mode) {
          // If NOT currently updating, try to capture offset for mode switch
          if (!view.updating) {
            try {
              const head = view.state.selection.main.head
              const coords = view.coordsAtPos(head)
              const scrollerRect = view.scrollDOM.getBoundingClientRect()
              // Capture absolute document offset (viewport + scroll)
              this.lastOffset = coords
                ? coords.top - scrollerRect.top + view.scrollDOM.scrollTop
                : null
              this.lastLine = view.state.doc.lineAt(head).number
            } catch (err) {
              console.warn('[Layout] Failed to capture pre-mode-switch offset:', err)
            }
          }

          view.dispatch({ effects: setEditorMode.of(e.detail.mode) })
        }
      }
      window.addEventListener('app:set-editor-mode', this.listener)

      const mode = view.state.field(editorModeField)
      this.syncClasses(view, mode)
      window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
    }

    syncClasses(view, mode) {
      view.dom.classList.toggle('cm-reading-mode', mode === EditorMode.READING)
      view.dom.classList.toggle('cm-live-preview-mode', mode === EditorMode.LIVE_PREVIEW)
      view.dom.classList.toggle('cm-source-mode', mode === EditorMode.SOURCE)
    }

    update(update) {
      const modeChanged =
        update.startState.field(editorModeField) !== update.state.field(editorModeField)
      const selectionChanged = update.selectionSet
      const docChanged = update.docChanged

      if (modeChanged) {
        const mode = update.state.field(editorModeField)
        this.syncClasses(update.view, mode)
        window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
      }

      // --- STABILIZATION ENGINE ---
      const savedOffset = this.lastOffset
      const savedLine = this.lastLine

      update.view.requestMeasure({
        read: (v) => {
          try {
            const head = v.state.selection.main.head
            const line = v.state.doc.lineAt(head).number
            const coords = v.coordsAtPos(head)
            if (!coords) return null

            const scrollerRect = v.scrollDOM.getBoundingClientRect()
            // ALWAYS use absolute document offset for stability
            const currentDocOffset = coords.top - scrollerRect.top + v.scrollDOM.scrollTop

            let diff = 0
            // ONLY apply correction if the layout shifted (mode or doc change)
            // and we are still on the same line.
            if ((modeChanged || docChanged) && line === savedLine && savedOffset !== null) {
              diff = currentDocOffset - savedOffset
            }

            return {
              line,
              docOffset: currentDocOffset,
              diff,
              shouldApply: (modeChanged || docChanged) && !update.view.composing
            }
          } catch (e) {
            return null
          }
        },
        write: (res, v) => {
          if (!res) return

          // 1. Apply Correction
          // We only apply if the mode or document changed.
          // If the user is just moving the selection, we DON'T stabilize.
          if (res.shouldApply && Math.abs(res.diff) > 1) {
            v.scrollDOM.scrollTop += res.diff
          }

          // 2. Continuous Tracking
          // Update the anchor after EVERY frame to ensure the next delta is relative
          // to the current cursor position.
          this.lastLine = res.line
          this.lastOffset = res.docOffset
        }
      })
    }

    destroy() {
      window.removeEventListener('app:set-editor-mode', this.listener)
    }
  }
)
