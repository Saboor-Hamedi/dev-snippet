import buildTheme from './buildTheme'

const buildExtensions = async (options, handlers = {}) => {
  const {
    EditorView,
    isDark = false,
    caretColor = '#0f172a',
    fontSize = '14px',
    wordWrap = 'on'
    // language prop ignored/removed
  } = options
  const { liveZoomRef, applyZoomToDOM, debouncedSaveZoom, setStoredZoomLevel } = handlers

  const exts = []

  // THEME
  exts.push(buildTheme(EditorView, { isDark, caretColor, fontSize }))

  // CORE UI EXTENSIONS (Critical for stability)
  try {
    const { drawSelection, dropCursor, highlightActiveLine } = await import('@codemirror/view')
    // Uses custom drawn selection (better for mixed font sizes/rich text)
    exts.push(drawSelection())
    exts.push(dropCursor())
    // highlightActiveLine helps visual context
    exts.push(highlightActiveLine())
  } catch (e) {}

  // HISTORY (Undo/Redo)
  try {
    const { history } = await import('@codemirror/commands')
    exts.push(history())
  } catch (e) {}

  // BRACKET MATCHING
  try {
    const { bracketMatching } = await import('@codemirror/language')
    exts.push(bracketMatching())
  } catch (e) {}

  // SMOOTH ZOOM LOGIC
  if (liveZoomRef && applyZoomToDOM) {
    const { keymap } = await import('@codemirror/view')
    const { MIN_ZOOM, MAX_ZOOM } = await import('../../../hook/useZoomLevel.js')

    // Use an animation frame ID to prevent stacking updates
    let rafId = null

    const safeApplyZoom = (newZoom) => {
      // Clamp values
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

      // Update Ref immediately for logic
      liveZoomRef.current = newZoom

      // Update DOM in the next animation frame for smoothness
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        applyZoomToDOM(newZoom)
      })

      // Debounce the storage save
      if (debouncedSaveZoom) debouncedSaveZoom(newZoom)
      if (setStoredZoomLevel) setStoredZoomLevel(newZoom)
    }

    const zoomHandler = (change) => {
      safeApplyZoom(liveZoomRef.current + change)
      return true
    }

    const resetZoom = () => {
      safeApplyZoom(1.0)
      return true
    }

    // Keymap (Ctrl + / -) - Keep these stepping at 0.1 for precision
    const zoomKeymap = keymap.of([
      { key: 'Ctrl-=', run: () => zoomHandler(0.1) },
      { key: 'Ctrl-Minus', run: () => zoomHandler(-0.1) },
      { key: 'Ctrl-0', run: resetZoom },
      { key: 'Cmd-=', run: () => zoomHandler(0.1) },
      { key: 'Cmd-Minus', run: () => zoomHandler(-0.1) },
      { key: 'Cmd-0', run: resetZoom }
    ])
    exts.push(zoomKeymap)

    // Wheel Handler - Variable speed for smoothness
    exts.push(
      EditorView.domEventHandlers({
        wheel: (event, view) => {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()

            // Calculate smooth delta based on wheel hardware
            // Usually deltaY is +/- 100, so we scale it down drastically
            const sensitivity = 0.0015
            const delta = -event.deltaY * sensitivity

            const current = liveZoomRef.current
            const newZoom = current + delta

            safeApplyZoom(newZoom)
            return true
          }
          return false
        }
      })
    )
  }

  // Line numbers
  try {
    const { lineNumbers } = await import('@codemirror/view')
    exts.push(
      lineNumbers({
        formatNumber: (lineNo) => lineNo.toString(),
        domEventHandlers: {
          mousedown: (view, line, event) => false
        }
      })
    )
  } catch (e) {}

  if (wordWrap === 'on') {
    exts.push(EditorView.lineWrapping)
  }

  // Always load Markdown Support
  try {
    // 1. Load Custom Syntax Highlighting (Colors only, no strange fonts/sizes)
    const { richMarkdownExtension } = await import('./richMarkdown.js')
    exts.push(richMarkdownExtension)

    // 2. Official Markdown Extension (with disabled keymap to prevent jumps)
    const { markdown } = await import('@codemirror/lang-markdown')
    exts.push(markdown({ addKeymap: false }))
  } catch (e) {
    console.error('Failed to load markdown extensions', e)
  }

  return exts
}

export default buildExtensions
