import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import useCursorProp from '../../hook/settings/useCursorProp.js'
import useGutterProp from '../../hook/settings/useGutterProp.js'
import settingsManager from '../../config/settingsManager'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import buildTheme from './extensions/buildTheme'
import buildExtensions from './extensions/buildExtensions'
import ErrorBoundary from '../ErrorBoundary'

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
  onZoomChange,
  wordWrap = 'on',
  onEditorReady,
  onLargeFileChange,
  readOnly = false,
  snippets = []
}) => {
  // Zoom level is now managed globally by useZoomLevel at the root/SettingsProvider level.
  // Individual components consume the result via CSS variables.
  const editorDomRef = useRef(null)
  const snippetTitles = useMemo(() => {
    return snippets.map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  // CONSUME SETTINGS VIA REFACTOR HOOKS (SOLID)
  const {
    cursorWidth,
    cursorColor,
    cursorShape,
    cursorBlinking,
    cursorBlinkingSpeed,
    cursorSelectionBg,
    cursorActiveLineBorder,
    cursorActiveLineGutterBorder,
    cursorActiveLineBg,
    cursorShadowBoxColor
  } = useCursorProp()
  const { gutterBgColor, gutterBorderColor, gutterBorderWidth } = useGutterProp()
  const viewRef = useRef(null)

  // Determine dark mode
  const [isDark, setIsDark] = useState(false)

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
        caretColor: cursorColor,
        fontSize: 'var(--editor-font-size, 14px)'
      })
    ]
  }, [isDark, cursorColor])

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

  // 3. Dynamic Editor Attributes (Source of Truth)
  const attributesExtension = useMemo(() => {
    return EditorView.editorAttributes.of({
      class: 'premium-editor-engine'
    })
  }, [])

  // Merge extensions
  const allExtensions = useMemo(
    () => [
      ...cmExtensions,
      attributesExtension
      /*
      // DEBUG: Log doc state to help diagnose "No tile at position" errors
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet) {
          console.log(
            'DEBUG: doc length',
            update.state.doc.length,
            'selection head',
            update.state.selection.main.head
          )
        }
      })
      */
    ],
    [cmExtensions, attributesExtension]
  )

  // Detect large files (Optimized for zero typing lag)
  const lastLargeState = useRef(false)
  useEffect(() => {
    // Only check if content is actually semi-large (over 100k chars)
    // Small files should never trigger this logic
    if ((value || '').length < 100000) {
      if (lastLargeState.current) {
        lastLargeState.current = false
        setIsLargeFile(false)
        if (onLargeFileChange) onLargeFileChange(false)
      }
      return
    }

    const handler = setTimeout(() => {
      const charCount = (value || '').length
      const lineCount = value.split('\n').length
      const isLarge = lineCount > 10000 || charCount > 500000

      if (isLarge !== lastLargeState.current) {
        lastLargeState.current = isLarge
        setIsLargeFile(isLarge)
        if (onLargeFileChange) onLargeFileChange(isLarge)
      }
    }, 2000)

    return () => clearTimeout(handler)
  }, [value, onLargeFileChange])

  /**
   * 🚀 THE PERFORMANCE ENGINE (The "Extension Freezing" Logic)
   */
  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const loadFullEditorEngine = async () => {
      try {
        // Build the configuration object
        const isBlinking = Boolean(cursorBlinking) // Explicit cast
        const options = {
          EditorView,
          isDark:
            (typeof document !== 'undefined' &&
              (document.documentElement.classList.contains('dark') ||
                document.documentElement.getAttribute('data-theme') === 'dark')) ||
            false,
          caretColor: cursorColor,
          cursorWidth,
          cursorShape,
          fontSize: 'var(--editor-font-size, 14px)',
          cursorBlinking: isBlinking,
          cursorBlinkingSpeed,
          wordWrap: isLargeFile ? 'off' : wordWrap,
          language: isLargeFile ? 'plaintext' : 'markdown',
          isLargeFile,
          snippetTitles
        }

        const exts = await buildExtensions(options, {
          debouncedSaveZoom
        })

        if (mounted) {
          setCmExtensions(exts)
          setExtensionsLoaded(true)
        }
      } catch (err) {
        console.error('❌ Failed to load editor engine:', err)
      }
    }

    // Immediate load if already loaded once or simple update
    // Only delay on very first mount if strictly necessary, but 150ms is too long for perceived lag
    if (!extensionsLoaded) {
      // Delay to ensure parent layout (SplitPane) is stable before heavy measurement
      // 50ms is imperceptible to users but allows the UI frame to settle.
      timeoutId = setTimeout(() => {
        window.requestAnimationFrame(loadFullEditorEngine)
      }, 50)
    } else {
      loadFullEditorEngine()
    }

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [
    wordWrap,
    cursorWidth,
    cursorShape,
    cursorColor,
    cursorBlinking,
    cursorBlinkingSpeed,
    isLargeFile,
    extensionsLoaded,
    snippetTitles
    // Removed cursorActiveLineBg etc from dep array as buildExtensions might not use them all effectively needing re-run
    // But kept critical ones.
  ])

  return (
    <div
      className="cm-editor-container h-full relative"
      data-cursor-blinking={cursorBlinking.toString()}
      data-caret-shape={cursorShape}
      style={{
        '--caret-width': `${cursorWidth}px`,
        '--caret-color': cursorColor,
        '--cursor-blinking-speed': `${cursorBlinkingSpeed}ms`,
        '--selection-background': cursorSelectionBg,
        '--active-line-border-width': `${cursorActiveLineBorder}px`,
        '--active-line-gutter-border-width': `${cursorActiveLineGutterBorder}px`,
        '--active-line-bg': cursorActiveLineBg,
        '--shadow-box-bg': cursorShadowBoxColor,
        '--gutter-bg-color': gutterBgColor,
        '--gutter-border-color': gutterBorderColor,
        '--gutter-border-width': `${gutterBorderWidth}px`
      }}
      ref={editorDomRef}
    >
      <CodeMirror
        value={value || ''}
        onChange={onChange}
        readOnly={readOnly}
        extensions={allExtensions}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        className={`${className} h-full`}
        onCreateEditor={(view) => {
          viewRef.current = view
          // Pass view to parent if callback provided
          if (onEditorReady) {
            onEditorReady(view)
          }
        }}
        editable={!readOnly}
      />
    </div>
  )
}

const MemoizedEditor = React.memo(CodeEditor)

const CodeEditorWithBoundary = (props) => (
  <ErrorBoundary>
    <MemoizedEditor {...props} />
  </ErrorBoundary>
)

export default CodeEditorWithBoundary
