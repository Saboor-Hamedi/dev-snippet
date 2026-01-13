import React, { useState, useEffect, createContext, useContext, useLayoutEffect, useMemo } from 'react'
import settingsManager from '../config/settingsManager.js'
import { DEFAULT_SETTINGS } from '../config/defaultSettings.js'
import { MIN_ZOOM, MAX_ZOOM } from './useZoomLevel.js'
import { clamp, roundTo } from './useRoundedClamp.js'

const SettingsContext = createContext()

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      return settingsManager.getAll() || DEFAULT_SETTINGS
    } catch (err) {
      console.error('Failed to get initial settings:', err)
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    setSettings(settingsManager.getAll())
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      setSettings({ ...newSettings })
    })
    return () => unsubscribe()
  }, [])

  const [zoom, setZoomInternal] = useState(() => {
    const initial = settingsManager.get('editor.zoomLevel') ?? 1.0
    return clamp(Number(initial), MIN_ZOOM, MAX_ZOOM)
  })

  const [editorZoom, setEditorZoomInternal] = useState(() => {
    const initial = settingsManager.get('editor.fontZoom') ?? 1.0
    return clamp(Number(initial), MIN_ZOOM, MAX_ZOOM)
  })

  useEffect(() => {
    if (settings?.editor) {
      const ez = settings.editor.zoomLevel
      if (ez !== undefined && Math.abs(Number(ez) - zoom) > 0.01) {
        setZoomInternal(clamp(Number(ez), MIN_ZOOM, MAX_ZOOM))
      }
      const efz = settings.editor.fontZoom
      if (efz !== undefined && Math.abs(Number(efz) - editorZoom) > 0.01) {
        setEditorZoomInternal(clamp(Number(efz), MIN_ZOOM, MAX_ZOOM))
      }
    }
  }, [settings])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        setZoomInternal(1.0)
        setEditorZoomInternal(1.0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (window.api?.setZoom) {
      window.api.setZoom(zoom).catch(() => {})
    }
  }, [zoom])

  useEffect(() => {
    const timer = setTimeout(() => {
      const cz = settingsManager.get('editor.zoomLevel') ?? 1.0
      const cfz = settingsManager.get('editor.fontZoom') ?? 1.0
      if (Math.abs(zoom - cz) > 0.01) settingsManager.set('editor.zoomLevel', zoom)
      if (Math.abs(editorZoom - cfz) > 0.01) settingsManager.set('editor.fontZoom', editorZoom)
    }, 1000)
    return () => clearTimeout(timer)
  }, [zoom, editorZoom])

  const setZoom = (value) => {
    setZoomInternal((prev) => {
      let next = typeof value === 'function' ? value(prev) : value
      if (prev !== 1.0 && next >= 0.95 && next <= 1.05) next = 1.0
      return clamp(roundTo(next, 2), MIN_ZOOM, MAX_ZOOM)
    })
  }

  const setEditorZoom = (value) => {
    setEditorZoomInternal((prev) => {
      let next = typeof value === 'function' ? value(prev) : value
      if (prev !== 1.0 && next >= 0.95 && next <= 1.05) next = 1.0
      return clamp(roundTo(next, 2), MIN_ZOOM, MAX_ZOOM)
    })
  }

  // Pure CSS Variable Injection for High Performance & Zero Pulse
  const styleString = useMemo(() => {
    if (!settings.editor) return ''
    const baseSize = settings.editor.fontSize || 13
    const finalSize = baseSize * editorZoom
    const sizeVal = `${finalSize / 16}rem`
    const family = settings.editor.fontFamily || "'Inter', system-ui, sans-serif"
    return `
      :root {
        --editor-font-size: ${sizeVal};
        --editor-font-family: ${family};
        --editor-line-height: 1.6; /* STABILITY: Non-fractional line height prevents jumping */
        ${settings.editor.editorBgColor ? `--editor-bg: ${settings.editor.editorBgColor};` : ''}
        --zoom-level: ${zoom};
      }
    `
  }, [settings, editorZoom, zoom])

  const getSetting = (path) => {
    const keys = path.split('.')
    let value = settings
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value
  }

  const updateSetting = async (path, value) => {
    await settingsManager.set(path, value)
  }

  const updateSettings = async (newSettings) => {
    await settingsManager.replace(newSettings)
  }

  const resetSettings = async () => {
    await settingsManager.reset()
    setZoomInternal(1.0)
    setEditorZoomInternal(1.0)
  }

  return React.createElement(SettingsContext.Provider, {
    value: {
      settings,
      getSetting,
      updateSetting,
      updateSettings,
      resetSettings,
      zoom,
      setZoom,
      editorZoom,
      setEditorZoom
    }
  }, [
    React.createElement('style', { key: 'settings-style-pulse-shield' }, styleString),
    children
  ])
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within a SettingsProvider')
  return context
}

export const useAutoSave = () => {
  const { getSetting, updateSetting } = useSettings()
  const setting = getSetting('behavior.autoSave')
  const autoSave = setting === undefined || setting === null ? true : setting
  const setAutoSave = (enabled) => updateSetting('behavior.autoSave', enabled)
  return [autoSave, setAutoSave]
}

export const useZoomLevel = () => {
  const { zoom, setZoom } = useSettings()
  return [zoom, setZoom]
}

export const useEditorZoomLevel = () => {
  const { editorZoom, setEditorZoom } = useSettings()
  return [editorZoom, setEditorZoom]
}

export const useCompactMode = () => {
  const { getSetting, updateSetting } = useSettings()
  const compactMode = getSetting('ui.compactMode') || false
  const setCompactMode = (enabled) => updateSetting('ui.compactMode', enabled)
  return [compactMode, setCompactMode]
}

export default useSettings
