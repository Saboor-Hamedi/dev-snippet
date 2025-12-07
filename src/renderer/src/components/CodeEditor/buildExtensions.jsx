const buildExtensions = async () => {
  const isDark =
    document.documentElement.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark'

  // THEME DEFINITION with improved wrapped line support
  const themeExt = EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--color-bg-primary, #ffffff)',
        color: 'var(--color-text-primary, #0f172a)',
        fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
        fontSize: 'calc(var(--editor-font-size, 14px) * var(--zoom-level, 1))',
        height: '100%',
        transition: 'none'
      },
      '.cm-scroller': {
        fontFamily: 'inherit',
        overflowX: 'hidden',
        lineHeight: '1.5' // Add consistent line height
      },
      '.cm-content': {
        fontFamily: 'inherit',
        padding: '12px 0 12px 12px',
        lineHeight: '1.5'
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-bg-secondary, #64748b)',
        color: 'var(--color-text-secondary, #64748b)',
        borderRight: '1px solid var(--color-border, #e2e8f0)',
        fontFamily: 'inherit',
        minWidth: '40px',
        height: 'auto' // Allow gutter to expand
      },
      '.cm-gutter': {
        minHeight: '100%' // Ensure gutter fills height
      },
      '.cm-gutterElement': {
        display: 'flex',
        alignItems: 'flex-start', // Align to top for wrapped lines
        justifyContent: 'flex-end',
        paddingRight: '10px',
        minHeight: 'calc(1.5em * var(--zoom-level, 1))', // Match line height with zoom
        lineHeight: '1.5'
      },
      '.cm-line': {
        padding: '2px 0', // Add vertical padding for wrapped lines
        lineHeight: '1.5',
        minHeight: '1.5em' // Ensure minimum height
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--color-bg-tertiary, rgba(248, 250, 252, 0.8))'
      },
      // Special handling for wrapped lines
      '.cm-lineWrapped': {
        paddingTop: '0.2em',
        paddingBottom: '0.2em'
      }
    },
    { dark: isDark }
  )

  const exts = [themeExt]

  // Add line numbers BEFORE word wrap for proper ordering
  const lineNumbersExtension = lineNumbers({
    formatNumber: (lineNo) => lineNo.toString(),
    domEventHandlers: {
      mousedown: (view, line, event) => {
        // Allow default selection behavior
        return false
      }
    }
  })
  exts.push(lineNumbersExtension)

  // Word wrap configuration
  if (settingsManager.get('editor.wordWrap') === 'on' || wordWrap === 'on') {
    exts.push(EditorView.lineWrapping)

    // Additional styling specifically for wrapped content
    const wrapTheme = EditorView.theme({
      '.cm-line': {
        whiteSpace: 'pre-wrap',
        wordBreak: 'normal',
        overflowWrap: 'anywhere'
      },
      '.cm-content': {
        whiteSpace: 'pre-wrap'
      }
    })
    exts.push(wrapTheme)
  }

  // KEYBOARD SHORTCUTS (keep your existing code)
  const zoomHandler = (change) => {
    const current = liveZoomRef.current
    const newZoom = Math.min(Math.max(current + change, MIN_ZOOM), MAX_ZOOM)

    liveZoomRef.current = newZoom
    applyZoomToDOM(newZoom)
    debouncedSaveZoom(newZoom)
    return true
  }

  const zoomKeymap = keymap.of([
    { key: 'Ctrl-=', run: () => zoomHandler(0.1) },
    { key: 'Ctrl-Minus', run: () => zoomHandler(-0.1) },
    {
      key: 'Ctrl-0',
      run: () => {
        liveZoomRef.current = 1.0
        applyZoomToDOM(1.0)
        debouncedSaveZoom(1.0)
        return true
      }
    },
    { key: 'Cmd-=', run: () => zoomHandler(0.1) },
    { key: 'Cmd-Minus', run: () => zoomHandler(-0.1) },
    {
      key: 'Cmd-0',
      run: () => {
        liveZoomRef.current = 1.0
        applyZoomToDOM(1.0)
        debouncedSaveZoom(1.0)
        return true
      }
    }
  ])
  exts.push(zoomKeymap)

  // MOUSE WHEEL HANDLER (keep your existing code)
  const mouseWheelZoomExtension = EditorView.domEventHandlers({
    wheel: (event, view) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()

        const step = event.deltaY < 0 ? 0.1 : -0.1
        let newZoom = liveZoomRef.current + step

        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

        if (Math.abs(newZoom - liveZoomRef.current) < 0.001) return true

        liveZoomRef.current = newZoom
        applyZoomToDOM(newZoom)
        debouncedSaveZoom(newZoom)

        return true
      }
      return false
    }
  })
  exts.push(mouseWheelZoomExtension)

  // Load Language (keep your existing code)
  try {
    const langDef = getLanguage(language)
    if (langDef && langDef.import) {
      const langExt = await langDef.import()
      if (langExt) exts.push(langExt)
    }
  } catch (err) {
    console.error('Error loading language extension:', err)
  }

  return exts
}
