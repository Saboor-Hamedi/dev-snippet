import { ViewPlugin, EditorView } from '@codemirror/view'
import { EditorMode, editorModeField, setEditorMode } from './state'

export const readingModeLayoutPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.lastLine = 1
      this.lastOffset = null

      this.listener = (e) => {
        if (e.detail?.mode) {
          // CAPTURE ANCHOR IMMEDIATELY: This is the most efficient point.
          // It only happens once per mode switch, leaving scrolling at 60fps.
          this.captureAnchor(view)
          view.dispatch({ effects: setEditorMode.of(e.detail.mode) })
        }
      }
      window.addEventListener('app:set-editor-mode', this.listener)

      const mode = view.state.field(editorModeField)
      this.syncClasses(view, mode)
      window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
    }

    captureAnchor(view) {
      try {
        const head = view.state.selection.main.head
        const coords = view.coordsAtPos(head)
        const scrollerRect = view.scrollDOM.getBoundingClientRect()
        if (coords && scrollerRect) {
          this.lastOffset = coords.top - scrollerRect.top + view.scrollDOM.scrollTop
          this.lastLine = view.state.doc.lineAt(head).number
        }
      } catch (e) {
        // Fail silently
      }
    }

    syncClasses(view, mode) {
      view.dom.classList.toggle('cm-reading-mode', mode === EditorMode.READING)
      view.dom.classList.toggle('cm-live-preview-mode', mode === EditorMode.LIVE_PREVIEW)
      view.dom.classList.toggle('cm-source-mode', mode === EditorMode.SOURCE)
    }

    update(update) {
      const modeChanged =
        update.startState.field(editorModeField) !== update.state.field(editorModeField)

      if (modeChanged) {
        const mode = update.state.field(editorModeField)
        this.syncClasses(update.view, mode)
        window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))

        // --- STABILIZATION ENGINE (MODE SWITCH ONLY) ---
        const savedOffset = this.lastOffset
        const savedLine = this.lastLine

        update.view.requestMeasure({
          read: (v) => {
            try {
              const head = v.state.selection.main.head
              const line = v.state.doc.lineAt(head).number
              const coords = v.coordsAtPos(head)
              if (!coords || line !== savedLine || savedOffset === null) return null

              const scrollerRect = v.scrollDOM.getBoundingClientRect()
              
              // Use fluids (no Math.round) for High-DPI smoothness
              const currentDocOffset = coords.top - scrollerRect.top + v.scrollDOM.scrollTop
              let diff = currentDocOffset - savedOffset

              const isAtBottom = v.scrollDOM.scrollTop + v.scrollDOM.clientHeight >= v.scrollDOM.scrollHeight - 2
              if (isAtBottom && diff > 0) return null
              
              // Only stabilize if jump is meaningful (> 2px) to avoid micro-jitter
              if (Math.abs(diff) < 2) return null 
              if (Math.abs(diff) > 800) return null

              return { diff }
            } catch (e) {
              return null
            }
          },
          write: (res, v) => {
            if (res && Math.abs(res.diff) > 0.5) {
              requestAnimationFrame(() => {
                if (v.scrollDOM) v.scrollDOM.scrollTop += res.diff
              })
            }
          }
        })
      }
    }

    destroy() {
      window.removeEventListener('app:set-editor-mode', this.listener)
    }
  }
)
