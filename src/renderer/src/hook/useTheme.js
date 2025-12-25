// This handles the DOM manipulation and persistence logic separately.

import { useState, useEffect } from 'react'
import { useSettings } from './useSettingsContext'

export const useTheme = () => {
  // Initialize state based on current settings or DOM
  const { settings } = useSettings()
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'midnight-pro'
    }
    return 'midnight-pro'
  })

  // Keep state in sync with global settings
  useEffect(() => {
    const themeId = settings?.ui?.theme || 'midnight-pro'
    if (themeId !== currentTheme) {
      setCurrentTheme(themeId)
    }
  }, [settings?.ui?.theme])

  const setTheme = (themeId, colors) => {
    setCurrentTheme(themeId)
    document.documentElement.setAttribute('data-theme', themeId)

    // Set dark class for non-light themes
    const lightThemes = ['polaris', 'minimal-gray']
    if (lightThemes.includes(themeId)) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }

    // Let ThemeModal handle all CSS variable setting
    // This function is mainly for state management and persistence
  }

  return { currentTheme, setTheme }
}
