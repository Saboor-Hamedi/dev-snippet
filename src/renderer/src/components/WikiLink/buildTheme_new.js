import { EditorView } from '@codemirror/view'

/**
 * buildTheme - Primary UI/UX engine for the CodeEditor.
 * Responsible for all visual state including dark mode toggles, custom carets,
 * and high-stability layout definitions.
 */
const buildTheme = (EditorView, options) => {
  const {
    isDark = false,
    caretColor = 'var(--caret-color, #ffffff)',
    fontSize = '14px',
    fontFamily = 'inherit',
    cursorWidth = 2,
    cursorShadowBoxColor,
    cursorActiveLineBg = 'transparent',
    cursorShape = 'bar',
    cursorSelectionBg = 'rgba(88, 166, 255, 0.3)',
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
        transition: 'none !important'
      },
      '.cm-line': {
        textAlign: 'left'
      },
      '.cm-content': {
        minHeight: '100% !important',
        paddingBottom: '20vh !important' /* Obsidian-like overscroll */
      },
      '.cm-scroller': {
        display: 'flex !important',
        height: '100% !important',
        minHeight: '100% !important',
        overflow: 'auto !important',
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        minWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        scrollbarGutter: 'stable !important'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
