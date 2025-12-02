// This handles the DOM manipulation and persistence logic separately.

import { useState, useEffect } from 'react'

export const useTheme = () => {
  // Initialize state based on current DOM or LocalStorage
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark'
    }
    return 'dark'
  })

  const setTheme = (themeId, colors) => {
    setCurrentTheme(themeId)
    document.documentElement.setAttribute('data-theme', themeId)
    
    // Set dark class for non-light themes
    if (themeId === 'polaris') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    
    // Let ThemeModal handle all CSS variable setting
    // This function is mainly for state management and persistence
    console.log('🎨 Theme set to:', themeId)
  }

  return { currentTheme, setTheme }
}
