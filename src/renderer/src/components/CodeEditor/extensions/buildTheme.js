import { EditorView } from '@codemirror/view'

const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 14px)',
    caretColor = 'var(--caret-color, #fefeffff)'
  } = options

  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg, var(--color-bg-primary)) !important',
        color: 'var(--color-text-primary, #0f172a)',
        fontFamily: 'var(--editor-font-family, "JetBrains Mono")',
        fontSize: `calc(${fontSize} * var(--zoom-level, 1))`, // MOVED HERE
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
        // fontSize: `calc(${fontSize} * var(--zoom-level, 1))`, // REMOVED
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        flex: '1 1 auto'
      },

      '.cm-gutters': {
        backgroundColor: 'transparent !important',
        color: 'var(--color-text-secondary, #64748b)',
        borderRight: 'none !important',
        fontFamily: 'inherit',
        // Use em units for stable scaling with font size
        minWidth: '3em',
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        padding: '0 0.2em', // Scalable padding
        // backgroundColor: '#e11717ff !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important'
      },
      '.cm-gutterElement': {
        background: 'transparent !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        textAlign: 'center !important',
        padding: '0 !important', // Remove element padding, let gutter handle spacing
        minWidth: '100%' // Ensure it fills the gutter to center properly
      },

      // Active line
      '.cm-activeLine': {
        // backgroundColor: 'var(--active-line-bg, rgba(125, 125, 125, 0.1)) !important'
        backgroundColor: 'transparent !important'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent !important',
        color: 'var(--color-text-primary, #e2e8f0) !important'
      },

      // Selection match
      '.cm-selectionMatch': {
        backgroundColor: 'var(--selection-match-bg, rgba(128, 128, 128, 0.2)) !important'
      },
      '.cm-matchingBracket': {
        backgroundColor: 'transparent !important',
        borderBottom: '1px solid var(--color-text-primary)'
      },

      // Selection background
      '.cm-selectionBackground': {
        backgroundColor: 'var(--selection-bg, rgba(197, 204, 217, 0.4)) !important'
      },

      '.cm-cursor': {
        borderLeft: 'var(--caret-width, 3px) solid var(--caret-color, #fefeffff) !important'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
