import React, { useEffect, useState, useRef } from 'react'
import { getLanguage } from './EditorLanguage'
import { useZoomLevel } from '../../hook/useSettingsContext.jsx'

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
  onZoomChange
}) => {
  const [CodeMirrorComponent, setCodeMirrorComponent] = useState(null)
  const [cmExtensions, setCmExtensions] = useState(null)
  const [zoomLevel, setZoomLevel] = useZoomLevel() // Persistent zoom level from settings
  const editorRef = useRef(null)
  const viewRef = useRef(null) // Reference to CodeMirror EditorView

  // Notify parent component of zoom changes
  useEffect(() => {
    console.log('📊 Zoom level changed, notifying parent:', zoomLevel)
    if (onZoomChange) {
      onZoomChange(zoomLevel)
      console.log('📊 Parent notified of zoom change:', zoomLevel)
    }
  }, [zoomLevel, onZoomChange])

  // Update font size directly to DOM for immediate live updates (like VS Code)
  useEffect(() => {
    console.log('🎨 Zoom level changed, applying update:', zoomLevel)
    
    // Find CodeMirror editor in the DOM directly (more reliable than view ref)
    const editorElement = document.querySelector('.cm-editor')
    if (editorElement && zoomLevel) {
      console.log('📝 Found CodeMirror editor, applying zoom:', zoomLevel)
      
      // Add smooth transition first
      editorElement.style.transition = 'font-size 0.2s ease-out'
      
      // Apply font size to the main editor
      editorElement.style.fontSize = `calc(var(--xsmall) * ${zoomLevel})`
      
      // Also update specific elements for complete coverage
      const contentElement = editorElement.querySelector('.cm-content')
      if (contentElement) {
        contentElement.style.transition = 'font-size 0.2s ease-out'
        contentElement.style.fontSize = `calc(var(--xsmall) * ${zoomLevel})`
      }
      
      const gutterElement = editorElement.querySelector('.cm-gutters')
      if (gutterElement) {
        gutterElement.style.transition = 'font-size 0.2s ease-out'
        gutterElement.style.fontSize = `calc(var(--xsmall) * ${zoomLevel})`
      }
      
      // Update scroller element
      const scrollerElement = editorElement.querySelector('.cm-scroller')
      if (scrollerElement) {
        scrollerElement.style.transition = 'font-size 0.2s ease-out'
        scrollerElement.style.fontSize = `calc(var(--xsmall) * ${zoomLevel})`
      }
      
      console.log('✅ Applied smooth zoom transition to DOM elements:', zoomLevel)
    } else {
      console.warn('⚠️ CodeMirror editor element not found or no zoom level')
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
          const isDark = document.documentElement.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark'
          
          // Get current zoom level from React Context
          const currentZoom = zoomLevel || 1.0
          console.log('🔄 Building extensions with zoom level:', currentZoom)

          // Get theme colors from CSS variables (set by your ThemeModal)
          const themeExt = EditorView.theme(
            {
              '&': {
                backgroundColor: 'var(--color-bg-primary, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                fontSize: `calc(var(--xsmall) * ${currentZoom})`,
                height: '100%',
                transition: 'font-size 0.2s ease-out'
              },
              '.cm-scroller': { 
                backgroundColor: 'var(--color-bg-primary, #ffffff)',
                height: '100%'
              },
              '.cm-content': {
                color: 'var(--color-text-primary, #0f172a)',
                caretColor: 'var(--color-text-primary, #0f172a)',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '12px',
                paddingRight: '12px',
                minHeight: '100%',
                transition: 'font-size 0.2s ease-out'
              },
              '.cm-gutters': {
                backgroundColor: 'var(--color-bg-secondary, #f8fafc)',
                color: 'var(--color-text-secondary, #64748b)',
                borderRight: 'none'
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
          
          // Add zoom keymap - get current zoom dynamically to avoid closure issues
          try {
            const { keymap } = await import('@codemirror/view')
            const zoomKeymap = keymap.of([
              {
                key: 'Ctrl-=', // Ctrl + =
                run: () => {
                  // Get current zoom level from React context
                  console.log('🎯 Keyboard zoom in triggered, current zoom:', zoomLevel)
                  const newZoom = Math.min(zoomLevel + 0.1, 3)
                  setZoomLevel(newZoom)
                  console.log('🎯 New zoom level set to:', newZoom)
                  return true
                }
              },
              {
                key: 'Ctrl-Minus', // Ctrl + -
                run: () => {
                  console.log('🎯 Keyboard zoom out triggered, current zoom:', zoomLevel)
                  const newZoom = Math.max(zoomLevel - 0.1, 0.5)
                  setZoomLevel(newZoom)
                  console.log('🎯 New zoom level set to:', newZoom)
                  return true
                }
              },
              {
                key: 'Ctrl-0', // Ctrl + 0
                run: () => {
                  console.log('🎯 Keyboard zoom reset triggered')
                  setZoomLevel(1)
                  console.log('🎯 Zoom reset to 1.0')
                  return true
                }
              },
              {
                key: 'Cmd-=', // Cmd + = (Mac)
                run: () => {
                  console.log('🎯 Mac keyboard zoom in triggered, current zoom:', zoomLevel)
                  const newZoom = Math.min(zoomLevel + 0.1, 3)
                  setZoomLevel(newZoom)
                  return true
                }
              },
              {
                key: 'Cmd-Minus', // Cmd + - (Mac)
                run: () => {
                  console.log('🎯 Mac keyboard zoom out triggered, current zoom:', zoomLevel)
                  const newZoom = Math.max(zoomLevel - 0.1, 0.5)
                  setZoomLevel(newZoom)
                  return true
                }
              },
              {
                key: 'Cmd-0', // Cmd + 0 (Mac)
                run: () => {
                  console.log('🎯 Mac keyboard zoom reset triggered')
                  setZoomLevel(1)
                  return true
                }
              }
            ])
            exts.push(zoomKeymap)
          } catch (err) {
            console.warn('Failed to load zoom keymap:', err)
          }

          // Add mouse wheel zoom extension
          try {
            const { EditorView } = viewModule
            const mouseWheelZoomExtension = EditorView.domEventHandlers({
              wheel: (event, view) => {
                // Only zoom when Ctrl (or Cmd on Mac) is held
                if (event.ctrlKey || event.metaKey) {
                  event.preventDefault() // Prevent default scrolling
                  
                  const delta = event.deltaY < 0 ? 0.1 : -0.1 // Scroll up = zoom in, scroll down = zoom out
                  const newZoom = Math.max(0.5, Math.min(3.0, zoomLevel + delta))
                  
                  console.log('🖱️ Mouse wheel zoom triggered, current:', zoomLevel, 'new:', newZoom)
                  
                  // Save zoom level for smooth update via transaction
                  setZoomLevel(newZoom)
                  
                  return true // Event handled
                }
                return false // Let normal scrolling happen
              }
            })
            exts.push(mouseWheelZoomExtension)
            console.log('✅ Mouse wheel zoom extension added')
          } catch (err) {
            console.warn('Failed to load mouse wheel zoom:', err)
          }
          
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

        buildExtensions().then(exts => {
          if (mounted) setCmExtensions(exts)
        }).catch(() => {
          if (mounted) setCmExtensions([])
        })

        // Zoom shortcuts are now handled by CodeMirror keymap

        const obs = new MutationObserver(() => {
          buildExtensions().then(exts => {
            if (mounted) setCmExtensions(exts)
          }).catch(() => {})
        })
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
        try { window.__cmThemeObserver = obs } catch {}
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
        try { delete window.__cmThemeObserver } catch {}
      } catch {}
    }
  }, [language, zoomLevel])

  if (CodeMirrorComponent && cmExtensions) {
    const CM = CodeMirrorComponent
    return (
      <CM
        ref={(editorRef) => {
          // Try multiple ways to get the CodeMirror view
          if (editorRef) {
            viewRef.current = editorRef.view || editorRef
            console.log('📝 CodeMirror editor reference captured:', editorRef)
            
            // Also try to get the DOM element directly
            setTimeout(() => {
              const editorDOM = document.querySelector('.cm-editor')
              if (editorDOM) {
                console.log('📝 Found CodeMirror DOM element:', editorDOM)
                // Apply current zoom immediately
                if (zoomLevel && zoomLevel !== 1) {
                  editorDOM.style.fontSize = `calc(var(--xsmall) * ${zoomLevel})`
                  console.log('🎨 Applied initial zoom to DOM:', zoomLevel)
                }
              }
            }, 100)
          }
        }}
        value={value || ''}
        onChange={(val) => {
          try { onChange && onChange(val || '') } catch {}
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
        try { onChange && onChange(e.target.value || '') } catch {}
      }}
      onKeyDown={onKeyDown}
      className={`w-full h-full dark:bg-slate-900 dark:text-slate-200 font-mono text-xsmall leading-6 ${className || ''}`}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        fontSize: 'var(--xsmall)',
        color: 'var(--text-main)',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        padding: 16,
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
