import React, { useState, useEffect, createContext, useContext } from 'react'

// Default settings structure
const DEFAULT_SETTINGS = {
  editor: {
    zoomLevel: 1.0,
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    lineNumbers: true,
    wordWrap: 'on',
    tabSize: 2,
    theme: 'dark'
  },
  ui: {
    compactMode: false,
    showPreview: false,
    sidebarWidth: 250,
    previewPosition: 'right'
  },
  behavior: {
    autoSave: true,
    autoSaveDelay: 2000,
    confirmDelete: true,
    restoreSession: true
  },
  advanced: {
    enableCodeFolding: true,
    enableAutoComplete: true,
    enableLinting: false,
    maxFileSize: 1048576
  }
}

// Settings Context
const SettingsContext = createContext()

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

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
    console.log('🔧 Updating setting:', path, '=', value)
    
    const keys = path.split('.')
    const newSettings = { ...settings }
    
    // Navigate to the parent object
    let target = newSettings
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {}
      }
      target = target[key]
    }
    
    // Set the final value
    target[keys[keys.length - 1]] = value
    
    setSettings(newSettings)
    console.log('✅ Settings updated:', newSettings)
  }

  // Update entire settings object
  const updateSettings = (newSettings) => {
    console.log('🔄 Updating all settings:', newSettings)
    setSettings(newSettings)
  }

  // Reset to defaults
  const resetSettings = () => {
    console.log('🔄 Resetting settings to defaults')
    setSettings(DEFAULT_SETTINGS)
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

// Specific hooks for common settings
export const useZoomLevel = () => {
  const { getSetting, updateSetting } = useSettings()
  const zoomLevel = getSetting('editor.zoomLevel') || 1.0
  
  const setZoomLevel = (level) => {
    console.log('🔍 Setting zoom level to:', level)
    updateSetting('editor.zoomLevel', level)
  }
  
  return [zoomLevel, setZoomLevel]
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