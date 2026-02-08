import { EditorView } from '@codemirror/view'

/**
 * buildTheme - Optimized CM6 Theme Engine
 * Focus: selection precision and layout stability.
 */
const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 13px)',
    fontFamily = 'var(--editor-font-family, monospace)',
    caretColor = 'var(--caret-color, #ffffff)',
    cursorWidth = 2,
    cursorShape = 'bar',
    cursorSelectionBg = 'rgba(88,166,255,0.3)',
    cursorActiveLineBg = 'rgba(255,255,255,0.03)'
  } = options

  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: 'transparent',
        fontSize: fontSize,
        fontFamily: fontFamily,
        outline: 'none'
      },
      '.cm-scroller': {
        display: 'flex !important',
        flexDirection: 'column !important',
        alignItems: 'center !important', /* Critical for Centered Mode */
        overflow: 'auto',
        fontFamily: 'inherit'
      },
      '.cm-content': {
        width: '100%',
        maxWidth: 'var(--editor-max-width, 1000px)',
        padding: '50px 0 30vh 0',
        fontFamily: 'inherit',
        caretColor: caretColor
      },
      '.cm-line': {
        padding: '0 64px', /* Horizontal padding inside lines is safest for CM6 selection */
        textAlign: 'left',
        lineHeight: '1.6'
      },
      '.cm-cursor': {
        borderLeftColor: caretColor,
        borderLeftWidth: cursorShape === 'block' ? '0' : `${cursorWidth}px`,
        backgroundColor: cursorShape === 'block' ? caretColor : 'transparent',
        width: cursorShape === 'block' ? '1ch' : 'auto'
      },
      '.cm-selectionBackground': {
        backgroundColor: `${cursorSelectionBg} !important`
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
        position: 'sticky', /* Ensure gutters don't shift selection */
        left: 0
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
