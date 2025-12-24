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
    // Initial apply and re-apply on change
    // We check if values actually changed to avoid unnecessary re-paints (though applyTheme is optimized)
    const settingsChanged = prevSettingsRef.current !== settings
    const themeChanged = prevThemeIdRef.current !== currentThemeId

    if (settingsChanged || themeChanged) {
      setTheme(currentThemeId)
      prevSettingsRef.current = settings
      prevThemeIdRef.current = currentThemeId
    }
  }, [currentThemeId, settings, setTheme])
}
