import React, { useEffect, useState, useRef, useCallback,cursorColor  } from 'react'
import { getLanguage } from '../language/languageRegistry.js'
import { useZoomLevel, MIN_ZOOM, MAX_ZOOM } from '../../hook/useZoomLevel'
import settingsManager from '../../config/settingsManager'
import useCursorWidth from '../../hook/useCursorWidth.js'

// Helper to debounce save operations
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const CodeEditor = ({
  value,
  onChange,
  onKeyDown,
  height = '100%',
  className = 'h-full',
  style = { backgroundColor: 'var(--editor-bg, var(--color-bg-primary))' },
  language = 'markdown',
  textareaRef,
  onZoomChange,
  wordWrap = 'on'
}) => {
  const [CodeMirrorComponent, setCodeMirrorComponent] = useState(null)
  const [cmExtensions, setCmExtensions] = useState(null)

  const [storedZoomLevel, setStoredZoomLevel] = useZoomLevel()
  const editorDomRef = useRef(null) // 1. Caret settings applied here
  const [cursorWidth] = useCursorWidth()
  // Load caret/cursor settings from settingsManager, fallback to defaultSettings.js
  const cursorColor = settingsManager.get('editor.cursorColor')
  // 1. Ref to hold the actual CodeMirror View instance
  const viewRef = useRef(null)

  // IMMEDIATE SOURCE OF TRUTH
  const liveZoomRef = useRef(storedZoomLevel)

  // Debounced saver
  const debouncedSaveZoom = useCallback(
    debounce((newLevel) => {
      setStoredZoomLevel(newLevel)
      if (onZoomChange) onZoomChange(newLevel)
    }, 500),
    [setStoredZoomLevel, onZoomChange]
  )
  useEffect(() => {
    if (!editorDomRef.current) return

    editorDomRef.current.style.setProperty('--caret-width', `${cursorWidth}px`)
    editorDomRef.current.style.setProperty('--caret-color', cursorColor)
  }, [cursorWidth, cursorColor])

  // Sync ref if settings change externally
  useEffect(() => {
    liveZoomRef.current = storedZoomLevel
    applyZoomToDOM(storedZoomLevel)
  }, [storedZoomLevel])

  // Function to apply zoom directly to DOM
  const applyZoomToDOM = (level) => {
    // 2. Use viewRef to target specific editor, preventing global querySelector issues
    const view = viewRef.current
    if (!view) return
    // Set variables on document root so both JS-created and CSS rules pick them up
    document.documentElement.style.setProperty('--zoom-level', String(level))
    document.documentElement.style.setProperty('--content-zoom', String(level))

    // Adjust gutter width dynamically while keeping it responsive
    const editorElement = view.dom
    const gutterElement = editorElement.querySelector('.cm-gutters')
    if (gutterElement) {
      const minGutterWidth = level < 0.7 ? '50px' : '40px'
      gutterElement.style.minWidth = minGutterWidth
      gutterElement.style.height = '100%'
    }

    // Force CodeMirror to recompute layout and wrapping
    view.requestMeasure()
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [{ default: CM }, viewModule, keymapModule] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/view'),
          import('@codemirror/view')
        ])
        if (!mounted) return
        setCodeMirrorComponent(() => CM)

        const { EditorView, keymap } = viewModule

        const buildExtensions = async () => {
          const isDark =
            document.documentElement.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark'

          // THEME DEFINITION
          const themeExt = EditorView.theme(
            {
              '&': {
                // Use the app-level editor background so CodeMirror matches the UI theme
                backgroundColor: 'var(--editor-bg, var(--color-bg-primary)) !important',
                color: 'var(--color-text-primary, #0f172a)',
                fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
                // font-size is applied to the content element using --content-zoom
                lineHeight: '1.6',
                height: '100vh',
                transition: 'background-color 140ms ease, color 140ms ease'
              },
              // The scroller holds the visible background and should inherit the editor bg
              '.cm-scroller': {
                backgroundColor: 'var(--editor-bg, transparent) !important',
                fontFamily: 'inherit',
                overflowX: 'hidden'
              },
              '.cm-content': {
                backgroundColor: 'transparent',
                fontFamily: 'inherit',
                padding: '12px',
                fontSize: 'calc(var(--editor-font-size, 14px) * var(--content-zoom, 1))'
              },
              '.cm-gutters': {
                fontSize: 'calc(var(--editor-font-size, 14px) * var(--content-zoom, 1))',
                backgroundColor: 'var(--editor-gutter-bg, var(--color-bg-secondary)) !important',
                color: 'var(--color-text-secondary, #64748b)',
                borderRight: '1px solid var(--color-border, #e2e8f0)',
                fontFamily: 'inherit',
                minWidth: '40px',
                lineHeight: '1.6'
              },
              '.cm-activeLine': {
                backgroundColor: 'var(--color-bg-tertiary, rgba(248, 250, 252, 0.8))'
              }
            },
            { dark: isDark }
          )

          const exts = [themeExt]

          const isWordWrap = settingsManager.get('editor.wordWrap') === 'on' || wordWrap === 'on'
          if (isWordWrap) {
            exts.push(EditorView.lineWrapping)
            try {
              // Load and add visual-line numbering gutter (counts wrapped visual lines)
              const mod = await import('./useVisualLineNumberMarker.js')
              if (mod && mod.useVisualLineNumberMarker) {
                const vs = mod.useVisualLineNumberMarker(viewModule)
                if (vs && vs.length) exts.push(...vs)
              }
            } catch (e) {
              // Non-fatal: keep editor working without visual-line gutter
              console.error('Failed to load visual-line gutter', e)
            }
          } else {
            // Fallback: always show default line numbers if not using visual-line gutter
            try {
              const { lineNumbers } = await import('@codemirror/view')
              exts.push(lineNumbers())
            } catch (e) {
              console.error('Failed to load default line numbers', e)
            }
          }

          // KEYBOARD SHORTCUTS
          const zoomHandler = (change) => {
            const current = liveZoomRef.current
            const newZoom = Math.min(Math.max(current + change, MIN_ZOOM), MAX_ZOOM)

            liveZoomRef.current = newZoom
            applyZoomToDOM(newZoom)
            debouncedSaveZoom(newZoom)
            return true
          }

          const zoomKeymap = keymap.of([
            { key: 'Ctrl-=', run: () => zoomHandler(0.1) },
            { key: 'Ctrl-Minus', run: () => zoomHandler(-0.1) },
            {
              key: 'Ctrl-0',
              run: () => {
                liveZoomRef.current = 1.0
                applyZoomToDOM(1.0)
                debouncedSaveZoom(1.0)
                return true
              }
            },
            { key: 'Cmd-=', run: () => zoomHandler(0.1) },
            { key: 'Cmd-Minus', run: () => zoomHandler(-0.1) },
            {
              key: 'Cmd-0',
              run: () => {
                liveZoomRef.current = 1.0
                applyZoomToDOM(1.0)
                debouncedSaveZoom(1.0)
                return true
              }
            }
          ])
          exts.push(zoomKeymap)

          // MOUSE WHEEL HANDLER
          const mouseWheelZoomExtension = EditorView.domEventHandlers({
            wheel: (event, view) => {
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault()

                const sensitivity = 0.001
                const deltaY = event.deltaY
                const step = event.deltaY < 0 ? 0.1 : -0.1

                let newZoom = liveZoomRef.current + step
                newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

                if (Math.abs(newZoom - liveZoomRef.current) < 0.001) return true

                liveZoomRef.current = newZoom
                applyZoomToDOM(newZoom)
                debouncedSaveZoom(newZoom)

                return true
              }
              return false
            }
          })
          exts.push(mouseWheelZoomExtension)

          try {
            const langDef = getLanguage(language)
            if (langDef && langDef.import) {
              const langExt = await langDef.import()
              if (langExt) exts.push(langExt)
            }
          } catch (err) {}

          return exts
        }

        buildExtensions().then((exts) => {
          if (mounted) setCmExtensions(exts)
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [language, wordWrap])

  if (CodeMirrorComponent && cmExtensions) {
    const CM = CodeMirrorComponent
    return (
      <div
        className="cm-editor-wrapper"
        style={{
          '--caret-width': `${cursorWidth}px`,
          '--caret-color': cursorColor
        }}
      >
        <CM
          value={value || ''}
          onChange={onChange}
          extensions={cmExtensions}
          className={`${className} h-full`}
          onCreateEditor={(view) => {
            // 5. Capture the view instance
            viewRef.current = view
            applyZoomToDOM(liveZoomRef.current)
          }}
        />
      </div>
    )
  }

  return <textarea />
}

export default CodeEditor
