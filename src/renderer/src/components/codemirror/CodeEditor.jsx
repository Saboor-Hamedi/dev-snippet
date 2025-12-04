import React, { useEffect, useState, useRef } from 'react'
import { getLanguage } from './EditorLanguage'
import { useZoomLevel, MIN_ZOOM, MAX_ZOOM } from '../../hook/useZoomLevel'

// A self-contained editor that prefers CodeMirror 6 if available, with
// a textarea fallback. All theming and CM wiring lives here.
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
  const [zoomLevel, setZoomLevel] = useZoomLevel() // Persistent zoom level from settings
  const zoomLevelRef = useRef(zoomLevel) // Ref to access current zoom in callbacks without re-running effects
  const editorRef = useRef(null)
  const viewRef = useRef(null) // Reference to CodeMirror EditorView
  const isMouseWheelZoomRef = useRef(false) // Track if zoom is from mousewheel
  const isFirstRender = useRef(true) // Track first render to disable initial transition

  // Keep ref in sync
  useEffect(() => {
    zoomLevelRef.current = zoomLevel
  }, [zoomLevel])

  // Notify parent component of zoom changes
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(zoomLevel)
    }
  }, [zoomLevel, onZoomChange])

  // Update font size directly to DOM for immediate live updates (like VS Code)
  useEffect(() => {
    // Find CodeMirror editor in the DOM directly (more reliable than view ref)
    const editorElement = document.querySelector('.cm-editor')
    if (editorElement && zoomLevel) {
      // Disable transition for mousewheel zoom to prevent shaking
      // Only use transition for keyboard shortcuts (Ctrl+0, Ctrl+Plus, etc.)
      const isReset = zoomLevel === 1.0
      const shouldTransition = !isFirstRender.current && !isReset && !isMouseWheelZoomRef.current
      const transition = shouldTransition ? 'font-size 0.1s ease-out' : 'none'

      if (isFirstRender.current) {
        // Ensure next render allows transition
        setTimeout(() => {
          isFirstRender.current = false
        }, 100)
      }

      // Reset mousewheel flag after applying
      if (isMouseWheelZoomRef.current) {
        setTimeout(() => {
          isMouseWheelZoomRef.current = false
        }, 100)
      }

      // Calculate font size with minimum of 8px to prevent unreadable text
      const calcFontSize = `max(10px, calc(var(--editor-font-size, 14px) * ${zoomLevel}))`

      // Apply font size to the main editor using the CSS variable
      editorElement.style.transition = transition
      editorElement.style.fontSize = calcFontSize
      editorElement.style.fontFamily = 'var(--editor-font-family, "JetBrains Mono")'

      // Also update specific elements for complete coverage
      const contentElement = editorElement.querySelector('.cm-content')
      if (contentElement) {
        contentElement.style.transition = transition
        contentElement.style.fontSize = calcFontSize
        contentElement.style.fontFamily = 'var(--editor-font-family, "JetBrains Mono")'
      }

      const gutterElement = editorElement.querySelector('.cm-gutters')
      if (gutterElement) {
        gutterElement.style.transition = transition
        gutterElement.style.fontSize = calcFontSize
        gutterElement.style.fontFamily = 'var(--editor-font-family, "JetBrains Mono")'
        // Dynamically adjust gutter width based on font size to prevent merging
        const minGutterWidth = zoomLevel < 0.7 ? '50px' : '40px'
        gutterElement.style.minWidth = minGutterWidth
      }

      // Update scroller element
      const scrollerElement = editorElement.querySelector('.cm-scroller')
      if (scrollerElement) {
        scrollerElement.style.transition = transition
        scrollerElement.style.fontSize = calcFontSize
        scrollerElement.style.fontFamily = 'var(--editor-font-family, "JetBrains Mono")'
      }
    }
  }, [zoomLevel])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [{ default: CM }, viewModule] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/view')
        ])
        if (!mounted) return
        setCodeMirrorComponent(() => CM)

        const { EditorView } = viewModule

        const buildExtensions = async () => {
          const isDark =
            document.documentElement.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark'

          // Get theme colors from CSS variables (set by your ThemeModal)
          const themeExt = EditorView.theme(
            {
              '&': {
                backgroundColor: 'var(--color-bg-primary, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                // Use CSS variables for font settings
                fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
                // We let the DOM style handle font size so we don't need to rebuild extensions on zoom
                fontSize: 'inherit',
                height: '100%'
              },
              '.cm-scroller': {
                backgroundColor: 'var(--color-bg-primary, #ffffff)',
                height: '100%',
                fontFamily: 'inherit'
              },
              '.cm-content': {
                color: 'var(--color-text-primary, #0f172a)',
                caretColor: 'var(--color-text-primary, #0f172a)',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '12px',
                paddingRight: '12px',
                minHeight: '100%',
                fontFamily: 'inherit'
              },
              '.cm-gutters': {
                backgroundColor: 'var(--color-bg-secondary, #64748b)',
                color: 'var(--color-text-secondary, #64748b)',
                borderRight: '1px solid var(--color-border, #e2e8f0)',
                fontFamily: 'inherit',
                minWidth: '40px',
                paddingLeft: '8px',
                paddingRight: '8px'
              },
              '.cm-cursor': {
                borderLeftColor: 'var(--color-text-primary, #0f172a)'
              },
              '.cm-selectionBackground': {
                backgroundColor: 'var(--color-accent-primary, rgba(59, 130, 246, 0.2))'
              },
              '.cm-activeLine': {
                backgroundColor: 'var(--color-bg-tertiary, rgba(248, 250, 252, 0.8))'
              },
              // Syntax highlighting that works for both light and dark themes
              '.cm-keyword': { color: isDark ? '#ff7b72' : '#d73a49' },
              '.cm-variableName, .cm-variable': { color: isDark ? '#ffa657' : '#e36209' },
              '.cm-string': { color: isDark ? '#a5d6ff' : '#032f62' },
              '.cm-comment': { color: isDark ? '#8b949e' : '#6a737d', fontStyle: 'italic' },
              '.cm-number': { color: isDark ? '#79c0ff' : '#005cc5' },
              '.cm-operator': { color: isDark ? '#ff7b72' : '#d73a49' },
              '.cm-focused': {
                outline: 'none'
              },
              '.cm-editor.cm-focused': {
                outline: 'none'
              }
            },
            { dark: isDark }
          )

          const exts = [themeExt]
          // wrap lines
          if (wordWrap === 'on') {
            exts.push(EditorView.lineWrapping)
          }
          // Add zoom keymap - get current zoom dynamically to avoid closure issues
          try {
            const { keymap } = await import('@codemirror/view')
            const zoomKeymap = keymap.of([
              {
                key: 'Ctrl-=', // Ctrl + =
                run: () => {
                  const current = zoomLevelRef.current || 1.0
                  const newZoom = Math.min(current + 0.1, MAX_ZOOM)
                  setZoomLevel(newZoom)
                  return true
                }
              },
              {
                key: 'Ctrl-Minus', // Ctrl + -
                run: () => {
                  const current = zoomLevelRef.current || 1.0
                  const newZoom = Math.max(current - 0.1, MIN_ZOOM)
                  setZoomLevel(newZoom)
                  return true
                }
              },
              {
                key: 'Ctrl-0', // Ctrl + 0
                run: () => {
                  setZoomLevel(1)
                  return true
                }
              },
              {
                key: 'Cmd-=', // Cmd + = (Mac)
                run: () => {
                  const current = zoomLevelRef.current || 1.0
                  const newZoom = Math.min(current + 0.1, MAX_ZOOM)
                  setZoomLevel(newZoom)
                  return true
                }
              },
              {
                key: 'Cmd-Minus', // Cmd + - (Mac)
                run: () => {
                  const current = zoomLevelRef.current || 1.0
                  const newZoom = Math.max(current - 0.1, MIN_ZOOM)
                  setZoomLevel(newZoom)
                  return true
                }
              },
              {
                key: 'Cmd-0', // Cmd + 0 (Mac)
                run: () => {
                  setZoomLevel(1)
                  return true
                }
              }
            ])
            exts.push(zoomKeymap)
          } catch (err) {}

          // Add mouse wheel zoom extension
          try {
            const { EditorView } = viewModule
            const mouseWheelZoomExtension = EditorView.domEventHandlers({
              wheel: (event, view) => {
                // Only zoom when Ctrl (or Cmd on Mac) is held
                if (event.ctrlKey || event.metaKey) {
                  event.preventDefault() // Prevent default scrolling

                  const current = zoomLevelRef.current || 1.0
                  const delta = event.deltaY < 0 ? 0.1 : -0.1 // Scroll up = zoom in, scroll down = zoom out
                  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current + delta))

                  // Mark as mousewheel zoom to disable transition
                  isMouseWheelZoomRef.current = true

                  // Save zoom level for smooth update via transaction
                  setZoomLevel(newZoom)

                  return true // Event handled
                }
                return false // Let normal scrolling happen
              }
            })
            exts.push(mouseWheelZoomExtension)
          } catch (err) {}

          // Load language extension
          try {
            const langDef = getLanguage(language)
            if (langDef && langDef.import) {
              const langExt = await langDef.import()
              if (langExt) exts.push(langExt)
            }
          } catch (err) {
            // Language loading failed, continue without syntax highlighting
          }

          return exts
        }

        buildExtensions()
          .then((exts) => {
            if (mounted) setCmExtensions(exts)
          })
          .catch(() => {
            if (mounted) setCmExtensions([])
          })

        const obs = new MutationObserver(() => {
          buildExtensions()
            .then((exts) => {
              if (mounted) setCmExtensions(exts)
            })
            .catch(() => {})
        })
        obs.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-theme']
        })
        try {
          window.__cmThemeObserver = obs
        } catch {}
      } catch (e) {
        // If CM isn't available, fall back to textarea automatically.
      }
    }
    load()
    return () => {
      mounted = false
      try {
        const o = window.__cmThemeObserver
        if (o && typeof o.disconnect === 'function') o.disconnect()
        try {
          delete window.__cmThemeObserver
        } catch {}
      } catch {}
    }
  //  [Live update effect]
  }, [language, wordWrap]) // Removed zoomLevel from dependency to prevent rebuilds

  if (CodeMirrorComponent && cmExtensions) {
    const CM = CodeMirrorComponent
    return (
      <CM
        ref={(editorRef) => {
          // Try multiple ways to get the CodeMirror view
          if (editorRef) {
            viewRef.current = editorRef.view || editorRef

            // Also try to get the DOM element directly
            const editorDOM = editorRef.view
              ? editorRef.view.dom
              : document.querySelector('.cm-editor')
            if (editorDOM) {
              // Apply current zoom immediately
              if (zoomLevel && zoomLevel !== 1) {
                editorDOM.style.fontSize = `calc(var(--editor-font-size, 14px) * ${zoomLevel})`
                editorDOM.style.fontFamily = 'var(--editor-font-family, "JetBrains Mono")'
              }
            }
          }
        }}
        value={value || ''}
        onChange={(val) => {
          try {
            onChange && onChange(val || '')
          } catch {}
        }}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false
        }}
        extensions={cmExtensions}
        className={`${className} h-full`}
        style={{ ...style, height: '100%', backgroundColor: 'transparent' }}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <textarea
      ref={textareaRef}
      value={value || ''}
      onChange={(e) => {
        try {
          onChange && onChange(e.target.value || '')
        } catch {}
      }}
      onKeyDown={onKeyDown}
      className={`w-full h-full dark:bg-slate-900 dark:text-slate-200 font-mono text-xsmall leading-6 ${className || ''}`}
      style={{
        fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
        fontSize: 'calc(var(--editor-font-size, 14px) * var(--zoom-level, 1))',
        color: 'var(--text-main)',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        padding: 12,
        resize: 'none',
        overflow: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        ...style
      }}
    />
  )
}

export default CodeEditor
