/**
 * useGutterProp.js
 * Manages editor gutter appearance settings.
 */
import { useEffect } from 'react'
import { useSettings } from '../useSettingsContext'

export const DEFAULT_GUTTER_BG_COLOR = '#232731'
export const DEFAULT_GUTTER_BORDER_COLOR = 'transparent'
export const DEFAULT_GUTTER_BORDER_WIDTH = 1

export const useGutterProp = () => {
  const { getSetting, updateSetting } = useSettings()

  const gutterBgColor = getSetting('gutter.gutterBgColor') ?? DEFAULT_GUTTER_BG_COLOR
  const gutterBorderColor = getSetting('gutter.gutterBorderColor') ?? DEFAULT_GUTTER_BORDER_COLOR
  const gutterBorderWidth = getSetting('gutter.gutterBorderWidth') ?? DEFAULT_GUTTER_BORDER_WIDTH

  const setGutterBgColor = (value) => updateSetting('gutter.gutterBgColor', value)
  const setGutterBorderColor = (value) => updateSetting('gutter.gutterBorderColor', value)
  const setGutterBorderWidth = (value) => updateSetting('gutter.gutterBorderWidth', Number(value))

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--gutter-bg-color', gutterBgColor)
    root.style.setProperty('--gutter-border-color', gutterBorderColor)
    root.style.setProperty('--gutter-border-width', `${gutterBorderWidth}px`)
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
