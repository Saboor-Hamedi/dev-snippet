const buildTheme = (EditorView, options = {}) => {
  const { isDark = false, fontSize = 'var(--editor-font-size, 14px)' } = options

  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg, var(--color-bg-primary)) !important',
        color: 'var(--color-text-primary, #0f172a)',
        fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
        fontSize: fontSize,
        lineHeight: '1.6',
        height: '100%',
        transition: 'background-color 140ms ease, color 140ms ease'
      },

      // Dark mode overrides for safety
      '&.cm-editor.dark': {
        backgroundColor: '#0d1117 !important',
        color: '#e6edf3'
      },
      '&.cm-editor.dark .cm-gutters': {
        backgroundColor: 'transparent !important',
        // Force a light color for getters in dark mode regardless of bad vars
        color: '#8b949e !important',
        borderRightColor: '#30363d !important'
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
        boxSizing: 'border-box'
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

      // Active line
      '.cm-activeLine': {
        backgroundColor: 'transparent !important'
      },
      '.cm-activeLineGutter': {
        color: 'var(--color-text-primary, #e2e8f0) !important'
      },

      // Selection match
      '.cm-selectionMatch': {
        backgroundColor: 'var(--selection-match-bg, rgba(128, 128, 128, 0.2)) !important'
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
