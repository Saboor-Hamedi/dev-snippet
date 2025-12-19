import { useState, useEffect } from 'react'
import { useSettings } from '../../../hook/useSettingsContext'
import { themes } from './themes'

export const themeProps = () => {
  const { getSetting, updateSetting, updateSettings } = useSettings()
  const [currentThemeId, setCurrentThemeId] = useState('midnight-pro') // Default

  // Preload all theme CSS variables immediately (synchronous)
  themes.forEach(theme => {
    if (!theme._cssCache) {
      theme._cssCache = Object.entries(theme.colors).filter(([key]) => key.startsWith('--'))
    }
  })

  const applyTheme = async (themeId) => {
    const theme = themes.find((t) => t.id === themeId)
    if (!theme) return

    // Apply CSS immediately for instant visual feedback
    applyThemeCSS(theme)

    // Then batch settings updates in background
    const settingsToUpdate = {}
    if (theme.settings) {
      for (const [category, values] of Object.entries(theme.settings)) {
        for (const [key, value] of Object.entries(values)) {
          settingsToUpdate[`${category}.${key}`] = value
        }
      }
    }

    // Apply settings in background (don't await)
    if (Object.keys(settingsToUpdate).length > 0) {
      updateSettings(settingsToUpdate)
    }
  }

  // Separate function for CSS application
  const applyThemeCSS = (theme) => {
    const root = document.documentElement

    // Clear existing theme classes
    root.classList.remove('dark')

    // Use cached CSS variables for instant application
    const cssVars = theme._cssCache
    if (cssVars) {
      // Batch apply cached variables
      cssVars.forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    } else {
      // Fallback to filtering (shouldn't happen after preload)
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (key.startsWith('--')) {
          root.style.setProperty(key, value)
        }
      })
    }
      
    // Force specific variables for Polaris
    if (theme.id === 'polaris') {
      root.style.setProperty('--sidebar-header-text', '#586069')
      root.style.setProperty('--color-text-primary', '#24292f')
      root.style.setProperty('--color-text-secondary', '#586069')
    }

    // Apply legacy variables
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-background-soft', theme.colors.sidebar)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--text-main', theme.colors.text)
    root.style.setProperty('--accent', theme.colors.accent)
    root.style.setProperty('--border-color', theme.colors.border)

    // Apply selection colors
    if (theme.colors['--selected-bg'])
      root.style.setProperty('--selected-bg', theme.colors['--selected-bg'])
    if (theme.colors['--selected-text'])
      root.style.setProperty('--selected-text', theme.colors['--selected-text'])
    if (theme.colors['--hover-bg']) root.style.setProperty('--hover-bg', theme.colors['--hover-bg'])
    if (theme.colors['--hover-text'])
      root.style.setProperty('--hover-text', theme.colors['--hover-text'])

    // Set dark class
    if (theme.id !== 'polaris') {
      root.classList.add('dark')
    }

    // Set data-theme
    root.setAttribute('data-theme', theme.id)

    // Update body
    document.body.style.backgroundColor = theme.colors.background
    document.body.style.color = theme.colors.text

    // Save to settings
    updateSetting('ui.theme', theme.id)
    setCurrentThemeId(theme.id)

    console.log(`🎨 ${theme.id} theme applied successfully!`)
  }
  const setTheme = (themeId) => {
    applyTheme(themeId)
  }

  return {
    currentThemeId,
    currentTheme: themes.find((t) => t.id === currentThemeId),
    setTheme,
    themes
  }
}

export default themeProps