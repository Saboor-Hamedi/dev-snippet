import React, { useEffect, useState } from 'react'
import { getLanguage } from './EditorLanguage'

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
  textareaRef
}) => {
  const [CodeMirrorComponent, setCodeMirrorComponent] = useState(null)
  const [cmExtensions, setCmExtensions] = useState(null)

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

          const themeExt = EditorView.theme(
            {
              '&': {
                backgroundColor: 'var(--color-bg-primary)',
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                fontSize: 'var(--xsmall)'
              },
              '.cm-scroller': { backgroundColor: 'var(--color-bg-primary)' },
              '.cm-content': {
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-text-primary)',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '12px',
                paddingRight: '12px'
              },
              '.cm-gutters': {
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-secondary)'
              },
              '.cm-cursor': { borderLeftColor: 'var(--color-text-primary)' },
              '.cm-selectionBackground': { backgroundColor: 'rgba(255,255,255,0.06)' },
              '.cm-activeLine': { backgroundColor: 'transparent' },
              // Syntax highlighting colors
              '.cm-keyword': { color: '#ff7b72' },
              '.cm-variableName, .cm-variable': { color: '#ffa657' },
              '.cm-def': { color: '#d2a8ff' },
              '.cm-propertyName, .cm-attribute, .cm-tag': { color: '#7ee787' },
              '.cm-number, .cm-literal': { color: '#a5d6ff' },
              '.cm-string': { color: '#a5d6ff' },
              '.cm-comment': { color: '#8b949e', fontStyle: 'italic' },
              '.cm-operator': { color: '#ff7b72' },
              '.cm-bracket': { color: '#f85149' },
              '.cm-invalid': { color: '#f85149' }
            },
            { dark: !!isDark }
          )

          const exts = [themeExt]
          
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
  }, [language])

  if (CodeMirrorComponent && cmExtensions) {
    const CM = CodeMirrorComponent
    return (
      <CM
        value={value || ''}
        onChange={(val) => {
          try { onChange && onChange(val || '') } catch {}
        }}
        height={height}
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
        className={className}
        style={style}
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
