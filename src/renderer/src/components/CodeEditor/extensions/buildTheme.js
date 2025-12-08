import { EditorView } from '@codemirror/view'

const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 14px)',
    caretColor = 'var(--caret-color, #0f172a)'
  } = options

  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg, var(--color-bg-primary)) !important',
        color: 'var(--color-text-primary, #0f172a)',
        fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
        lineHeight: '1.6',
        height: '100%',
        transition: 'background-color 140ms ease, color 140ms ease'
      },

      '.cm-scroller': {
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        overflow: 'auto',
        minWidth: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex !important',
        flexDirection: 'row !important', // Ensure gutters and content are side-by-side if that's the structure, or just let CM handle it.
        // Actually, CM6 structure is usually Gutters + Content inside Scroller? No, Gutters are often separate or inside.
        // Let's stick to standard properties but ensure height is passed down.
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
        fontSize: `calc(${fontSize} * var(--zoom-level, 1))`,
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        flex: '1 1 auto'
      },

      '.cm-gutters': {
        backgroundColor: 'var(--color-bg-secondary, var(--color-bg-primary)) !important',
        color: 'var(--color-text-secondary, #64748b)',
        borderRight: '1px solid var(--color-border, #e2e8f0)',
        fontFamily: 'inherit',
        // Use a slightly larger base width for better breathing room
        minWidth: `calc(45px * var(--zoom-level, 1))`,
        fontSize: `calc(${fontSize} * var(--zoom-level, 1))`,
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        paddingRight: '4px'
      },
      '.cm-gutterElement': {
        background: 'transparent !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        padding: '0 4px !important'
      },

      '.cm-activeLine': {
        backgroundColor: 'var(--active-line-bg, rgba(125, 125, 125, 0.1)) !important'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent !important',
        color: 'var(--color-text-primary, #e2e8f0) !important'
      },

      '.cm-selectionMatch': {
        backgroundColor: 'transparent !important'
      },

      '.cm-selectionBackground': {
        backgroundColor: 'var(--selection-bg, rgba(197, 204, 217, 0.4)) !important'
      },

      '.cm-cursor': {
        borderLeft: 'var(--caret-width, 2px) solid var(--caret-color, #0f172a) !important'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
