import { useSettings } from './useSettingsContext'
import { clamp, roundTo } from './useRoundedClamp.js'
import { useEffect } from 'react'
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

  const gutterBorderWidth = clamp(
    roundTo(rawWidth, 1),
    MIN_GUTTER_BORDER_WIDTH,
    MAX_GUTTER_BORDER_WIDTH
  )

  const setGutterBorderWidth = (value) => {
    const clamped = clamp(roundTo(value, 1), MIN_GUTTER_BORDER_WIDTH, MAX_GUTTER_BORDER_WIDTH)
    updateSetting('gutter.gutterBorderWidth', clamped)
  }

  // Apply CSS variables to override theme defaults
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--gutter-bg-color', gutterBgColor)
      document.documentElement.style.setProperty('--gutter-border-color', gutterBorderColor)
      document.documentElement.style.setProperty('--gutter-border-width', `${gutterBorderWidth}px`)
    }
  }, [gutterBgColor, gutterBorderColor, gutterBorderWidth])

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
