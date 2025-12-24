import { useSettings } from '../../../hook/useSettingsContext'
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

  const applyTheme = async (themeId) => {
    const theme = themes.find((t) => t.id === themeId)
    if (!theme) return

    // 1. Calculate future settings
    // Deep clone to safely mutate
    const futureSettings = JSON.parse(JSON.stringify(settings))
    let hasChanges = false

    // Explicitly set the theme ID in future settings
    if (!futureSettings.ui) futureSettings.ui = {}
    if (futureSettings.ui.theme !== theme.id) {
      futureSettings.ui.theme = theme.id
      hasChanges = true
    }

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
            hasChanges = true
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
  }

  // Separate function for CSS application
  const applyThemeCSS = (theme, activeSettings = settings) => {
    const root = document.documentElement

    // 1. DISABLE TRANSITIONS to prevent "disco effect"
    const style = document.createElement('style')
    style.innerHTML = '* { transition: none !important; }'
    document.head.appendChild(style)

    // Force reflow
    void document.body.offsetHeight

    // Clear existing theme classes
    root.classList.remove('dark')

    // Use cached CSS variables for instant application
    const cssVars = theme._cssCache
    // Filter and apply all variables starting with '--'
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value)
      }
    })

    // 2. RE-ENABLE TRANSITIONS just after paint
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }, 100) // Slightly longer to ensure paint finish

    // Apply specific theme overrides (Generic)
    const overrides = THEME_OVERRIDES[theme.id]
    if (overrides) {
      Object.entries(overrides).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }
    // Apply User Settings Overrides (Highest priority)
    applyThemeOverrides(activeSettings, root)

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

    // Save to settings handled by parent applyTheme now
    // updateSetting('ui.theme', theme.id)
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
