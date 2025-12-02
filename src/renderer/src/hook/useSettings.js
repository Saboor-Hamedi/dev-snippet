import { useState, useEffect } from 'react'
import settingsManager from '../components/settings/Settings.jsx'

// React hook for settings management
export const useSettings = (path = null) => {
  const [settings, setSettings] = useState(() => {
    if (path) {
      return settingsManager.get(path)
    }
    return settingsManager.getAll()
  })

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      if (path) {
        setSettings(settingsManager.get(path))
      } else {
        setSettings(newSettings)
      }
    })

    return unsubscribe
  }, [path])

  // Helper function to update a setting
  const updateSetting = async (settingPath, value) => {
    try {
      await settingsManager.set(settingPath, value)
    } catch (error) {
    }
  }

  // Helper function to get a specific setting
  const getSetting = (settingPath) => {
    return settingsManager.get(settingPath)
  }

  // Helper function to reset settings
  const resetSettings = async () => {
    try {
      await settingsManager.reset()
    } catch (error) {
    }
  }

  return {
    settings,
    updateSetting,
    getSetting,
    resetSettings,
    // Convenience getters for common settings
    zoomLevel: settingsManager.get('editor.zoomLevel') || 1.0,
    autoSave: settingsManager.get('behavior.autoSave') || true,
    compactMode: settingsManager.get('ui.compactMode') || false,
    theme: settingsManager.get('editor.theme') || 'dark'
  }
}

// Specific hooks for common settings
export const useZoomLevel = () => {
  const { getSetting, updateSetting } = useSettings()
  const zoomLevel = getSetting('editor.zoomLevel') || 1.0
  
  const setZoomLevel = async (level) => {
    try {
      await updateSetting('editor.zoomLevel', level)
    } catch (error) {
    }
  }
  
  return [zoomLevel, setZoomLevel]
}

export const useAutoSave = () => {
  const { getSetting, updateSetting } = useSettings()
  const autoSave = getSetting('behavior.autoSave') || true
  
  const setAutoSave = async (enabled) => {
    await updateSetting('behavior.autoSave', enabled)
  }
  
  return [autoSave, setAutoSave]
}

export const useCompactMode = () => {
  const { getSetting, updateSetting } = useSettings()
  const compactMode = getSetting('ui.compactMode') || false
  
  const setCompactMode = async (enabled) => {
    await updateSetting('ui.compactMode', enabled)
  }
  
  return [compactMode, setCompactMode]
}

export default useSettings