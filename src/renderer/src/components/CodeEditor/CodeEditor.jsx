import React, { useEffect, useState, useRef, useCallback } from 'react'
import { getLanguage } from '../language/languageRegistry.js'
import { useZoomLevel, MIN_ZOOM, MAX_ZOOM } from '../../hook/useZoomLevel'
import settingsManager from '../../config/settingsManager'

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
  style = { backgroundColor: 'transparent' },
  language = 'markdown',
  textareaRef,
  onZoomChange,
  wordWrap = 'on'
}) => {
  const [CodeMirrorComponent, setCodeMirrorComponent] = useState(null)
  const [cmExtensions, setCmExtensions] = useState(null)

  const [storedZoomLevel, setStoredZoomLevel] = useZoomLevel()

  // IMMEDIATE SOURCE OF TRUTH
  // We initialize this with the stored value, but update it synchronously on scroll
  const liveZoomRef = useRef(storedZoomLevel)

  // Debounced saver: only triggers setting update 500ms after zooming stops
  const debouncedSaveZoom = useCallback(
    debounce((newLevel) => {
      setStoredZoomLevel(newLevel)
      if (onZoomChange) onZoomChange(newLevel)
    }, 500),
    [setStoredZoomLevel, onZoomChange]
  )

  // Sync ref if settings change externally (e.g. from another window or reset)
  useEffect(() => {
    liveZoomRef.current = storedZoomLevel
    applyZoomToDOM(storedZoomLevel)
  }, [storedZoomLevel])

  // Function to apply zoom directly to DOM (Bypasses React Render Cycle for speed)
  const applyZoomToDOM = (level) => {
    const editorElement = document.querySelector('.cm-editor')
    if (!editorElement) return

    // We use a CSS variable for the scale/multiplier
    // This is much faster than setting fontSize on multiple elements
    editorElement.style.setProperty('--zoom-level', level)

    // Optional: Adjust gutter width dynamically if needed
    const gutterElement = editorElement.querySelector('.cm-gutters')
    if (gutterElement) {
      const minGutterWidth = level < 0.7 ? '50px' : '40px'
      gutterElement.style.minWidth = minGutterWidth
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [{ default: CM }, viewModule, keymapModule] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/view'),
          import('@codemirror/view') // Import keymap from view or separate package depending on version
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
                backgroundColor: 'var(--color-bg-primary, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
                // MAGIC HERE: Calculate size using the CSS Variable we update manually
                fontSize: 'calc(var(--editor-font-size, 14px) * var(--zoom-level, 1))',
                height: '100%',
                transition: 'none' // Disable generic transitions to prevent lag during wheel
              },
              '.cm-scroller': { fontFamily: 'inherit', overflowX: 'hidden' },
              '.cm-content': { fontFamily: 'inherit', padding: '12px' },
              '.cm-gutters': {
                backgroundColor: 'var(--color-bg-secondary, #64748b)',
                color: 'var(--color-text-secondary, #64748b)',
                borderRight: '1px solid var(--color-border, #e2e8f0)',
                fontFamily: 'inherit',
                minWidth: '40px' // Base width, adjusted in applyZoomToDOM
              },
              // ... keep your other theme settings ...
              '.cm-activeLine': {
                backgroundColor: 'var(--color-bg-tertiary, rgba(248, 250, 252, 0.8))'
              }
            },
            { dark: isDark }
          )

          const exts = [themeExt]

          if (settingsManager.get('editor.wordWrap') === 'on' || wordWrap === 'on') {
            exts.push(EditorView.lineWrapping)
          }

          // KEYBOARD SHORTCUTS
          const zoomHandler = (change) => {
            const current = liveZoomRef.current
            const newZoom = Math.min(Math.max(current + change, MIN_ZOOM), MAX_ZOOM)

            // 1. Update Ref immediately
            liveZoomRef.current = newZoom
            // 2. Update Visuals immediately
            applyZoomToDOM(newZoom)
            // 3. Save to settings (debounced)
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

                // Calculate Delta
                // Normalize delta to avoid super fast scrolling on trackpads
                const sensitivity = 0.001
                // Clamp delta to standard "ticks" if it's a mouse wheel, or use raw for trackpad
                const deltaY = event.deltaY
                const zoomChange = -deltaY * sensitivity * 2

                // Use a smaller step for smoother trackpad, larger for ratchet wheel
                // Or stick to your step logic, but applied to the REF:
                const step = event.deltaY < 0 ? 0.1 : -0.1

                // Determine new value based on LIVE REF (not stale state)
                let newZoom = liveZoomRef.current + step

                // Clamp
                newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

                // Prevent useless updates
                if (Math.abs(newZoom - liveZoomRef.current) < 0.001) return true

                // 1. Update Ref Immediately
                liveZoomRef.current = newZoom

                // 2. Update DOM Immediately (CSS Variable)
                // This happens synchronously before the next paint
                applyZoomToDOM(newZoom)

                // 3. Persist Later
                debouncedSaveZoom(newZoom)

                return true
              }
              return false
            }
          })
          exts.push(mouseWheelZoomExtension)

          // Load Language
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

        // ... mutation observer logic ...
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [language, wordWrap]) // removed debouncedSaveZoom to avoid rebuilds

  if (CodeMirrorComponent && cmExtensions) {
    const CM = CodeMirrorComponent
    return (
      <CM
        // ... props ...
        value={value || ''}
        onChange={onChange}
        extensions={cmExtensions}
        className={`${className} h-full`}
        onCreateEditor={(view) => {
          // Apply initial zoom when editor is created
          applyZoomToDOM(liveZoomRef.current)
        }}
        // ...
      />
    )
  }

  // Textarea fallback...
  return <textarea />
}

export default CodeEditor
