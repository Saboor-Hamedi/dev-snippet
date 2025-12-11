import useCaretProp from '../../hook/useCaretProp.js'
import useGutterProp from '../../hook/useGutterProp.js'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useZoomLevel } from '../../hook/useZoomLevel'
import settingsManager from '../../config/settingsManager'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import buildTheme from './extensions/buildTheme'
import buildExtensions from './extensions/buildExtensions'

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
  height = '100%',
  className = 'h-full',
  // language prop removed/ignored
  onZoomChange,
  wordWrap = 'on'
}) => {
  const [storedZoomLevel, setStoredZoomLevel] = useZoomLevel()
  const editorDomRef = useRef(null)
  // This is the caret width and color
  const { width: caretWidth, color: caretColor } = useCaretProp()
  const { gutterBgColor, gutterBorderColor, gutterBorderWidth } = useGutterProp()
  const viewRef = useRef(null)
  const liveZoomRef = useRef(storedZoomLevel)

  // Determine dark mode
  const [isDark, setIsDark] = useState(false)

  // Gutter background color

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark'
      setIsDark(dark)
    }
  }, [])

  // Initial base extensions (Theme only) to prevent FOUC
  const baseExtensions = useMemo(() => {
    return [
      buildTheme(EditorView, {
        isDark,
        caretColor,
        fontSize: 'var(--editor-font-size, 14px)'
      })
    ]
  }, [isDark, caretColor])

  const [cmExtensions, setCmExtensions] = useState(baseExtensions)

  // Save zoom to storage with debounce
  const debouncedSaveZoom = useCallback(
    debounce((newLevel) => {
      if (onZoomChange) onZoomChange(newLevel)
      settingsManager.set('editor.zoomLevel', newLevel)
    }, 500),
    [onZoomChange]
  )

  // 1. Efficiently update DOM styles without triggering React re-renders
  const applyZoomToDOM = (level) => {
    const target =
      editorDomRef.current || (typeof document !== 'undefined' ? document.documentElement : null)
    if (target) {
      const zoomStr = level.toFixed(3)
      target.style.setProperty('--zoom-level', zoomStr)
      target.style.setProperty('--content-zoom', zoomStr)
    }
  }

  // Avoid calling `requestMeasure` during render — move to effect below

  // 2. Sync Ref and DOM when storedZoomLevel changes
  useEffect(() => {
    liveZoomRef.current = storedZoomLevel
    applyZoomToDOM(storedZoomLevel)
  }, [storedZoomLevel])

  // 3. Handle CSS Variables for Caret
  useEffect(() => {
    if (!editorDomRef.current) return
    editorDomRef.current.style.setProperty('--caret-width', `${caretWidth}px`)
    editorDomRef.current.style.setProperty('--caret-color', caretColor)
    editorDomRef.current.style.setProperty('--gutter-bg-color', gutterBgColor)
    editorDomRef.current.style.setProperty('--gutter-border-color', gutterBorderColor)
    editorDomRef.current.style.setProperty('--gutter-border-width', `${gutterBorderWidth}px`)
  }, [caretWidth, caretColor, gutterBgColor, gutterBorderColor, gutterBorderWidth])

  // adjustOverflow removed (legacy layout logic)

  // 4. Load Full Extensions
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const options = {
          EditorView,
          isDark:
            (typeof document !== 'undefined' &&
              (document.documentElement.classList.contains('dark') ||
                document.documentElement.getAttribute('data-theme') === 'dark')) ||
            false,
          caretColor,
          fontSize: 'var(--editor-font-size, 14px)',
          wordWrap,
          language: 'markdown' // Force markdown
        }

        const exts = await buildExtensions(options, {
          liveZoomRef,
          applyZoomToDOM,
          debouncedSaveZoom,
          setStoredZoomLevel
        })

        if (mounted) {
          setCmExtensions(exts)
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [wordWrap, caretWidth, caretColor, gutterBgColor])

  return (
    <div
      className="cm-editor-wrapper h-full"
      ref={editorDomRef}
      style={{
        '--caret-width': `${caretWidth}px`,
        '--caret-color': caretColor,
        '--gutter-bg-color': gutterBgColor,
        '--gutter-border-color': gutterBorderColor,
        '--gutter-border-width': gutterBorderWidth
      }}
    >
      <CodeMirror
        value={value || ''}
        onChange={onChange}
        extensions={cmExtensions}
        className={`${className} h-full`}
        onCreateEditor={(view) => {
          viewRef.current = view
          applyZoomToDOM(liveZoomRef.current)
          // adjustOverflow() removed
        }}
      />
    </div>
  )
}

export default CodeEditor
