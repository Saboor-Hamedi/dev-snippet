import { useEffect, useRef } from 'react'
import { themeProps } from '../components/preference/theme/themeProps'
import { useSettings } from './useSettingsContext'

export const useThemeManager = () => {
  const { setTheme, currentThemeId } = themeProps()
  const { settings } = useSettings()

  // Keep track of settings to detect deep changes if needed,
  // though generally a simple dependency on the settings object works
  // if the context provides a new object reference on change.
  const prevSettingsRef = useRef(settings)
  const prevThemeIdRef = useRef(currentThemeId)

  useEffect(() => {
    // Always apply theme on mount or when dependencies change
    // The previous logic skipped valid initial application
    setTheme(currentThemeId)
    prevSettingsRef.current = settings
    prevThemeIdRef.current = currentThemeId
  }, [currentThemeId, settings, setTheme])
}
