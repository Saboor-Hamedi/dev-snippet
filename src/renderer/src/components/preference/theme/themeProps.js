import { useSettings } from '../../../hook/useSettingsContext'
import { useCallback } from 'react'
import { themes } from './themes'
import { applyThemeOverrides } from './themeOverrides'

// Theme-specific overrides to fix inconsistent colors without modifying themes.js
const THEME_OVERRIDES = {
  polaris: {
    '--sidebar-header-text': '#586069',
    '--color-text-primary': '#24292f',
    '--color-text-secondary': '#586069'
  }
}

export const themeProps = () => {
  const { updateSetting, getSetting, updateSettings, settings } = useSettings()
  // Themes source of truth - Derived directly from global settings
  const currentThemeId = getSetting('ui.theme') || 'midnight-pro'

  // Preload all theme CSS variables immediately (synchronous)
  themes.forEach((theme) => {
    if (!theme._cssCache) {
      theme._cssCache = Object.entries(theme.colors).filter(([key]) => key.startsWith('--'))
    }
  })

  const applyTheme = useCallback(async (themeId) => {
    const theme = themes.find((t) => t.id === themeId)
    if (!theme) return

    // 1. Calculate future settings
    // Deep clone to safely mutate
    const futureSettings = JSON.parse(JSON.stringify(settings))
    let hasChanges = false
    const currentThemeIdFromSettings = settings?.ui?.theme
    const isThemeSwitch = currentThemeIdFromSettings !== theme.id

    // Explicitly set the theme ID in future settings
    if (!futureSettings.ui) futureSettings.ui = {}

    // Only apply theme presets if the theme actually changed
    // This allows users to overwrite settings manually without them gets reset on reload
    if (isThemeSwitch) {
      futureSettings.ui.theme = theme.id
      hasChanges = true

      if (theme.settings) {
        for (const [category, values] of Object.entries(theme.settings)) {
          // Ensure category object exists
          if (!futureSettings[category] || typeof futureSettings[category] !== 'object') {
            futureSettings[category] = {}
          }

          for (const [key, value] of Object.entries(values)) {
            // Only update if value is different
            if (futureSettings[category][key] !== value) {
              futureSettings[category][key] = value
            }
          }
        }
      }
    }

    // 2. Apply CSS immediately using the future settings for instant feedback
    applyThemeCSS(theme, futureSettings)

    // 3. Update settings.json if actual changes occurred
    if (hasChanges) {
      // Send the clean, fully nested object.
      // The settings manager's replace() or merge logic will handle it,
      // but preventing flat keys here is the most critical step.
      updateSettings(futureSettings)
    }
  }, [settings, updateSettings])

  // Separate function for CSS application
  const applyThemeCSS = (theme, activeSettings = settings) => {
    const root = document.documentElement

    // 1. ENABLE TRANSITION to create a smooth cross-fade effect
    const style = document.createElement('style')
    style.id = 'theme-transition-style'
    style.innerHTML = `
      * { 
        transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    color 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important; 
      }
    `
    document.head.appendChild(style)

    // Force reflow
    void document.body.offsetHeight

    // Clear existing theme classes
    root.classList.remove('dark')

    // Use cached CSS variables for instant application
    const cssVars = theme._cssCache
    // Use cached CSS variables for instant application
    // We bundle these into a single string to apply them ATOMICALLY
    let cssString = ''

    // 1. Core Theme Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        cssString += `${key}: ${value} !important;\n`
      }
    })

    // 2. Generic Overrides
    const overrides = THEME_OVERRIDES[theme.id]
    if (overrides) {
      Object.entries(overrides).forEach(([key, value]) => {
        cssString += `${key}: ${value} !important;\n`
      })
    }

    // 3. Legacy Compatibility Variables
    cssString += `--color-background: ${theme.colors.background} !important;\n`
    cssString += `--color-background-soft: ${theme.colors.sidebar} !important;\n`
    cssString += `--color-text: ${theme.colors.text} !important;\n`
    cssString += `--text-main: ${theme.colors.text} !important;\n`
    cssString += `--accent: ${theme.colors.accent} !important;\n`
    cssString += `--border-color: ${theme.colors.border} !important;\n`

    if (theme.colors['--selected-bg'])
      cssString += `--selected-bg: ${theme.colors['--selected-bg']} !important;\n`
    if (theme.colors['--selected-text'])
      cssString += `--selected-text: ${theme.colors['--selected-text']} !important;\n`
    if (theme.colors['--hover-bg'])
      cssString += `--hover-bg: ${theme.colors['--hover-bg']} !important;\n`
    if (theme.colors['--hover-text'])
      cssString += `--hover-text: ${theme.colors['--hover-text']} !important;\n`

    // Apply ATOMICALLY via a style tag
    let themeStyleTag = document.getElementById('atomic-theme-variables')
    if (!themeStyleTag) {
      themeStyleTag = document.createElement('style')
      themeStyleTag.id = 'atomic-theme-variables'
      document.head.appendChild(themeStyleTag)
    }
    themeStyleTag.innerHTML = `:root { \n${cssString}\n }`

    // Apply User Settings Overrides (Directly to root for priority)
    applyThemeOverrides(activeSettings, root)

    // 2. CLEAN UP transition styles after animation completes
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }, 500)

    // Set dark class
    const lightThemes = ['polaris', 'minimal-gray']
    if (!lightThemes.includes(theme.id)) {
      root.classList.add('dark')
    }

    // Set data-theme and body styles
    root.setAttribute('data-theme', theme.id)
    document.body.style.backgroundColor = theme.colors.background
    document.body.style.color = theme.colors.text

    // Save to settings handled by parent applyTheme now
    // updateSetting('ui.theme', theme.id)
  }

  const setTheme = useCallback((themeId) => {
    applyTheme(themeId)
  }, [applyTheme])

  return {
    currentThemeId,
    currentTheme: themes.find((t) => t.id === currentThemeId),
    setTheme,
    themes
  }
}

export default themeProps
