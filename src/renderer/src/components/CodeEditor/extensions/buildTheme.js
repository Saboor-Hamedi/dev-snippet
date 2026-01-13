import { EditorView } from '@codemirror/view'

/**
 * buildTheme - Native-performance UI/UX engine for the CodeEditor.
 * Eliminated flex-conflicts to fix "Measure Loop" errors and jittery scrolling.
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
        height: '100% !important',
        backgroundColor: 'var(--editor-bg, transparent) !important',
        color: 'var(--editor-text, var(--color-text-primary, #0f172a))',
        fontFamily: fontFamily,
        fontSize: fontSize,
        lineHeight: '1.6',
        display: 'flex !important',
        flexDirection: 'column !important',
        overflow: 'hidden !important' /* Critical: Editor root should not scroll */
      },
      '.cm-line': {
        padding: '0 4px !important',
        textAlign: 'left'
      },
      // Header Scaling - Obsidian-like experience
      '.cm-line-h1': { 
        fontSize: '2.25rem !important',
        fontWeight: '700 !important', 
        lineHeight: '1.2 !important',
        paddingTop: '1.0em !important',
        paddingBottom: '0.4em !important',
        borderBottom: '1px solid var(--color-border, #30363d) !important'
      },
      '.cm-line-h2': { 
        fontSize: '1.75rem !important', 
        fontWeight: '600 !important', 
        lineHeight: '1.3 !important',
        paddingTop: '0.8em !important',
        paddingBottom: '0.3em !important',
        borderBottom: '1px solid var(--color-border, #30363d) !important'
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
        textAlign: 'left !important'
      },
      '.cm-scroller': {
        display: 'block !important', /* Restore to standard block for stable measurement */
        height: '100% !important',
        overflow: 'auto !important',
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        position: 'relative',
        scrollbarGutter: 'stable !important'
      },
      '.cm-content': {
        maxWidth: 'var(--editor-max-width, 1000px) !important',
        margin: '0 auto !important',
        paddingTop: 'var(--editor-content-padding-top, 60px) !important',
        paddingBottom: '30vh !important',
        fontFamily: 'inherit',
        lineHeight: '1.6',
        fontSize: fontSize,
        caretColor: caretColor,
        boxSizing: 'border-box',
        minHeight: '100% !important' /* Ensures background extends to bottom */
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
        padding: '0',
        transition: 'none !important'
      },
      '.cm-activeLine': {
        backgroundColor: `${cursorActiveLineBg} !important`
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
