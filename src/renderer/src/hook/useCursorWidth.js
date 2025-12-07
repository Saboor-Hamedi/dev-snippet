import { useSettings } from './useSettingsContext'


const DEFAULT_CURSOR_WIDTH = 1 // Default cursor width in pixels
export const MIN_CURSOR_WIDTH = 1
export const MAX_CURSOR_WIDTH = 5

export const useCursorWidth = () => {
  const { getSetting, updateSetting } = useSettings()

  //  Get raw value from settings
  let width = getSetting('editor.cursorWidth') ?? DEFAULT_CURSOR_WIDTH

  //  Clamp IMMEDIATELY so invalid JSON never leaks into UI

  width = Math.max(MIN_CURSOR_WIDTH, Math.min(MAX_CURSOR_WIDTH, width))


  const setCursorWidth = (value) => {
    const clamped = Math.max(MIN_CURSOR_WIDTH, Math.min(MAX_CURSOR_WIDTH, value))
    updateSetting('editor.cursorWidth', clamped)
  }
  return [width, setCursorWidth]
}


export default useCursorWidth