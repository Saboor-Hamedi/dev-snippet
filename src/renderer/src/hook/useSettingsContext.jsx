import React, { useState, useEffect, createContext, useContext } from 'react'
import settingsManager from '../config/settingsManager.js'
import { DEFAULT_SETTINGS } from '../config/defaultSettings.js'
import { MIN_ZOOM, MAX_ZOOM } from './useZoomLevel.js' // Integrated constants
import { clamp, roundTo } from './useRoundedClamp.js' // Utility helpers

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

  // --- ZOOM MANAGEMENT ---

  // 1. Live state for Global UI Zoom
  const [zoom, setZoomInternal] = useState(() => {
    const initial = settingsManager.get('editor.zoomLevel') ?? 1.0
    return clamp(Number(initial), MIN_ZOOM, MAX_ZOOM)
  })

  // 2. Live state for Editor-Only Font Zoom
  const [editorZoom, setEditorZoomInternal] = useState(() => {
    return settingsManager.get('editor.fontZoom') ?? 1.0
  })

  // 3. Apply UI Zoom to the native window and CSS
  useEffect(() => {
    if (window.api?.setZoom) {
      window.api.setZoom(zoom).catch(() => {})
    }
    document.documentElement.style.setProperty('--zoom-level', zoom)
  }, [zoom])

  // 4. Consolidated Debounced Persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentZoom = settingsManager.get('editor.zoomLevel') ?? 1.0
      const currentFontZoom = settingsManager.get('editor.fontZoom') ?? 1.0

      const needsZoomWrite = Math.abs(zoom - currentZoom) > 0.01
      const needsFontWrite = Math.abs(editorZoom - currentFontZoom) > 0.01

      if (needsZoomWrite || needsFontWrite) {
        if (needsZoomWrite) settingsManager.set('editor.zoomLevel', zoom)
        if (needsFontWrite) settingsManager.set('editor.fontZoom', editorZoom)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [zoom, editorZoom])

  // 5. Exposure Setters
  const setZoom = (value) => {
    setZoomInternal((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      return clamp(roundTo(next, 1), MIN_ZOOM, MAX_ZOOM)
    })
  }

  const setEditorZoom = (value) => {
    setEditorZoomInternal((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      return clamp(roundTo(next, 1), MIN_ZOOM, MAX_ZOOM)
    })
  }

  // Apply font settings to CSS variables whenever settings change
  useEffect(() => {
    if (settings.editor) {
      const root = document.documentElement
      const baseFontSize = settings.editor.fontSize || 14
      const fontFamily = settings.editor.fontFamily || 'JetBrains Mono'

      // Cumulative result: (Setting Size * Editor Local Zoom)
      const finalFontSize = baseFontSize * editorZoom
      const sizeVal = `${finalFontSize / 16}rem`

      root.style.setProperty('--editor-font-size', sizeVal)
      root.style.setProperty('--editor-font-family', fontFamily)

      // Apply Editor Background Color from settings
      if (settings.editor.editorBgColor) {
        root.style.setProperty('--editor-bg', settings.editor.editorBgColor)
      }
    }
  }, [settings, editorZoom])

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

  // Update multiple settings at once (e.g. from JSON editor)
  const updateSettings = async (newSettings) => {
    await settingsManager.replace(newSettings)
  }

  // Reset to defaults
  const resetSettings = async () => {
    await settingsManager.reset()
    // Explicitly reset local zoom states
    setZoomInternal(1.0)
    setEditorZoomInternal(1.0)
    // settingsManager will notify listeners, causing this component to update via subscription
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        getSetting,
        updateSetting,
        updateSettings,
        resetSettings,
        zoom,
        setZoom,
        editorZoom,
        setEditorZoom
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
  const setting = getSetting('behavior.autoSave')
  const autoSave = setting === undefined || setting === null ? true : setting

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

export const useEditorZoomLevel = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useEditorZoomLevel must be used within a SettingsProvider')

  const { editorZoom, setEditorZoom } = context
  return [editorZoom, setEditorZoom]
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
