/**
 * useGeneralProp.js
 * Manages general application-wide appearance settings.
 */
import { useSettings } from '../useSettingsContext'
import { useEffect, useCallback } from 'react'

export const DEFAULT_BG = '#232731'

export const useGeneralProp = () => {
  const { getSetting } = useSettings()

  const welcome = getSetting('welcome.welcomePage') ?? DEFAULT_BG

  // Apply to CSS variables
  const updateCSSVariable = useCallback((value) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--welcome-bg', value)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => updateCSSVariable(welcome), 10)
    return () => clearTimeout(timeoutId)
  }, [welcome, updateCSSVariable])

  return {
    welcomeBg: welcome
  }
}

export default useGeneralProp
