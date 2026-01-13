import { EditorView } from '@codemirror/view'

/**
 * buildTheme - Optimized UI/UX engine for the CodeEditor.
 * Ensures 100% height, aggressive layout stability, and custom cursor shadow support.
 */
const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 14px)',
    fontFamily = 'var(--editor-font-family, "Outfit", "Inter", sans-serif)',
    caretColor = 'var(--caret-color, #ffffff)',
    cursorWidth = 2,
    cursorShape = 'bar',
    cursorShadowBoxColor = 'var(--shadow-box-bg, var(--caret-color))',
    cursorActiveLineBg = 'var(--active-line-bg, transparent)',
    cursorSelectionBg = 'rgba(88,166,255,0.28)',
    disableComplexCM = false
  } = options

  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg, transparent) !important',
        color: 'var(--editor-text, var(--color-text-primary, #0f172a))',
        fontFamily: fontFamily,
        fontSize: fontSize,
        lineHeight: '1.6',
        height: '100% !important',
        minHeight: '100% !important',
        paddingLeft: '0',
        textAlign: 'left',
        transition: 'none !important',
        overflow: 'visible !important'
      },
      '.cm-line': {
        textAlign: 'left',
        padding: '0 4px !important'
      },
      // Header Scaling - Obsidian-like experience
      '.cm-line-h1': { 
        fontSize: '2.25rem !important', // Use absolute rem/em scaling
        fontWeight: '700 !important', 
        lineHeight: '1.2 !important',
        paddingTop: '1.2em !important',
        paddingBottom: '0.4em !important'
      },
      '.cm-line-h2': { 
        fontSize: '1.75rem !important', 
        fontWeight: '600 !important', 
        lineHeight: '1.3 !important',
        paddingTop: '1.0em !important',
        paddingBottom: '0.3em !important'
      },
      '.cm-line-h3': { 
        fontSize: '1.4rem !important', 
        fontWeight: '600 !important', 
        lineHeight: '1.4 !important'
      },
      '.cm-line-h4': { 
        fontSize: '1.2rem !important', 
        fontWeight: '600 !important' 
      },
      '.cm-line-h1, .cm-line-h2, .cm-line-h3, .cm-line-h4, .cm-line-h5, .cm-line-h6': {
        textAlign: 'left !important',
        transition: 'none !important'
      },
      '.cm-scroller': {
        display: 'block !important',
        height: '100% !important',
        minHeight: '100% !important',
        overflow: 'auto !important',
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        minWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      },
      '.cm-content': {
        width: '100%',
        minHeight: '100% !important',
        maxWidth: 'var(--editor-max-width, 1000px) !important',
        margin: '0 auto !important',
        marginRight: 'auto',
        backgroundColor: 'transparent',
        paddingTop: '60px !important', // Substantial gap at top to ensure content is never hidden
        paddingBottom: '20vh !important',
        position: 'relative',
        fontFamily: 'inherit',
        lineHeight: '1.6',
        fontSize: fontSize,
        boxSizing: 'border-box',
        caretColor: caretColor
      },
      '.cm-cursor': {
        borderLeftColor: `${caretColor} !important`,
        borderLeftWidth:
          cursorShape === 'block' || cursorShape === 'underline'
            ? '0px !important'
            : `${cursorWidth}px !important`,
        borderBottom:
          cursorShape === 'underline' ? `${cursorWidth}px solid ${caretColor}` : 'none',
        backgroundColor: cursorShape === 'block' ? `${caretColor} !important` : 'transparent',
        width: cursorShape === 'block' || cursorShape === 'underline' ? '1ch !important' : '0px',
        opacity: cursorShape === 'block' ? '0.6 !important' : '1',
        display: 'block',
        boxShadow:
          disableComplexCM || cursorShape === 'block' || cursorShape === 'underline'
            ? 'none'
            : `0 0 12px 1px ${cursorShadowBoxColor} !important`,
        transition: 'none !important'
      },
      '.cm-gutters': {
        backgroundColor: 'transparent !important',
        color: 'var(--color-text-secondary, #64748b)',
        borderRight: 'var(--gutter-border-width, 1px) solid var(--gutter-border-color, transparent) !important',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        padding: '0',
        transition: 'none !important'
      },
      '.cm-activeLine': {
        boxShadow: 'none !important',
        backgroundColor: `${cursorActiveLineBg} !important`,
        transition: 'none !important'
      },
      '.cm-selectionBackground': {
        display: 'none !important'
      },
      '& ::selection, .cm-content ::selection': {
        backgroundColor: 'transparent !important'
      },
      '.cm-tooltip-layer': {
        zIndex: '100000 !important'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
