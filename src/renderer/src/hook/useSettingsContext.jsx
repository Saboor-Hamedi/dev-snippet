import React, { useState, useEffect, createContext, useContext } from 'react'
import settingsManager from '../config/settingsManager.js'
import { DEFAULT_SETTINGS } from '../config/defaultSettings.js'

// Settings Context
const SettingsContext = createContext()

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      return settingsManager.getAll() || DEFAULT_SETTINGS
    } catch (err) {
      console.error('Failed to get initial settings:', err)
      return DEFAULT_SETTINGS
    }
  })

  // Sync with SettingsManager on mount
  useEffect(() => {
    // Initial load
    setSettings(settingsManager.getAll())

    // Subscribe to changes
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      setSettings({ ...newSettings })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // LIVE ZOOM STATE - For smooth, immediate interface updates
  // LIVE ZOOM STATE - For smooth, immediate interface updates
  const [zoom, setZoomInternal] = useState(() => {
    // Pre-calculate to avoid FOUC or 10% issue on first render
    const initial = settingsManager.get('editor.zoomLevel') ?? 1.0
    return Math.max(0.5, Number(initial))
  })

  // Sync live zoom with settings on load
  useEffect(() => {
    const savedZoom = settings.editor?.zoomLevel ?? 1.0
    // FORCED FLOOR of 0.5 (50%) to prevent "tiny UI" issues.
    // This ensures Ctrl+0 never results in 10%.
    const cleanSaved = Math.max(0.5, Number(savedZoom))
    if (Math.abs(cleanSaved - zoom) > 0.01) {
      setZoomInternal(cleanSaved)
    }
  }, [settings.editor?.zoomLevel])

  // Apply Live Zoom factor to the native window and CSS
  useEffect(() => {
    // 1. CSS Variable for components that need it
    document.documentElement.style.setProperty('--zoom-level', zoom)

    // 2. Native Electron Zoom (The professional way)
    if (window.api?.setZoom) {
      window.api.setZoom(zoom).catch(() => {})
    }

    // 3. Debounced persist to settings.json
    const timer = setTimeout(() => {
      const currentSaved = settings.editor?.zoomLevel ?? 1.0
      if (Math.abs(zoom - currentSaved) > 0.01) {
        settingsManager.set('editor.zoomLevel', zoom)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [zoom])

  const setZoom = (value) => {
    setZoomInternal((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      // Step: 0.1, Floor: 0.5, Ceiling: 5.0
      // Round to nearest 0.1 (one decimal place)
      const target = Math.max(0.5, Math.min(5.0, Math.round(next * 10) / 10))
      return target
    })
  }

  // Apply font settings to CSS variables whenever settings change
  useEffect(() => {
    if (settings.editor) {
      const root = document.documentElement
      const fontSize = settings.editor.fontSize || 14
      const fontFamily = settings.editor.fontFamily || 'JetBrains Mono'

      const sizeVal = typeof fontSize === 'number' ? `${fontSize / 16}rem` : fontSize

      root.style.setProperty('--editor-font-size', sizeVal)
      root.style.setProperty('--editor-font-family', fontFamily)
    }
  }, [settings])

  // Get a specific setting by path (e.g., 'editor.zoomLevel')
  const getSetting = (path) => {
    const keys = path.split('.')
    let value = settings
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value
  }

  // Update a specific setting by path
  const updateSetting = async (path, value) => {
    await settingsManager.set(path, value)
  }

  // Update multiple settings at once
  const updateSettings = async (newSettings) => {
    // Update each setting individually to ensure proper persistence
    for (const [key, value] of Object.entries(newSettings)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle nested objects
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          await settingsManager.set(`${key}.${nestedKey}`, nestedValue)
        }
      } else {
        await settingsManager.set(key, value)
      }
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        getSetting,
        updateSetting,
        updateSettings,
        zoom,
        setZoom
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const useAutoSave = () => {
  const { getSetting, updateSetting } = useSettings()
  const autoSave = getSetting('behavior.autoSave') || true

  const setAutoSave = (enabled) => {
    updateSetting('behavior.autoSave', enabled)
  }

  return [autoSave, setAutoSave]
}

export const useZoomLevel = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useZoomLevel must be used within a SettingsProvider')

  const { zoom, setZoom } = context
  return [zoom, setZoom]
}

export const useCompactMode = () => {
  const { getSetting, updateSetting } = useSettings()
  const compactMode = getSetting('ui.compactMode') || false

  const setCompactMode = (enabled) => {
    updateSetting('ui.compactMode', enabled)
  }

  return [compactMode, setCompactMode]
}

export default useSettings
