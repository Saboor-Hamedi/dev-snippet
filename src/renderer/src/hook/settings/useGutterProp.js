import { useEffect, useCallback } from 'react'
import { useSettings } from '../useSettingsContext'

export const DEFAULT_GUTTER_BG_COLOR = '#232731'
export const DEFAULT_GUTTER_BORDER_COLOR = 'transparent'
export const DEFAULT_GUTTER_BORDER_WIDTH = 1

export const useGutterProp = () => {
  const { getSetting, updateSetting } = useSettings()

  const gutterBgColor = getSetting('gutter.gutterBgColor') ?? DEFAULT_GUTTER_BG_COLOR
  const gutterBorderColor = getSetting('gutter.gutterBorderColor') ?? DEFAULT_GUTTER_BORDER_COLOR
  const gutterBorderWidth = getSetting('gutter.gutterBorderWidth') ?? DEFAULT_GUTTER_BORDER_WIDTH

  const showGutter = getSetting('gutter.showGutter') !== false
  const setShowGutter = useCallback(
    (value) => updateSetting('gutter.showGutter', value),
    [updateSetting]
  )

  const setGutterBgColor = (value) => updateSetting('gutter.gutterBgColor', value)
  const setGutterBorderColor = (value) => updateSetting('gutter.gutterBorderColor', value)
  const setGutterBorderWidth = (value) => updateSetting('gutter.gutterBorderWidth', Number(value))

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--gutter-bg-color', gutterBgColor)
    root.style.setProperty('--gutter-border-color', gutterBorderColor)
    root.style.setProperty('--gutter-border-width', `${gutterBorderWidth}px`)
    root.style.setProperty('--gutter-display', showGutter ? 'block' : 'none')
  }, [gutterBgColor, gutterBorderColor, gutterBorderWidth, showGutter])

  useEffect(() => {
    const handleToggle = () => {
      // Read current value directly from settings to avoid stale closure
      const currentValue = getSetting('gutter.showGutter') !== false
      updateSetting('gutter.showGutter', !currentValue)
    }
    window.addEventListener('app:toggle-gutter', handleToggle)
    return () => window.removeEventListener('app:toggle-gutter', handleToggle)
  }, [getSetting, updateSetting])

  return {
    gutterBgColor,
    setGutterBgColor,
    gutterBorderColor,
    setGutterBorderColor,
    gutterBorderWidth,
    setGutterBorderWidth,
    showGutter,
    setShowGutter
  }
}

export default useGutterProp
