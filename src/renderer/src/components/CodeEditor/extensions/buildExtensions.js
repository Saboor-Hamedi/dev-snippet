import buildTheme from './buildTheme'
import { premiumTypingBundle } from './premiumFeatures'

// Pre-load or cache language data to avoid micro-lag during extension rebuilds
let cachedLanguages = null
const getLanguages = async () => {
  if (cachedLanguages) return cachedLanguages
  try {
    const { languages } = await import('@codemirror/language-data')
    cachedLanguages = languages
    return languages
  } catch (e) {
    return []
  }
}

const buildExtensions = async (options, handlers = {}) => {
  const {
    EditorView,
    isDark = false,
    caretColor = '#0f172a',
    fontSize = '14px',
    wordWrap = 'on',
    language = 'markdown',
    isLargeFile = false, // NEW: Flag for large files,
    cursorBlinking = true,
    cursorBlinkingSpeed = 500,
    cursorWidth = 2,
    cursorShape = 'bar',
    snippetTitles = []
  } = options
  const { liveZoomRef, applyZoomToDOM, debouncedSaveZoom, setStoredZoomLevel } = handlers

  const exts = []

  // Debug flag: set `localStorage.disableComplexCM = '1'` in renderer DevTools
  // to run a minimal extension set which avoids DOM-touching optional
  // extensions (drawSelection, dropCursor, imageHandler, etc.). This helps
  // isolate crashes caused by extensions that interact with CodeMirror's DOM
  // lifecycle during rapid updates (paste/scroll).
  const disableComplex =
    typeof window !== 'undefined' &&
    window.localStorage &&
    window.localStorage.getItem('disableComplexCM') === '1'
  if (disableComplex) {
    // Minimal set: theme + basic line numbers + wrapping
    exts.push(buildTheme(EditorView, { isDark, caretColor, fontSize }))
    try {
      const { lineNumbers } = await import('@codemirror/view')
      exts.push(
        lineNumbers({
          formatNumber: (n) => n.toString()
        })
      )
    } catch (e) {}
    if (wordWrap === 'on') exts.push(EditorView.lineWrapping)

    // Allow selectively enabling optional extension groups via localStorage
    // Example: `localStorage.setItem('cmExtras','draw,richMarkdown,image')`
    const extrasStr =
      (typeof window !== 'undefined' &&
        window.localStorage &&
        window.localStorage.getItem('cmExtras')) ||
      ''
    const extras = extrasStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const shouldLoad = (name) => extras.includes(name)

    // Helper loaders for known groups (safe, logged)
    if (shouldLoad('draw')) {
      try {
        const { drawSelection, dropCursor, highlightActiveLine } = await import('@codemirror/view')
        exts.push(drawSelection())
        exts.push(dropCursor())
        exts.push(highlightActiveLine())
        console.info('[CM DEBUG] Loaded draw group')
      } catch (e) {
        console.warn('[CM DEBUG] Failed to load draw group', e)
      }
    }

    if (shouldLoad('history')) {
      try {
        const { history } = await import('@codemirror/commands')
        exts.push(history())
        console.info('[CM DEBUG] Loaded history')
      } catch (e) {
        console.warn('[CM DEBUG] Failed to load history', e)
      }
    }

    if (shouldLoad('bracket')) {
      try {
        const { bracketMatching } = await import('@codemirror/language')
        exts.push(bracketMatching())
        console.info('[CM DEBUG] Loaded bracketMatching')
      } catch (e) {
        console.warn('[CM DEBUG] Failed to load bracketMatching', e)
      }
    }

    if (shouldLoad('markdown') || shouldLoad('richMarkdown')) {
      try {
        if (shouldLoad('richMarkdown')) {
          const { richMarkdownExtension } = await import('./richMarkdown.js')
          exts.push(richMarkdownExtension)
          console.info('[CM DEBUG] Loaded richMarkdown')
        }
        if (shouldLoad('markdown')) {
          const { markdown } = await import('@codemirror/lang-markdown')
          exts.push(markdown({ addKeymap: false }))
          console.info('[CM DEBUG] Loaded markdown')
        }
      } catch (e) {
        console.warn('[CM DEBUG] Failed to load markdown group', e)
      }
    }

    if (shouldLoad('zoom')) {
      try {
        const { keymap } = await import('@codemirror/view')
        const { MIN_ZOOM, MAX_ZOOM } = await import('../../../hook/useZoomLevel.js')
        // Re-use the zoom logic from below (simplified)
        let rafId = null
        const safeApplyZoom = (newZoom) => {
          newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))
          liveZoomRef.current = newZoom
          if (rafId) cancelAnimationFrame(rafId)
          rafId = requestAnimationFrame(() => applyZoomToDOM(newZoom))
          if (debouncedSaveZoom) debouncedSaveZoom(newZoom)
          if (setStoredZoomLevel) setStoredZoomLevel(newZoom)
        }
        const zoomHandler = (change) => {
          safeApplyZoom(liveZoomRef.current + change)
          return true
        }
        const resetZoom = () => {
          safeApplyZoom(1.0)
          return true
        }
        const zoomKeymap = keymap.of([
          { key: 'Ctrl-=', run: () => zoomHandler(0.1) },
          { key: 'Ctrl-+', run: () => zoomHandler(0.1) },
          { key: 'Ctrl-Minus', run: () => zoomHandler(-0.1) },
          { key: 'Ctrl-_', run: () => zoomHandler(-0.1) },
          { key: 'Ctrl-0', run: resetZoom }
        ])
        exts.push(zoomKeymap)
        // console.info('[CM DEBUG] Loaded zoom')
      } catch (e) {
        // console.warn('[CM DEBUG] Failed to load zoom', e)
      }
    }

    return exts
  }

  // THEME & PREMIUM FEEL
  exts.push(buildTheme(EditorView, { isDark, caretColor, fontSize, cursorWidth, cursorShape }))

  // High-performance typing animations (skip for large files)
  if (!isLargeFile) {
    exts.push(...premiumTypingBundle)
  }

  // CORE UI EXTENSIONS (Critical for stability)
  try {
    const { dropCursor, drawSelection, keymap, highlightActiveLine } =
      await import('@codemirror/view')
    const { indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } =
      await import('@codemirror/language')
    const { defaultKeymap, historyKeymap } = await import('@codemirror/commands')
    const { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion } =
      await import('@codemirror/autocomplete')

    exts.push(dropCursor())
    exts.push(drawSelection({ cursorBlinkRate: 0 }))
    exts.push(highlightActiveLine())
    exts.push(indentOnInput())
    exts.push(syntaxHighlighting(defaultHighlightStyle, { fallback: true }))
    exts.push(closeBrackets())
    exts.push(bracketMatching())
    exts.push(autocompletion({ activateOnTyping: true }))

    exts.push(
      keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, ...completionKeymap])
    )
  } catch (e) {
    console.error('Failed to load core extensions', e)
  }

  // HISTORY (Undo/Redo) - Included in keymap above but adding base extension
  try {
    const { history } = await import('@codemirror/commands')
    exts.push(history())
  } catch (e) {}

  // BRACKET MATCHING - Handled in core block above but keeping structure
  /*
  if (!isLargeFile) {
    try {
      const { bracketMatching } = await import('@codemirror/language')
      exts.push(bracketMatching())
    } catch (e) {}
  }
  */

  // Line numbers & Code Folding (Critical UI)
  try {
    const { lineNumbers } = await import('@codemirror/view')
    const { foldGutter, codeFolding } = await import('@codemirror/language')

    exts.push(
      lineNumbers({
        formatNumber: (lineNo) => lineNo.toString(),
        domEventHandlers: {
          mousedown: (view, line, event) => false
        }
      })
    )

    // Code Folding (Disabled for large files)
    if (!isLargeFile) {
      exts.push(codeFolding())
      exts.push(
        foldGutter({
          markerDOM: (open) => {
            const icon = document.createElement('span')
            icon.className = 'cm-fold-marker'
            icon.innerHTML = open ? '▾' : '▸'
            return icon
          }
        })
      )
    }
  } catch (e) {
    console.warn('Failed to load core editor UI extensions (lineNumbers/folding)', e)
  }

  if (String(wordWrap) === 'on' || wordWrap === true) {
    exts.push(EditorView.lineWrapping)
  }

  // DYNAMIC LANGUAGE SUPPORT (The key to robust folding)
  try {
    const allLangs = await getLanguages()
    const langDesc = allLangs.find(
      (l) =>
        l.name.toLowerCase() === language.toLowerCase() ||
        l.alias.some((a) => a.toLowerCase() === language.toLowerCase()) ||
        (l.extensions &&
          l.extensions.some(
            (e) =>
              e.toLowerCase() ===
              (language.startsWith('.') ? language.slice(1) : language).toLowerCase()
          ))
    )

    if (langDesc) {
      try {
        const langSupport = await langDesc.load()
        exts.push(langSupport)
      } catch (e) {}
    }
  } catch (e) {
    console.warn(`Dynamic language load failed for: ${language}`, e)
  }

  // Fallback/Enhancement logic for JSON/Markdown remains
  if (language === 'json') {
    try {
      const { syntaxHighlighting, HighlightStyle } = await import('@codemirror/language')
      const { tags } = await import('@lezer/highlight')

      // GitHub-like Dark Theme Colors for JSON
      const jsonHighlightStyle = HighlightStyle.define([
        { tag: tags.string, color: '#a5d6ff' }, // Light Blue
        { tag: tags.propertyName, color: '#7ee787' }, // Green
        { tag: tags.number, color: '#79c0ff' }, // Blue
        { tag: tags.bool, color: '#ff7b72' }, // Red/Pink
        { tag: tags.keyword, color: '#ff7b72' }, // Red/Pink
        { tag: tags.null, color: '#79c0ff' }, // Blue
        { tag: tags.punctuation, color: '#8b949e' } // Gray
      ])
      exts.push(syntaxHighlighting(jsonHighlightStyle))
    } catch (e) {}
  }

  if (language === 'markdown') {
    try {
      const { markdown } = await import('@codemirror/lang-markdown')
      exts.push(markdown({ addKeymap: true, defaultCodeLanguage: undefined }))

      if (!isLargeFile) {
        try {
          const { wikiLinkCompletionSource } = await import('./wikiLinkCompletion.js')
          const { autocompletion } = await import('@codemirror/autocomplete')
          exts.push(
            autocompletion({
              override: [wikiLinkCompletionSource(snippetTitles)],
              icons: true,
              defaultKeymap: true
            })
          )
        } catch (e) {}
      }
    } catch (e) {}
  }

  return exts
}

export default buildExtensions
