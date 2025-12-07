import { useSettings } from './useSettingsContext'


const DEFAULT_CARET_WIDTH = 1 // Default caret width in pixels
export const MIN_CARET_WIDTH = 1
export const MAX_CARET_WIDTH = 5

export const useCaretWidth = () => {
  const { getSetting, updateSetting } = useSettings()

  //  Get raw value from settings
  let width = getSetting('editor.caretWidth') ?? DEFAULT_CARET_WIDTH

  //  Clamp IMMEDIATELY so invalid JSON never leaks into UI

  width = Math.max(MIN_CARET_WIDTH, Math.min(MAX_CARET_WIDTH, width))

  const setCaretWidth = (value) => {
    const clamped = Math.max(MIN_CARET_WIDTH, Math.min(MAX_CARET_WIDTH, value))
    updateSetting('editor.caretWidth', clamped)
  }
  return [width, setCaretWidth]
}


export default useCaretWidth