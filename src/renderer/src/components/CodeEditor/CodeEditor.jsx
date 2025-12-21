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
  // language prop removed/ignored
  onZoomChange,
  wordWrap = 'on',
  onEditorReady, // NEW: callback to pass editor view to parent
  onLargeFileChange // NEW: callback when large file mode changes
}) => {
  // Zoom level is now managed globally by useZoomLevel at the root/SettingsProvider level.
  // Individual components consume the result via CSS variables.
  const editorDomRef = useRef(null)

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

  // Zoom application is now handled entirely by the useZoomLevel hook at the root level.
  // This prevents conflicts between parent and child zoom handlers.

  // Avoid calling `requestMeasure` during render — move to effect below

  // 3. Dynamic Editor Attributes (Source of Truth)
  const attributesExtension = useMemo(() => {
    return EditorView.editorAttributes.of({
      class: 'premium-editor-engine'
    })
  }, [])

  // Merge extensions
  const allExtensions = useMemo(
    () => [...cmExtensions, attributesExtension],
    [cmExtensions, attributesExtension]
  )

  // adjustOverflow removed (legacy layout logic)

  // Detect large files (Optimized for zero typing lag)
  const lastLargeState = useRef(false)
  useEffect(() => {
    // Only check if content is actually semi-large (over 100k chars)
    // Small files should never trigger this logic
    if ((value || '').length < 100000) {
      if (lastLargeState.current) {
        lastLargeState.current = false
        setIsLargeFile(false)
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
      }
    }, 2000)

    return () => clearTimeout(handler)
  }, [value, onLargeFileChange])

  /**
   * 🚀 THE PERFORMANCE ENGINE (The "Extension Freezing" Logic)
   *
   * In standard React-CodeMirror, changing any prop usually causes the editor to
   * "re-evaluate" its entire brain. For 60fps typing, we can't let that happen.
   *
   * This Effect only fires when 'Critical' settings change (like wordWrap or DarkMode).
   * It skips running during normal typing or local state changes.
   */
  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const loadFullEditorEngine = async () => {
      console.log('🔄 Reloading Editor Engine. Blinking:', cursorBlinking)
      try {
        // Build the configuration object - Only shared once per 'Hard Refresh'
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
          isLargeFile
        }

        // Call our specialized extension builder
        const exts = await buildExtensions(options, {
          debouncedSaveZoom
        })

        if (mounted) {
          setCmExtensions(exts)
          setExtensionsLoaded(true)
          console.log('💎 Editor engine synchronized with new settings.')
        }
      } catch (err) {
        console.error('❌ Failed to load editor engine:', err)
      }
    }

    /**
     * PROGRESSIVE LOADING:
     * We start with basic text rendering first, then "Lazy Load" the heavy
     * Markdown parser and Premium features 150ms later. This keeps the initial
     * app launch feel instant!
     */
    if (!extensionsLoaded) {
      timeoutId = setTimeout(loadFullEditorEngine, 150)
    } else {
      loadFullEditorEngine()
    }

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [
    // WE STRATEGICALLY REMOVE 'value' FROM HERE!
    // This is how we achieve the VS Code feel. Re-building the engine
    // on every keystroke (value change) is what causes the lag.
    wordWrap,
    cursorWidth,
    cursorShape, // RE-ADD: Essential for theme rebuilds
    cursorActiveLineBg,
    cursorShadowBoxColor,
    cursorColor,
    // 🚀 CRITICAL: We include blinking settings here to ensure the
    // internal CM blink rate is reset to 0 when toggled.
    cursorBlinking,
    cursorBlinkingSpeed,
    gutterBgColor,
    debouncedSaveZoom,
    isLargeFile,
    extensionsLoaded
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
        key={`cm-${cursorBlinking}-${cursorBlinkingSpeed}`}
        value={value || ''}
        onChange={onChange}
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
          // adjustOverflow() removed
        }}
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
