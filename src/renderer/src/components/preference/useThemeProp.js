import { useState, useEffect } from 'react'
import { useSettings } from '../../hook/useSettingsContext'
import { themes } from './theme/ThemeProp'

export const themeProps = () => {
  const { getSetting, updateSetting } = useSettings()
  const [currentThemeId, setCurrentThemeId] = useState('midnight-pro') // Default

  useEffect(() => {
    const savedTheme = getSetting('ui.theme') || 'midnight-pro'
    setCurrentThemeId(savedTheme)
  }, [getSetting])

  const applyTheme = async (themeId) => {
    const theme = themes.find((t) => t.id === themeId)
    if (!theme) return

    // Apply theme colors to document root
    const root = document.documentElement

    // Clear existing theme classes
    root.classList.remove('dark')

    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value)
      }
    })

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
    updateSetting('ui.theme', themeId)
    setCurrentThemeId(themeId)

    // Save to DB if API available
    if (window.api?.saveTheme) {
      await window.api.saveTheme({
        id: 'current',
        name: theme.id,
        colors: JSON.stringify(theme.colors)
      })
    }
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
