/**
 * useFontSettings.js
 * Manages editor and preview typography settings.
 * Refactored to remove caret logic (now in useCursorProp).
 */
import { useEffect } from 'react'
import { useSettings } from '../useSettingsContext'

export const DEFAULT_FONT_FAMILY = 'JetBrains Mono'
export const DEFAULT_FONT_SIZE = 14

export const useFontSettings = () => {
  const { getSetting, updateSetting } = useSettings()

  // 1. Resolve values
  const editorFontFamily = getSetting('editor.fontFamily') || DEFAULT_FONT_FAMILY
  const editorFontSize = getSetting('editor.fontSize') || DEFAULT_FONT_SIZE
  const previewFontFamily = getSetting('ui.previewFontFamily') || editorFontFamily
  const previewFontSize = getSetting('ui.previewFontSize') || DEFAULT_FONT_SIZE

  // 2. Setters
  const updateEditorFontFamily = (f) => updateSetting('editor.fontFamily', f)
  const updateEditorFontSize = (s) => updateSetting('editor.fontSize', Number(s))
  const updatePreviewFontFamily = (f) => updateSetting('ui.previewFontFamily', f)
  const updatePreviewFontSize = (s) => updateSetting('ui.previewFontSize', Number(s))

  // 3. Global CSS Variable Management
  useEffect(() => {
    const root = document.documentElement
    // Standardize to rem for better scaling
    root.style.setProperty('--editor-font-size', `${editorFontSize / 16}rem`)
    root.style.setProperty('--editor-font-family', editorFontFamily)
    root.style.setProperty('--preview-font-size', `${previewFontSize / 16}rem`)
    root.style.setProperty('--preview-font-family', previewFontFamily)
  }, [editorFontFamily, editorFontSize, previewFontFamily, previewFontSize])

  return {
    editorFontFamily,
    editorFontSize,
    previewFontFamily,
    previewFontSize,
    updateEditorFontFamily,
    updateEditorFontSize,
    updatePreviewFontFamily,
    updatePreviewFontSize
  }
}

export default useFontSettings
