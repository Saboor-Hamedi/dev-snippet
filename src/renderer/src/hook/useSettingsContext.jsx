import React, { useState, useEffect, createContext, useContext } from 'react'
import { settingsManager, DEFAULT_SETTINGS } from '../components/settings/Settings'

// Settings Context
const SettingsContext = createContext()

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(settingsManager.getAll())

  // Sync with SettingsManager on mount
  useEffect(() => {
    // Initial load
    setSettings(settingsManager.getAll())

    // Subscribe to changes
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      setSettings({ ...newSettings })
    })

    return unsubscribe
  }, [])

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
  const updateSetting = (path, value) => {
    // Update via manager (which handles saving and notifying listeners)
    settingsManager.set(path, value)
  }

  // Update entire settings object
  const updateSettings = (newSettings) => {
    setSettings(newSettings)
  }

  // Reset to defaults
  const resetSettings = () => {
    settingsManager.reset()
  }

  const contextValue = {
    settings,
    getSetting,
    updateSetting,
    updateSettings,
    resetSettings,
    DEFAULT_SETTINGS
  }

  return (
    <SettingsContext.Provider value={contextValue}>
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