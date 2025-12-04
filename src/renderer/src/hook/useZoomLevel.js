import { useSettings } from './useSettingsContext'

// Zoom Level Constants
// Change these values to adjust the minimum and maximum zoom levels across the app
export const MIN_ZOOM = 0.5 // 50%
export const MAX_ZOOM = 2.0 // 200%

export const useZoomLevel = () => {
  const { getSetting, updateSetting } = useSettings()
  const zoomLevel = getSetting('editor.zoomLevel') || 1.0

  const setZoomLevel = (level) => {
    updateSetting('editor.zoomLevel', level)
  }

  return [zoomLevel, setZoomLevel]
}

export default useZoomLevel
