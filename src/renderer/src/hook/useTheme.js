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

  const setTheme = (themeId) => {
    setCurrentTheme(themeId)

    // 1. Update DOM Attribute
    document.documentElement.setAttribute('data-theme', themeId)

    // 2. Handle Tailwind 'dark' class
    if (themeId === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }

    // 3. Clear custom CSS variables (Legacy cleanup)
    const root = document.documentElement
    ;[
      '--ev-c-accent',
      '--ev-c-accent-hover',
      '--color-background',
      '--color-background-soft',
      '--color-text',
      '--ev-c-gray-1'
    ].forEach((prop) => root.style.removeProperty(prop))

    // 4. Persist (Electron or LocalStorage)
    if (window.api?.saveSetting) {
      window.api.saveSetting('theme', themeId)
    } else {
      localStorage.setItem('theme', themeId)
    }
  }

  return { currentTheme, setTheme }
}
