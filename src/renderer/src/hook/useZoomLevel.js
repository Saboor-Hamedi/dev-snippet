import { useZoomLevel as useZoomFromContext } from './useSettingsContext'

/**
 * Hook to access and control the application zoom level.
 * This is now a lightweight wrapper around the global SettingsContext
 * to ensure a single source of truth for the entire application.
 */
export const useZoomLevel = () => {
  return useZoomFromContext()
}

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 4.0
export const ZOOM_STEP = 0.5

export default useZoomLevel
