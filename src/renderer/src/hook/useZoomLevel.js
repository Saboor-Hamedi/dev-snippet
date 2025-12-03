import { useSettings } from './useSettingsContext'

export const useZoomLevel = () => {
  const { getSetting, updateSetting } = useSettings()
  const zoomLevel = getSetting('editor.zoomLevel') || 1.0

  const setZoomLevel = (level) => {
    updateSetting('editor.zoomLevel', level)
  }

  return [zoomLevel, setZoomLevel]
}

export default useZoomLevel
