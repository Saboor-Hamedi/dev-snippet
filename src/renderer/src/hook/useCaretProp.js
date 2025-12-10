import { useSettings } from './useSettingsContext'

const DEFAULT_CARET_WIDTH = 1 // Default caret width in pixels
export const MIN_CARET_WIDTH = 1
export const MAX_CARET_WIDTH = 5
export const DEFAULT_CARET_COLOR = '#fefeffff'

export const useCaretProp = () => {
  const { getSetting, updateSetting } = useSettings()

  //  Get raw value from settings
  let width = getSetting('editor.caretWidth') ?? DEFAULT_CARET_WIDTH
  let color = getSetting('editor.caretColor') ?? DEFAULT_CARET_COLOR

  //  Clamp IMMEDIATELY so invalid JSON never leaks into UI

  width = Math.max(MIN_CARET_WIDTH, Math.min(MAX_CARET_WIDTH, width))

  const setCaretWidth = (value) => {
    const clamped = Math.max(MIN_CARET_WIDTH, Math.min(MAX_CARET_WIDTH, value))
    updateSetting('editor.caretWidth', clamped)
  }

  const setCaretColor = (value) => {
    updateSetting('editor.caretColor', value)
  }

  return { width, setCaretWidth, color, setCaretColor }
}

export default useCaretProp
