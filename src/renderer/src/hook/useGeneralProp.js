/*
! * src/config/defaultSettings.js
 * In this js file, I will add all the theme for the tiny components used across the app
 * such as WelcomePage, AboutModal, etc.
 * These settings will be stored in the 'welcome' section of the settings.
*/

import { useSettings } from './useSettingsContext'
import { useEffect, useCallback } from 'react'

export const DEFAULT_BG = '#232731' // Back to original default
const useGeneralProp = () => {
  // Function to get a general property
  const { getSetting } = useSettings()

  const welcome = getSetting('welcome.welcomePage') ?? DEFAULT_BG

  // Debounced CSS variable update to prevent excessive DOM updates
  const updateCSSVariable = useCallback((value) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--welcome-bg', value)
    }
  }, [])

  useEffect(() => {
    // Small delay to batch rapid changes (like during theme switching)
    const timeoutId = setTimeout(() => updateCSSVariable(welcome), 10)
    return () => clearTimeout(timeoutId)
  }, [welcome, updateCSSVariable])

  return {
    welcome
  }
}

export default useGeneralProp
