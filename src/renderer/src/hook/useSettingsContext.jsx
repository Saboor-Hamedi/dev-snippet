import React, { useState, useEffect, createContext, useContext } from 'react'
import { settingsManager, DEFAULT_SETTINGS } from '../components/settings/Settings'

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
        updateSettings
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

export const useCompactMode = () => {
  const { getSetting, updateSetting } = useSettings()
  const compactMode = getSetting('ui.compactMode') || false
  
  const setCompactMode = (enabled) => {
    updateSetting('ui.compactMode', enabled)
  }
  
  return [compactMode, setCompactMode]
}

export default useSettings