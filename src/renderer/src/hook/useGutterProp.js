import { useSettings } from './useSettingsContext'
export const DEFAULT_GUTTER_BG_COLOR = '#232731'
export const DEFAULT_GUTTER_BORDER_COLOR = 'transparent'
export const DEFAULT_GUTTER_BORDER_WIDTH = 1
export const MIN_GUTTER_BORDER_WIDTH = 1
export const MAX_GUTTER_BORDER_WIDTH = 5
const useGutterProp = () => {
  const { getSetting, updateSetting } = useSettings()
  const gutterBgColor = getSetting('gutter.gutterBgColor') ?? DEFAULT_GUTTER_BG_COLOR

  const setGutterBgColor = (value) => {
    updateSetting('gutter.gutterBgColor', value)
  }

  const gutterBorderColor = getSetting('gutter.gutterBorderColor') ?? DEFAULT_GUTTER_BORDER_COLOR

  const setGutterBorderColor = (value) => {
    updateSetting('gutter.gutterBorderColor', value)
  }

  const rawWidth = getSetting('gutter.gutterBorderWidth') ?? DEFAULT_GUTTER_BORDER_WIDTH

  const gutterBorderWidth = Math.max(
    MIN_GUTTER_BORDER_WIDTH,
    Math.min(MAX_GUTTER_BORDER_WIDTH, Number(rawWidth))
  )

  const setGutterBorderWidth = (value) => {
    const clamped = Math.max(MIN_GUTTER_BORDER_WIDTH, Math.min(MAX_GUTTER_BORDER_WIDTH, value))
    updateSetting('gutter.gutterBorderWidth', clamped)
  }

  return {
    gutterBgColor,
    setGutterBgColor,
    gutterBorderColor,
    setGutterBorderColor,
    gutterBorderWidth,
    setGutterBorderWidth
  }
}

export default useGutterProp
