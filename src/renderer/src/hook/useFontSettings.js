import { useEffect, useState } from 'react'
import { useSettings } from './useSettingsContext'

export const useFontSettings = () => {
  const { settings, updateSetting } = useSettings()

  // Read from settings with fallbacks
  const editorFontFamily = settings.editor?.fontFamily || 'JetBrains Mono'
  const editorFontSize = settings.editor?.fontSize || 14

  // These might not be in default settings yet, so we handle them gracefully
  const previewFontFamily = settings.ui?.previewFontFamily || editorFontFamily
  const previewFontSize = settings.ui?.previewFontSize || 14
  const caretStyle = settings.editor?.caretStyle || 'bar'
  const caretWidth = settings.editor?.caretWidth || '3px'

  const updateEditorFontFamily = (f) => {
    updateSetting('editor.fontFamily', f)
  }

  const updateEditorFontSize = (s) => {
    const n = typeof s === 'number' ? s : parseInt(s, 10)
    updateSetting('editor.fontSize', n)
  }

  const updatePreviewFontFamily = (f) => {
    updateSetting('ui.previewFontFamily', f)
  }

  const updatePreviewFontSize = (s) => {
    const n = typeof s === 'number' ? s : parseInt(s, 10)
    updateSetting('ui.previewFontSize', n)
  }

  const updateCaretWidth = (s) => {
    const val = String(s).endsWith('px') ? s : `${s}px`
    updateSetting('editor.caretWidth', val)
    document.documentElement.style.setProperty('--caret-width', val)
  }

  const updateCaretStyle = (style) => {
    updateSetting('editor.caretStyle', style)
    document.documentElement.style.setProperty('--caret-style', style)
  }

  // Apply CSS variables for preview and caret (editor font is handled by useSettingsContext)
  useEffect(() => {
    const root = document.documentElement
    const pSizeRem = `${previewFontSize / 16}rem`

    root.style.setProperty('--preview-font-family', previewFontFamily)
    root.style.setProperty('--preview-font-size', pSizeRem)
    root.style.setProperty('--caret-width', caretWidth)
    root.style.setProperty('--caret-style', caretStyle)
  }, [previewFontFamily, previewFontSize, caretWidth, caretStyle])

  return {
    editorFontFamily,
    editorFontSize,
    previewFontFamily,
    previewFontSize,
    caretStyle,
    caretWidth,
    updateEditorFontFamily,
    updateEditorFontSize,
    updatePreviewFontFamily,
    updatePreviewFontSize,
    updateCaretWidth,
    updateCaretStyle
  }
}

export default useFontSettings
