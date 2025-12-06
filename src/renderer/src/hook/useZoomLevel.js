import { useSettings } from './useSettingsContext'

// Zoom Level Constants
// Change these values to adjust the minimum and maximum zoom levels across the app
export const MIN_ZOOM = 0.5 // 50%
export const MAX_ZOOM = 2.0 // 200%

export const useZoomLevel = () => {
  const { getSetting, updateSetting } = useSettings()

  const zoomLevel = getSetting('editor.zoomLevel') ?? 1.0

  // Apply zoom to the document root so all UI (not just CodeMirror) updates immediately
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.setProperty('--zoom-level', String(zoomLevel))
  }

  const setZoomLevel = (level) => {
    // Clamp to allowed range for safety
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level))

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--zoom-level', String(clamped))
    }

    updateSetting('editor.zoomLevel', clamped)
  }

  return [zoomLevel, setZoomLevel]
}

export default useZoomLevel
