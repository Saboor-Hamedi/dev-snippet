import { EditorView } from '@codemirror/view'

/**
 * buildTheme - Aggressive version to ensure 100% height and no clipping.
 */
const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 12px)',
    fontFamily = 'var(--editor-font-family, "Outfit", "Inter", sans-serif)',
    caretColor = 'var(--caret-color, #ffffff)',
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
        display: 'flex !important',
        flexDirection: 'column !important',
        paddingLeft: '0',
        textAlign: 'left',
        transition: 'none !important',
        /* Ensure tooltips are NOT clipped by the editor boundary if possible */
        overflow: 'visible !important' 
      },
      '.cm-scroller': {
        display: 'flex !important',
        flexDirection: 'column !important',
        flex: '1 0 auto !important',
        height: '100% !important',
        minHeight: '100% !important',
        overflow: 'auto !important',
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        minWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        scrollbarGutter: 'stable !important'
      },
      '.cm-content': {
        width: '100%',
        flex: '1 0 auto !important',
        minHeight: '100% !important',
        maxWidth: 'var(--editor-max-width, 1000px) !important',
        margin: '0 auto !important',
        backgroundColor: 'transparent',
        paddingBottom: '20vh !important',
        position: 'relative',
        fontFamily: 'inherit',
        lineHeight: '1.6',
        fontSize: fontSize,
        boxSizing: 'border-box',
        caretColor: caretColor
      },
      '.cm-tooltip-layer': {
        zIndex: '100000 !important'
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
