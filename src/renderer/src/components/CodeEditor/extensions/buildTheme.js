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
        paddingLeft: '0' /* Safety padding for measurements */,
        transition: 'background-color 140ms ease, color 140ms ease'
      },

      // Dark mode overrides for safety
      '&.cm-editor.dark': {
        backgroundColor: 'var(--editor-bg, #0d1117) !important',
        color: 'var(--editor-text, #e6edf3) !important'
      },

      // Force monochrome for Minimal Gray theme to ensure "Pitch Black" editor text
      // (Overrides syntax highlighting colors)
      'html[data-theme="minimal-gray"] & .cm-content *': {
        color: 'inherit !important'
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
