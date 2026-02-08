import { EditorView } from '@codemirror/view'

/**
 * buildTheme - Native-performance UI/UX engine for the CodeEditor.
 * STABILITY FIRST: Reverted to standard CodeMirror block layout to fix virtualization/scrolling bugs.
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
        height: '100% !important',
        backgroundColor: 'transparent !important',
        fontSize: fontSize,
        fontFamily: fontFamily,
        outline: 'none'
      },
      '.cm-scroller': {
        display: 'block !important', /* Restore standard block for correct measurement */
        height: '100% !important',
        overflow: 'auto !important',
        fontFamily: 'inherit',
        scrollbarGutter: 'stable',
        position: 'relative'
      },
      '.cm-content': {
        margin: '0 auto !important', /* Centering logic restored to content-margin */
        maxWidth: 'var(--editor-max-width, 1000px)',
        paddingTop: '60px !important',
        paddingBottom: '30vh !important',
        fontFamily: 'inherit',
        lineHeight: '1.6',
        caretColor: caretColor,
        boxSizing: 'border-box',
        minHeight: '100%'
      },
      '.cm-line': {
        paddingLeft: '64px !important', /* Stable internal padding */
        paddingRight: '64px !important',
        textAlign: 'left'
      },
      '.cm-cursor': {
        borderLeftColor: caretColor,
        borderLeftWidth: cursorShape === 'block' ? '0' : `${cursorWidth}px`,
        backgroundColor: cursorShape === 'block' ? caretColor : 'transparent',
        width: cursorShape === 'block' ? '1ch' : 'auto',
        opacity: cursorShape === 'block' ? '0.6' : '1'
      },
      '.cm-gutters': {
        backgroundColor: 'transparent !important',
        border: 'none !important',
        color: 'var(--color-text-tertiary)',
        fontFamily: 'inherit'
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent !important' /* Pure Dark look: body highlight removed */
      },
      '.cm-selectionBackground': {
        backgroundColor: `${cursorSelectionBg} !important`
      },
      '.cm-tooltip-layer': {
        zIndex: '100000'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
