import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import useCursorProp from '../../../hook/settings/useCursorProp.js'
import useGutterProp from '../../../hook/settings/useGutterProp.js'
import { useSettings, useZoomLevel, useEditorZoomLevel } from '../../../hook/useSettingsContext'
import useFocus from '../../../hook/useFocus'
import settingsManager from '../../../config/settingsManager'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView, closeHoverTooltips } from '@codemirror/view'
import { closeCompletion } from '@codemirror/autocomplete'
import buildTheme from '../engine/buildTheme'
import buildExtensions from '../engine/buildExtensions'
import '../../../components/CodeEditor/UnifiedTooltip.css'
import ErrorBoundary from '../../../components/ErrorBoundary'
import SearchPanel from '../../../components/CodeEditor/search/SearchPanel'
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

import { saveCursorPosition, getCursorPosition } from '../../../utils/persistentPosition'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                            CODE EDITOR                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * CORE RESPONSIBILITY:
 * The primary text manipulation engine of the application. Wraps CodeMirror 6
 * with a custom extension stack and high-performance state synchronization.
 *
 * PERFORMANCE ARCHITECTURE:
 * 1. Semi-controlled state: We only push 'value' updates to CodeMirror when
 *    the snippet ID changes or on manual save. This avoids the expensive
 *    Reconciliation loop during rapid typing.
 * 2. Asynchronous Engine: Extensions (Markdown, SQL, etc.) are loaded
 *    lazily and offloaded to prevent blocking the UI thread.
 * 3. Performance Barrier: Automatically switches to 'plaintext' mode for
 *    extremely large files to maintain 60fps typing.
 *
 * STABILITY & CURSOR JUMP PREVENTION:
 * CodeMirror can reset its internal view (losing cursor/scroll) if its
 * extensions array changes reference unexpectedly.
 * - We stabilize snippet titles with deep-comparison.
 * - We use a global save-shield (window.__isSavingSettings) to freeze
 *   extension rebuilds during manual saves.
 */

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
  snippetId = null,
  zenFocus = false,
  onScroll,
  extensions = [], // Restored: Important for WikiLink and other external builders
  style = {}
}) => {
  // Zoom level is now managed globally by useZoomLevel at the root/SettingsProvider level.
  // Individual components consume the result via CSS variables.
  const editorDomRef = useRef(null)
  
  // ... (keeping existing refs)

  // 1. PERFORMANCE: Stabilize snippet list comparison to avoid map/join on every keystroke
  // We use a ref to keep the array identity stable unless content actually changes.
  const lastTitlesRef = useRef([])
  const snippetTitles = useMemo(() => {
    if (!Array.isArray(snippets)) return lastTitlesRef.current
    const newTitles = snippets.map((s) => (s.title || '').trim()).filter(Boolean)

    // Deep compare to avoid triggering extension rebuilds on every save
    const isSame =
      newTitles.length === lastTitlesRef.current.length &&
      newTitles.every((t, i) => t === lastTitlesRef.current[i])

    if (isSame) return lastTitlesRef.current
    lastTitlesRef.current = newTitles
    return newTitles
  }, [snippets])

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
  const { getSetting } = useSettings(); const baseFontSize = getSetting("editor.fontSize") || 13;
  const fontFamily =
    getSetting('editor.fontFamily') || "'JetBrains Mono', 'Fira Code', Consolas, monospace"

  const viewRef = useRef(null)
  const [isDark, setIsDark] = useState(forcedIsDark ?? false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [searchFocusTrigger, setSearchFocusTrigger] = useState({ mode: 'find', ts: 0 })

  // Use focus hook for gutter toggle
  useFocus(viewRef, showGutter)

  // Detect dark mode
  useEffect(() => {
    if (forcedIsDark !== undefined) {
      setIsDark(forcedIsDark)
      return
    }

    if (typeof document === 'undefined') return
    // check theme is dark or light
    const updateTheme = () => {
      // Light themes list (must match themeProps.js)
      const lightThemes = ['polaris', 'minimal-gray']
      const currentTheme = document.documentElement.getAttribute('data-theme')

      // Theme is LIGHT if it's in the lightThemes list, otherwise it's DARK
      const dark = currentTheme
        ? !lightThemes.includes(currentTheme)
        : document.documentElement.classList.contains('dark')

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
      if (viewRef.current) {
        requestAnimationFrame(() => {
          if (viewRef.current) {
            try {
              viewRef.current.focus()
            } catch (e) {
              console.warn('Failed to focus editor:', e)
            }
          }
        })
      } else {
        console.warn('[CodeEditor] viewRef.current is null, cannot focus')
      }
    }

    window.addEventListener('app:focus-editor', handleFocusEditor)
    return () => window.removeEventListener('app:focus-editor', handleFocusEditor)
  }, [])

  // Listen for request to close tooltips (from global shortcuts)
  useEffect(() => {
    const handleCloseTooltips = () => {
      if (viewRef.current) {
        if (typeof closeHoverTooltips === 'function') closeHoverTooltips(viewRef.current)
        if (typeof closeCompletion === 'function') closeCompletion(viewRef.current)
      }
    }
    window.addEventListener('app:close-tooltips', handleCloseTooltips)
    return () => window.removeEventListener('app:close-tooltips', handleCloseTooltips)
  }, [])

  // Ctrl+F to open search
  // Ctrl+F / Ctrl+H shortcuts (Global listener to catch even when specific focus is lost)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      // Escape: Close tooltips first
      if (key === 'escape') {
        const hasTooltipFn = typeof closeHoverTooltips === 'function'
        if (viewRef.current && hasTooltipFn && closeHoverTooltips(viewRef.current)) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
      }

      // Ctrl+F: Find
      if (isMod && key === 'f') {
        e.preventDefault()
        e.stopPropagation()
        setIsSearchOpen(true)
        setSearchFocusTrigger({ mode: 'find', ts: Date.now() })
      }
      // Ctrl+H: Replace
      else if (isMod && key === 'h') {
        e.preventDefault()
        e.stopPropagation()
        setIsSearchOpen(true)
        setSearchFocusTrigger({ mode: 'replace', ts: Date.now() })
      }
    }

    // Use capture to ensure we get it before browser defaults or inner elements swallow it
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  const [zoomLevel] = useZoomLevel()
  const [editorZoom] = useEditorZoomLevel()
  const lastZoom = useRef(zoomLevel)
  const lastEditorZoom = useRef(editorZoom)

  // Force cursor update when zoom changes
  useEffect(() => {
    if (!viewRef.current || !viewRef.current.state) return

    // PERFORMANCE: Stop the "whole editor jump" when saving or changing themes.
    // If the window shield is active, we strictly ignore background re-measures.
    if (window.__isSavingSettings) return

    if (lastZoom.current === zoomLevel && lastEditorZoom.current === editorZoom) return

    lastZoom.current = zoomLevel
    lastEditorZoom.current = editorZoom

    const view = viewRef.current
    try {
      if (view && view.state) view.requestMeasure()
      if (view.state?.selection?.main) {
        view.dispatch({
          effects: [EditorView.scrollIntoView(view.state.selection.main, { y: 'center' })]
        })
      }
    } catch (e) {
      console.warn('Zoom adjustment skipped due to view state error', e)
    }
  }, [zoomLevel, editorZoom])

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
        cursorShadowBoxColor,
        cursorActiveLineBg,
        cursorSelectionBg,
        disableComplexCM: settingsManager.get('advanced.disableComplexCM')
      }),
      // --- UNIFIED PERFORMANCE LISTENER ---
      EditorView.updateListener.of((update) => {
        // 1. CURSOR TRACKING (Debounced via microtask/RAF to keep typing smooth)
        if (update.selectionSet && onCursorChange) {
          const state = update.state
          const pos = state.selection.main.head

          if (window._cursorUpdatePending) cancelAnimationFrame(window._cursorUpdatePending)
          window._cursorUpdatePending = requestAnimationFrame(() => {
            const line = state.doc.lineAt(pos)
            const col = pos - line.from + 1
            onCursorChange({ line: line.number, col })

            // Persist position (Long debounce for storage)
            const currentId = snippetId // Correctly capture current ID
            if (currentId) {
              if (window._cursorSaveTimeout) clearTimeout(window._cursorSaveTimeout)
              window._cursorSaveTimeout = setTimeout(() => {
                saveCursorPosition(currentId, state.selection.main)
              }, 3000) // 3s ensures zero interference with fluid typing
            }
          })
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
  }, [
    isDark,
    cursorColor,
    cursorWidth,
    cursorShape,
    showGutter,
    fontFamily,
    onCursorChange,
    cursorBlinking,
    cursorBlinkingSpeed,
    cursorShadowBoxColor,
    snippetId // Explicitly include snippetId to fix the stale persistence closure
  ])

  // ... (keeping existing layout effects)

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
    return [
      EditorView.editorAttributes.of({
        class: 'premium-editor-engine'
      }),
      EditorView.contentAttributes.of({
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off'
      })
    ]
  }, [])

  // Merge extensions
  const allExtensions = useMemo(
    () => [
      ...baseExtensions,
      ...dynamicExtensions,
      ...extensions, // Restored: Merges extensions from the WikiLink component
      attributesExtension
    ],
    [baseExtensions, dynamicExtensions, extensions, attributesExtension]
  )

  // ... (keeping existing logic)
  
  // Detect large files (Optimized for zero typing lag)
  const [isLargeFile, setIsLargeFile] = useState(() => {
    const charCount = (value || '').length
    return charCount > 150000 
  })

  // Viewport Margin - Higher margin for massive files ensures smoother scrolling
  // by keeping more lines pre-measured in the background.
  const viewportMarginAdjustment = isLargeFile ? 1500 : 1000

  // ... (keeping large file logic)
  
  const lastLargeState = useRef(isLargeFile)

  useEffect(() => {
    const charCount = (value || '').length

    // Instant check for extreme cases (massive paste)
    if (charCount > 150000 && !lastLargeState.current) {
      lastLargeState.current = true
      setIsLargeFile(true)
      if (onLargeFileChange) onLargeFileChange(true)
      return
    }

    // Return to normal mode if file shrinks significantly
    if (charCount < 50000 && lastLargeState.current) {
      lastLargeState.current = false
      setIsLargeFile(false)
      if (onLargeFileChange) onLargeFileChange(false)
      return
    }

    // Debounced line count for edge cases
    const handler = setTimeout(() => {
      // Only run line count if charCount is in the "grey zone"
      if (charCount > 50000 && charCount < 150000) {
        const lineCount = (value.match(/\n/g) || []).length + 1
        const isLarge = lineCount > 4000 || charCount > 100000

        if (isLarge !== lastLargeState.current) {
          lastLargeState.current = isLarge
          setIsLargeFile(isLarge)
          if (onLargeFileChange) onLargeFileChange(isLarge)
        }
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
      // PERFORMANCE: Skip engine rebuild if we are in the middle of a manual save
      // This is the source of the "Jump" - the engine reconfigures as titles update
      if (window.__isSavingSettings) return

      try {
        // Build the configuration object
        const isBlinking = Boolean(cursorBlinking) // Explicit cast
        const options = {
          EditorView,
          isDark, // Use the state variable that's already properly detecting light/dark themes
          caretColor: cursorColor,
          cursorWidth,
          cursorShape,
          cursorSelectionBg,
          fontSize: 'var(--editor-font-size, 14px)',
          cursorBlinking: isBlinking,
          cursorBlinkingSpeed,
          wordWrap,
          language: isLargeFile ? 'plaintext' : language,
          isLargeFile,
          snippetTitles,
          zenFocus
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
    theme,
    zenFocus
  ])

  return (
    <div
      className={`cm-editor-container h-full relative ${centered ? 'is-centered' : 'is-full-width'}`}
      data-cursor-blinking={cursorBlinking.toString()}
      data-caret-shape={cursorShape}
      style={{
        '--editor-font-size': `${baseFontSize * editorZoom}px`,
        '--caret-width': `${cursorWidth}px`,
        '--caret-color': cursorColor,
        '--cursor-blinking-speed': `${cursorBlinkingSpeed}ms`,
        '--selection-background': cursorSelectionBg,
        '--active-line-bg': cursorActiveLineBg,
        '--shadow-box-bg': cursorShadowBoxColor,
        '--gutter-bg-color': gutterBgColor,
        '--gutter-border-color': gutterBorderColor,
        '--gutter-border-width': `${gutterBorderWidth}px`,
        backgroundColor: 'var(--editor-bg)',
        ...style // Merge incoming styles
      }}
      ref={editorDomRef}
    >
      <CodeMirror
        value={value || ''}
        // PERFORMANCE: Semi-controlled pattern.
        // We only force value updates when the snippetId changes to prevent
        // the expensive 100k string comparison/dispatch loop on every keystroke.
        key={snippetId || 'new'}
        onChange={onChange}
        readOnly={readOnly}
        extensions={allExtensions}
        basicSetup={false}
        height="100%" minHeight="100%"
        theme={isDark ? 'dark' : 'light'}
        className={`${className} h-full flex flex-col flex-1`}
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

          // Pass view to parent if callback provided
          if (onEditorReady) {
            onEditorReady(view)
          }

          // --- NATIVE PASSIVE SCROLL SYNC ---
          // This is the most efficient way to track scroll in Electron/Chrome
          if (view.scrollDOM) {
            view.scrollDOM.addEventListener(
              'scroll',
              () => {
                const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM
                const maxScroll = scrollHeight - clientHeight
                if (maxScroll > 0) {
                  const percentage = scrollTop / maxScroll
                  window.dispatchEvent(
                    new CustomEvent('app:editor-scroll', { detail: { percentage } })
                  )
                }
                // Call raw scroll handler if provided
                if (onScroll) {
                  onScroll(scrollTop)
                }
              },
              { passive: true }
            )
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
          focusTrigger={searchFocusTrigger}
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
