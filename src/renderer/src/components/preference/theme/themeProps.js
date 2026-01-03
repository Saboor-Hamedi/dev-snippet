import { useSettings } from '../../../hook/useSettingsContext'
import { useCallback, useEffect } from 'react'
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

/**
 * Helper to extract RGB values from rgb() or hex strings
 */
const extractRGB = (colorStr) => {
  if (!colorStr) return '13, 17, 23' // Fallback to dark

  // Handle rgb(r, g, b)
  const rgbMatch = colorStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (rgbMatch) return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`

  // Handle hex #rrggbb
  const hexMatch = colorStr.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (hexMatch) {
    return `${parseInt(hexMatch[1], 16)}, ${parseInt(hexMatch[2], 16)}, ${parseInt(hexMatch[3], 16)}`
  }

  // Handle hex #rgb
  const shortHexMatch = colorStr.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i)
  if (shortHexMatch) {
    return `${parseInt(shortHexMatch[1] + shortHexMatch[1], 16)}, ${parseInt(shortHexMatch[2] + shortHexMatch[2], 16)}, ${parseInt(shortHexMatch[3] + shortHexMatch[3], 16)}`
  }

  return '13, 17, 23'
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

  const applyTheme = useCallback(
    async (themeId) => {
      const theme = themes.find((t) => t.id === themeId)
      if (!theme) return

      // 1. Calculate future settings
      const futureSettings = JSON.parse(JSON.stringify(settings))
      let hasChanges = false
      const currentThemeIdFromSettings = settings?.ui?.theme
      const isThemeSwitch = currentThemeIdFromSettings !== theme.id

      if (!futureSettings.ui) futureSettings.ui = {}

      if (isThemeSwitch) {
        futureSettings.ui.theme = theme.id
        hasChanges = true

        // 1.1 RESET SYNTAX DEFAULTS: If switching themes, ensure we don't carry over
        // conflicting syntax overrides from a previous "default settings" state.
        // We delete the 'syntax' block so the new theme's vars can shine through.
        if (futureSettings.syntax) {
          delete futureSettings.syntax
        }

        if (theme.settings) {
          for (const [category, values] of Object.entries(theme.settings)) {
            if (!futureSettings[category] || typeof futureSettings[category] !== 'object') {
              futureSettings[category] = {}
            }
            for (const [key, value] of Object.entries(values)) {
              if (futureSettings[category][key] !== value) {
                futureSettings[category][key] = value
              }
            }
          }
        }
      }

      // 2. Apply CSS variables immediately
      applyThemeCSS(theme, futureSettings)

      // 3. Update settings.json
      if (hasChanges) {
        updateSettings(futureSettings)
      }
    },
    [settings, updateSettings]
  )

  const applyThemeCSS = (theme, activeSettings = settings) => {
    const root = document.documentElement

    // 1. ENABLE TRANSITION to create a smooth cross-fade effect (Restored per user request)
    // We remove it after a timeout so it doesn't affect normal resizing/hover states
    const style = document.createElement('style')
    style.id = 'theme-transition-style'
    style.innerHTML = `
      * { 
        transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    fill 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; 
      }
    `
    document.head.appendChild(style)

    // Force reflow
    void document.body.offsetHeight

    // Clear existing theme classes
    root.classList.remove('dark')

    // 1. Apply Core Variables via setProperty (High Performance)
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value, 'important')
      }
    })

    // 2. Apply Theme Overrides
    const overrides = THEME_OVERRIDES[theme.id]
    if (overrides) {
      Object.entries(overrides).forEach(([key, value]) => {
        root.style.setProperty(key, value, 'important')
      })
    }

    // 3. Sync Shared Variables
    root.style.setProperty('--color-background', theme.colors.background, 'important')
    root.style.setProperty('--color-background-soft', theme.colors.sidebar, 'important')
    root.style.setProperty('--color-text', theme.colors.text, 'important')
    root.style.setProperty('--text-main', theme.colors.text, 'important')
    root.style.setProperty('--accent', theme.colors.accent, 'important')
    root.style.setProperty('--border-color', theme.colors.border, 'important')

    if (theme.colors['--selected-bg'])
      root.style.setProperty('--selected-bg', theme.colors['--selected-bg'], 'important')
    if (theme.colors['--selected-text'])
      root.style.setProperty('--selected-text', theme.colors['--selected-text'], 'important')
    if (theme.colors['--hover-text'])
      root.style.setProperty('--hover-text', theme.colors['--hover-text'], 'important')

    // 4. Editor & Layout RGB Sync (FIXED: Proper extraction for all themes)
    const editorColor = theme.colors['--editor-bg'] || theme.colors.background
    const editorRGB = extractRGB(editorColor)
    const sidebarColor = theme.colors['--sidebar-bg'] || theme.colors.sidebar
    const sidebarRGB = extractRGB(sidebarColor)
    const headerColor = theme.colors['--header-bg'] || theme.colors['--color-bg-primary']
    const headerRGB = extractRGB(headerColor)
    const primaryBgColor = theme.colors['--color-bg-primary'] || theme.colors.background
    const primaryBgRGB = extractRGB(primaryBgColor)

    root.style.setProperty('--editor-bg', editorColor, 'important')
    root.style.setProperty('--editor-bg-rgb', editorRGB, 'important')
    root.style.setProperty('--sidebar-bg-rgb', sidebarRGB, 'important')
    root.style.setProperty('--header-bg-rgb', headerRGB, 'important')
    root.style.setProperty('--color-bg-primary-rgb', primaryBgRGB, 'important')
    root.style.setProperty(
      '--editor-text',
      theme.colors['--editor-text'] || theme.colors.text,
      'important'
    )
    root.style.setProperty(
      '--gutter-bg',
      theme.colors['--gutter-bg-color'] || theme.colors['--color-bg-secondary'],
      'important'
    )

    // 5. CONDITIONAL GLASSMORPHISM: Only apply to dark themes
    const lightThemes = ['polaris', 'minimal-gray']
    const isLightTheme = lightThemes.includes(theme.id)

    // Apply glassmorphism to sidebar and header for dark themes only
    if (!isLightTheme && theme.colors.backdropFilter) {
      root.style.setProperty('--sidebar-backdrop-filter', theme.colors.backdropFilter, 'important')
      root.style.setProperty('--header-backdrop-filter', theme.colors.backdropFilter, 'important')
    } else {
      // Light themes get solid backgrounds
      root.style.setProperty('--sidebar-backdrop-filter', 'none', 'important')
      root.style.setProperty('--header-backdrop-filter', 'none', 'important')
    }

    // 6. Apply User Overrides (Directly to root for priority)
    applyThemeOverrides(activeSettings, root)

    // 7. Set theme metadata
    if (!lightThemes.includes(theme.id)) {
      root.classList.add('dark')
    }
    root.setAttribute('data-theme', theme.id)
    document.body.style.backgroundColor = theme.colors.background
    document.body.style.color = theme.colors.text

    // CLEAN UP transition styles after animation completes
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }, 400)
  }

  const setTheme = useCallback(
    (themeId) => {
      applyTheme(themeId)
    },
    [applyTheme]
  )

  useEffect(() => {
    const theme = themes.find((t) => t.id === currentThemeId)
    if (theme) {
      applyThemeCSS(theme, settings)
    }
  }, [currentThemeId, settings])

  return {
    currentThemeId,
    currentTheme: themes.find((t) => t.id === currentThemeId),
    setTheme,
    themes
  }
}

export default themeProps
