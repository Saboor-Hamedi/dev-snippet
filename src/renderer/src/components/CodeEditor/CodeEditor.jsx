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

  // 3. Dynamic Editor Attributes (The fix for styles not applying)
  const attributesExtension = useMemo(() => {
    return EditorView.editorAttributes.of({
      'data-caret-shape': cursorShape,
      'data-cursor-blinking': cursorBlinking ? 'true' : 'false',
      style: `
        --caret-width: ${cursorWidth}px;
        --caret-color: ${cursorColor};
        --cursor-blinking-speed: ${cursorBlinkingSpeed}ms;
        --selection-background: ${cursorSelectionBg};
        --gutter-bg-color: ${gutterBgColor};
        --gutter-border-color: ${gutterBorderColor};
        --gutter-border-width: ${gutterBorderWidth}px;
        --active-line-border-width: ${cursorActiveLineBorder}px;
        --active-line-gutter-border-width: ${cursorActiveLineGutterBorder}px;
        --active-line-bg: ${cursorActiveLineBg};
        --shadow-box-bg: ${cursorShadowBoxColor};
      `
    })
  }, [
    cursorShape,
    cursorBlinking,
    cursorBlinkingSpeed,
    cursorWidth,
    cursorColor,
    cursorSelectionBg,
    gutterBgColor,
    gutterBorderColor,
    gutterBorderWidth,
    cursorActiveLineBorder,
    cursorActiveLineGutterBorder,
    cursorActiveLineBg,
    cursorShadowBoxColor
  ])

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
          caretColor: cursorColor,
          fontSize: 'var(--editor-font-size, 14px)',
          cursorBlinking, // Pass blinking state
          cursorBlinkingSpeed, // Pass blinking speed
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
    cursorWidth,
    cursorActiveLineBg,
    cursorShadowBoxColor,
    cursorColor,
    cursorBlinking,
    cursorBlinkingSpeed, // Add dependency
    gutterBgColor,
    debouncedSaveZoom,
    isLargeFile,
    extensionsLoaded
  ])

  return (
    <div className="cm-editor-wrapper h-full" ref={editorDomRef}>
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
