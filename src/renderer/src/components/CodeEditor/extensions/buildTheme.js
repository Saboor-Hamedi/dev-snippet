const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 14px)',
    caretColor = 'var(--caret-color, #ffffff)',
    disableComplexCM = false
  } = options

  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg, var(--color-bg-primary)) !important',
        color: 'var(--color-text-primary, #0f172a)',
        fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
        fontSize: fontSize,
        lineHeight: '1.6',
        height: '100%',
        paddingLeft: '0',
        transition: 'background-color 140ms ease, color 140ms ease'
      },

      /* HIGH-CONTRAST SYNTAX HIGHLIGHTING (RESTORATION) */
      '.cm-string': { color: 'var(--color-accent-primary, #4ade80) !important' },
      '.cm-property, .cm-variableName-2': {
        color: 'var(--color-accent-secondary, #60a5fa) !important'
      },
      '.cm-number': { color: '#f472b6 !important' },
      '.cm-boolean': { color: '#fb923c !important' },
      '.cm-null': { color: '#94a3b8 !important' },
      '.cm-keyword': { color: '#c084fc !important' },
      '.cm-comment': { color: '#64748b !important', fontStyle: 'italic' },
      '.cm-punctuation, .cm-bracket': { color: 'var(--color-text-secondary, #94a3b8) !important' },

      // Hide whitespace/special char highlighting (tabs, spaces, etc) - Global suppression
      '.cm-specialChar, .cm-whitespace, .cm-highlightWhitespace, .cm-tab': {
        color: 'inherit !important',
        backgroundColor: 'transparent !important',
        textDecoration: 'none !important',
        opacity: '1 !important',
        backgroundImage: 'none !important'
      },
      // Ensure specific suppression inside code contexts
      '.cm-content *': {
        '&.cm-whitespace, &.cm-tab, &.cm-specialChar': {
          color: 'inherit !important',
          backgroundColor: 'transparent !important',
          display: 'inline !important'
        }
      },

      // Table Row Background (Full-width via line decoration)
      '.cm-md-table-row': {
        backgroundColor: 'rgba(88, 166, 255, 0.05)'
      },

      // Custom Markdown Elements (Inline decorations)
      '.cm-wikilink': {
        color: '#58a6ff !important',
        textDecoration: 'underline'
      },
      '.cm-mention, .cm-hashtag': {
        color: '#d2a8ff !important',
        backgroundColor: 'rgba(210, 168, 255, 0.1)',
        padding: '0 2px',
        borderRadius: '3px'
      },

      // Dark mode overrides for safety
      '&.cm-editor.dark': {
        backgroundColor: 'var(--editor-bg, #0d1117) !important',
        color: 'var(--editor-text, #e6edf3)'
      },

      '&.cm-editor.dark .cm-gutters': {
        backgroundColor: 'transparent !important',
        // Force a light color for getters in dark mode regardless of bad vars
        color: 'var(--gutter-text-color, #8b949e) !important',
        borderRightColor: 'var(--gutter-border-color, #30363d) !important'
      },

      '.cm-scroller': {
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        overflow: 'auto',
        minWidth: '100%',
        height: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      },

      /* Custom Scrollbars */
      '.cm-scroller::-webkit-scrollbar': {
        width: '12px',
        height: '12px'
      },
      '.cm-scroller::-webkit-scrollbar-track': {
        backgroundColor: 'transparent'
      },
      '.cm-scroller::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--color-scrollbar-thumb, rgba(121, 121, 121, 0.4))',
        borderRadius: '6px',
        border: '3px solid transparent',
        backgroundClip: 'content-box'
      },
      '.cm-scroller::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'var(--color-scrollbar-thumb-hover, rgba(121, 121, 121, 0.7))'
      },
      '.cm-scroller::-webkit-scrollbar-corner': {
        backgroundColor: 'transparent'
      },

      '.cm-content': {
        backgroundColor: 'transparent',
        padding: '12px',
        fontFamily: 'inherit',
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        caretColor: caretColor
      },

      '.cm-cursor': {
        borderLeftColor: caretColor,
        borderLeftWidth: 'var(--caret-width, 2px)',
        // Premium Glow Effect
        boxShadow: disableComplexCM ? 'none' : '0 0 5px var(--caret-color)'
      },

      '.cm-gutters': {
        backgroundColor: 'var(--gutter-bg-color, transparent) !important',
        color: 'var(--color-text-secondary, #64748b)',
        borderRight:
          'var(--gutter-border-width, 1px) solid var(--gutter-border-color, transparent) !important',
        fontFamily: 'inherit',
        minWidth: '3em',
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        padding: '0 0.2em'
      },
      '.cm-gutterElement': {
        background: 'transparent !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        textAlign: 'center !important',
        padding: '0 !important',
        minWidth: '100%'
      },

      // Active line - Handled here strictly
      '.cm-activeLine': {
        // Use box-shadow for the border effect to avoid layout issues/clipping
        boxShadow: disableComplexCM
          ? 'none !important'
          : 'inset var(--active-line-border-width, 0px) 0 0 0 var(--caret-color, #ffffff) !important',
        backgroundColor: disableComplexCM
          ? 'transparent !important'
          : 'var(--active-line-bg) !important'
      },
      '.cm-activeLineGutter': {
        color: 'var(--color-text-primary, #e2e8f0) !important',
        backgroundColor: 'transparent !important',
        borderLeft: disableComplexCM
          ? 'none !important'
          : 'var(--active-line-gutter-border-width, 0px) solid var(--caret-color, #ffffff) !important'
      },

      // Selection match
      '.cm-selectionMatch': {
        backgroundColor: disableComplexCM
          ? 'transparent !important'
          : 'var(--selection-match-bg, rgba(128, 128, 128, 0.2)) !important',
        outline: disableComplexCM ? '1px solid var(--color-accent-primary)' : 'none'
      },
      '.cm-matchingBracket': {
        backgroundColor: 'transparent !important',
        borderBottom: '1px solid var(--color-text-primary)'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
