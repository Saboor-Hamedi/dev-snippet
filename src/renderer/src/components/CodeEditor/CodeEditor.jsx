import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import * as React from 'react'
import useCursorProp from '../../hook/settings/useCursorProp.js'
import useGutterProp from '../../hook/settings/useGutterProp.js'
import { useSettings } from '../../hook/useSettingsContext'
import useFocus from '../../hook/useFocus'
import settingsManager from '../../config/settingsManager'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import buildTheme from './extensions/buildTheme'
import buildExtensions from './extensions/buildExtensions'
import ErrorBoundary from '../ErrorBoundary'
import SearchPanel from './search/SearchPanel'
import { lineNumbers } from '@codemirror/view'
import { foldGutter, codeFolding } from '@codemirror/language'

// Helper to debounce save operations
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

import { saveCursorPosition, getCursorPosition } from '../../utils/persistentPosition'

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
  snippets = [],
  language = 'markdown',
  theme = 'midnight-pro',
  onCursorChange,
  isDark: forcedIsDark = undefined,
  autoFocus = false,
  centered = false, // Default to false for modals/smaller views
  snippetId = null
}) => {
  // Zoom level is now managed globally by useZoomLevel at the root/SettingsProvider level.
  // Individual components consume the result via CSS variables.
  const editorDomRef = useRef(null)
  const snippetTitles = useMemo(() => {
    if (!Array.isArray(snippets)) return []
    return snippets.map((s) => (s.title || '').trim()).filter(Boolean)
  }, [
    Array.isArray(snippets) ? snippets.length : 0,
    Array.isArray(snippets) ? snippets.map((s) => s.id).join(',') : ''
  ])

  // CONSUME SETTINGS VIA REFACTOR HOOKS (SOLID)
  const {
    cursorWidth,
    cursorColor,
    cursorShape,
    cursorBlinking,
    cursorBlinkingSpeed,
    cursorSelectionBg,
    cursorActiveLineBg,
    cursorShadowBoxColor
  } = useCursorProp()
  const { gutterBgColor, gutterBorderColor, gutterBorderWidth, showGutter } = useGutterProp()
  const { getSetting } = useSettings()
  const fontFamily =
    getSetting('editor.fontFamily') || "'JetBrains Mono', 'Fira Code', Consolas, monospace"

  const viewRef = useRef(null)
  const [isDark, setIsDark] = useState(forcedIsDark ?? false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [lastSearchQuery, setLastSearchQuery] = useState('')

  // Use focus hook for gutter toggle
  useFocus(viewRef, showGutter)

  // Detect dark mode
  useEffect(() => {
    if (forcedIsDark !== undefined) {
      setIsDark(forcedIsDark)
      return
    }

    if (typeof document === 'undefined') return

    const updateTheme = () => {
      const dark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark'
      setIsDark((prevIsDark) => {
        if (prevIsDark !== dark) {
          return dark
        }
        return prevIsDark
      })
    }

    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })

    return () => observer.disconnect()
  }, [forcedIsDark])

  // Listen for focus-editor event (from backup, etc.)
  useEffect(() => {
    const handleFocusEditor = () => {
      console.log('[CodeEditor] Received focus-editor event')
      if (viewRef.current) {
        requestAnimationFrame(() => {
          if (viewRef.current) {
            console.log('[CodeEditor] Focusing editor')
            viewRef.current.focus()
          }
        })
      } else {
        console.warn('[CodeEditor] viewRef.current is null, cannot focus')
      }
    }

    window.addEventListener('app:focus-editor', handleFocusEditor)
    return () => window.removeEventListener('app:focus-editor', handleFocusEditor)
  }, [])

  // Ctrl+F to open search
  useEffect(() => {
    const editorContainer = editorDomRef.current
    if (!editorContainer) return

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        e.stopPropagation()
        setIsSearchOpen(true)
      }
    }

    editorContainer.addEventListener('keydown', handleKeyDown, true)
    return () => editorContainer.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  // 1. Permanent Static Frame (Theme + Gutters) - MUST BE DEFINED BEFORE EFFECTS THAT USE IT
  const baseExtensions = useMemo(() => {
    const extensions = [
      buildTheme(EditorView, {
        isDark,
        caretColor: cursorColor,
        fontSize: 'var(--editor-font-size, 14px)',
        fontFamily,
        cursorWidth,
        cursorShape,
        disableComplexCM: settingsManager.get('advanced.disableComplexCM')
      }),
      // SCROLL SYNC
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          const view = update.view
          if (view?.scrollDOM) {
            const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM
            const maxScroll = scrollHeight - clientHeight
            const percentage = maxScroll > 0 ? scrollTop / maxScroll : 0
            window.dispatchEvent(new CustomEvent('app:editor-scroll', { detail: { percentage } }))
          }
          // Track cursor
          if (update.selectionSet) {
            const state = update.state
            if (state) {
              const pos = state.selection.main.head
              const line = state.doc.lineAt(pos)
              const col = pos - line.from + 1
              if (onCursorChange) onCursorChange({ line: line.number, col })

              // Persist cursor position
              if (snippetId) {
                saveCursorPosition(snippetId, state.selection.main)
              }
            }
          }
        }
      })
    ]

    // Conditionally add Gutters (Line Numbers + Folding)
    if (showGutter) {
      extensions.push(
        lineNumbers({ formatNumber: (n) => n.toString() }),
        foldGutter({
          markerDOM: (open) => {
            const icon = document.createElement('span')
            icon.className = 'cm-fold-marker'
            icon.innerHTML = open ? '▾' : '▸'
            return icon
          }
        }),
        codeFolding()
      )
    }

    return extensions
  }, [isDark, cursorColor, cursorWidth, cursorShape, showGutter, fontFamily, onCursorChange])

  // Preserve cursor position when gutter toggles
  const lastCursorPos = useRef(null)
  const previousShowGutter = useRef(showGutter)

  useEffect(() => {
    // Save cursor position BEFORE gutter changes
    if (previousShowGutter.current !== showGutter && viewRef.current) {
      const state = viewRef.current.state
      if (state) {
        lastCursorPos.current = state.selection.main.head
      }
    }

    // Update previous value
    previousShowGutter.current = showGutter
  }, [showGutter])

  useEffect(() => {
    // Restore cursor position AFTER gutter has changed
    if (lastCursorPos.current !== null && viewRef.current) {
      requestAnimationFrame(() => {
        if (viewRef.current) {
          const view = viewRef.current
          const pos = Math.min(lastCursorPos.current, view.state.doc.length)
          view.dispatch({
            selection: { anchor: pos, head: pos },
            scrollIntoView: true
          })
          // Reset after restoration
          lastCursorPos.current = null
        }
      })
    }
  }, [showGutter])

  // 2. Dynamic Content Extensions (Syntax Highlighting, Autocomplete, etc.)
  const [dynamicExtensions, setDynamicExtensions] = useState([])
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
      ...baseExtensions,
      ...dynamicExtensions,
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
    [baseExtensions, dynamicExtensions, attributesExtension]
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
   * THE PERFORMANCE ENGINE (The "Extension Freezing" Logic)
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
              document.documentElement.classList.contains('dark')) ||
            false,
          caretColor: cursorColor,
          cursorWidth,
          cursorShape,
          fontSize: 'var(--editor-font-size, 14px)',
          cursorBlinking: isBlinking,
          cursorBlinkingSpeed,
          wordWrap: isLargeFile ? 'off' : wordWrap,
          language: isLargeFile ? 'plaintext' : language,
          isLargeFile,
          snippetTitles
        }

        const exts = await buildExtensions(options, {
          debouncedSaveZoom
        })

        if (mounted) {
          setDynamicExtensions(exts)
          setExtensionsLoaded(true)
        }
      } catch (err) {
        console.error('❌ Failed to load editor engine:', err)
      }
    }

    // Immediate load: Removing the legacy 50ms delay + RAF which was causing
    // perceived "lag" or "missing caret" on mount/return from settings.
    loadFullEditorEngine()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [
    wordWrap,
    cursorWidth,
    cursorShape,
    cursorColor,
    isLargeFile,
    // extensionsLoaded, // REMOVED: This causes a double-render loop
    snippetTitles,
    isDark,
    language,
    theme
  ])

  return (
    <div
      className={`cm-editor-container h-full relative ${centered ? 'is-centered' : 'is-full-width'}`}
      data-cursor-blinking={cursorBlinking.toString()}
      data-caret-shape={cursorShape}
      style={{
        '--caret-width': `${cursorWidth}px`,
        '--caret-color': cursorColor,
        '--cursor-blinking-speed': `${cursorBlinkingSpeed}ms`,
        '--selection-background': cursorSelectionBg,
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
        basicSetup={false}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        className={`${className} h-full`}
        onCreateEditor={(view) => {
          viewRef.current = view

          // Restore cursor position for this snippet
          if (snippetId) {
            try {
              const saved = getCursorPosition(snippetId)
              if (
                saved &&
                typeof saved.anchor === 'number' &&
                saved.anchor <= view.state.doc.length &&
                saved.head <= view.state.doc.length
              ) {
                view.dispatch({
                  selection: { anchor: saved.anchor, head: saved.head },
                  scrollIntoView: true
                })
              }
            } catch (e) {
              console.warn('[CodeEditor] Failed to restore cursor:', e)
            }
          }

          // SCROLL SYNC: Dispatch scroll events to LivePreview
          if (view?.scrollDOM) {
            view.scrollDOM.addEventListener('scroll', () => {
              const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM
              const percentage = scrollTop / (scrollHeight - clientHeight)
              // Dispatch with high precision but use requestAnimationFrame if possible in receiver
              window.dispatchEvent(new CustomEvent('app:editor-scroll', { detail: { percentage } }))
            })
          }

          // Pass view to parent if callback provided
          if (onEditorReady) {
            onEditorReady(view)
          }
        }}
        autoFocus={autoFocus}
        editable={!readOnly}
      />

      {/* VS Code-style Search Panel */}
      {isSearchOpen && (
        <SearchPanel
          editorView={viewRef.current}
          onClose={() => setIsSearchOpen(false)}
          initialQuery={lastSearchQuery}
          onQueryChange={setLastSearchQuery}
        />
      )}
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
