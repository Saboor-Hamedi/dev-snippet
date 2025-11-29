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
    if (themeId === 'polaris') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    if (colors) {
      const root = document.documentElement
      if (colors.background) root.style.setProperty('--color-background', colors.background)
      if (colors.sidebar) root.style.setProperty('--color-background-soft', colors.sidebar)
      if (colors.text) root.style.setProperty('--color-text', colors.text)
      if (colors.text) root.style.setProperty('--text-main', colors.text)
      if (colors.accent) root.style.setProperty('--accent', colors.accent)
      if (colors.border) root.style.setProperty('--border-color', colors.border)
      // Hover/selected tuning
      if (themeId === 'polaris') {
        root.style.setProperty('--hover-bg', 'rgba(0,0,0,0.05)')
        root.style.setProperty('--hover-text', '#1e293b')
        root.style.setProperty('--selected-bg', '#e2e8f0')
        root.style.setProperty('--selected-text', '#0f172a')
      } else if (themeId === 'midnight-pro') {
        root.style.setProperty('--hover-bg', '#21262d')
        root.style.setProperty('--hover-text', '#ffffff')
        root.style.setProperty('--selected-bg', '#30363d')
        root.style.setProperty('--selected-text', '#ffffff')
      } else if (themeId === 'nebula') {
        root.style.setProperty('--hover-bg', 'rgba(217,70,239,0.15)')
        root.style.setProperty('--hover-text', '#e4e4e7')
        root.style.setProperty('--selected-bg', '#27272a')
        root.style.setProperty('--selected-text', '#e4e4e7')
      } else if (themeId === 'forest') {
        root.style.setProperty('--hover-bg', 'rgba(34,197,94,0.12)')
        root.style.setProperty('--hover-text', '#e7e5e4')
        root.style.setProperty('--selected-bg', '#44403c')
        root.style.setProperty('--selected-text', '#e7e5e4')
      }
    }
  }

  return { currentTheme, setTheme }
}
