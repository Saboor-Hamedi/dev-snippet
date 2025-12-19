import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import useCaretProp from '../../hook/useCaretProp.js'
import useGutterProp from '../../hook/useGutterProp.js'
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
  wordWrap = 'on',
  onEditorReady, // NEW: callback to pass editor view to parent
  onLargeFileChange // NEW: callback when large file mode changes
}) => {
  // Zoom level is now managed globally by useZoomLevel at the root/SettingsProvider level.
  // Individual components consume the result via CSS variables.
  const editorDomRef = useRef(null)
  // This is the caret width and color
  const { width: caretWidth, color: caretColor } = useCaretProp()
  const { gutterBgColor, gutterBorderColor, gutterBorderWidth } = useGutterProp()
  const viewRef = useRef(null)

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
  const [isLargeFile, setIsLargeFile] = useState(false)
  const [extensionsLoaded, setExtensionsLoaded] = useState(false)

  // Save zoom to storage with debounce
  const debouncedSaveZoom = useCallback(
    debounce((newLevel) => {
      if (onZoomChange) onZoomChange(newLevel)
      settingsManager.set('editor.zoomLevel', newLevel)
    }, 500),
    [onZoomChange]
  )

  // Zoom application is now handled entirely by the useZoomLevel hook at the root level.
  // This prevents conflicts between parent and child zoom handlers.

  // Avoid calling `requestMeasure` during render — move to effect below

  // 2. Handle CSS Variables for Caret
  useEffect(() => {
    if (!editorDomRef.current) return
    editorDomRef.current.style.setProperty('--caret-width', `${caretWidth}px`)
    editorDomRef.current.style.setProperty('--caret-color', caretColor)
    editorDomRef.current.style.setProperty('--gutter-bg-color', gutterBgColor)
    editorDomRef.current.style.setProperty('--gutter-border-color', gutterBorderColor)
    editorDomRef.current.style.setProperty('--gutter-border-width', `${gutterBorderWidth}px`)
  }, [caretWidth, caretColor, gutterBgColor, gutterBorderColor, gutterBorderWidth])

  // adjustOverflow removed (legacy layout logic)

  // Detect large files
  useEffect(() => {
    const lineCount = (value || '').split('\n').length
    const charCount = (value || '').length
    const isLarge = lineCount > 10000 || charCount > 500000
    setIsLargeFile(isLarge)
    if (onLargeFileChange) onLargeFileChange(isLarge)
  }, [value, onLargeFileChange])

  // 4. Load Full Extensions (Lazy + Progressive)
  useEffect(() => {
    let mounted = true
    let timeoutId = null

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
          wordWrap: isLargeFile ? 'off' : wordWrap, // Disable wrapping for large files
          language: isLargeFile ? 'plaintext' : 'markdown', // Plain text for large files
          isLargeFile // Pass flag to buildExtensions
        }

        const exts = await buildExtensions(options, {
          debouncedSaveZoom
        })

        if (mounted) {
          setCmExtensions(exts)
          setExtensionsLoaded(true)
        }
      } catch (e) {
        console.error(e)
      }
    }

    // Lazy load: Start with base extensions, load full set after idle
    if (!extensionsLoaded) {
      timeoutId = setTimeout(load, 150)
    } else {
      // Already loaded, just update if dependencies change
      load()
    }

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [
    wordWrap,
    caretWidth,
    caretColor,
    gutterBgColor,
    debouncedSaveZoom,
    isLargeFile,
    extensionsLoaded
  ])

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
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        className={`${className} h-full`}
        onCreateEditor={(view) => {
          viewRef.current = view
          // Pass view to parent if callback provided
          if (onEditorReady) {
            onEditorReady(view)
          }
          // adjustOverflow() removed
        }}
      />
    </div>
  )
}

export default React.memo(CodeEditor)
