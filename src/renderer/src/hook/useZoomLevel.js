import { useSettings } from './useSettingsContext'

// Zoom limits
export const MIN_ZOOM = 0.8
export const MAX_ZOOM = 2.0

// Normalizer — ALWAYS force one decimal, then clamp
const normalizeZoom = (value) => {
  // const rounded = Number(value.toFixed(1))
  const rounded = Math.round(value * 10) / 10
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, rounded))
}

export const useZoomLevel = () => {
  const { getSetting, updateSetting } = useSettings()

  // STEP 1 — Load raw value
  let zoom = getSetting('editor.zoomLevel') ?? 1.0

  // STEP 2 — Normalize immediately
  const cleanZoom = normalizeZoom(zoom)

  // STEP 3 — Auto-heal and rewrite if needed
  if (cleanZoom !== zoom) {
    updateSetting('editor.zoomLevel', cleanZoom)
  }

  // STEP 4 — Apply to DOM
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--zoom-level', cleanZoom)
  }

  // STEP 5 — Setter ALWAYS normalizes before saving
  const setZoomLevel = (value) => {
    const clean = normalizeZoom(value)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--zoom-level', clean)
    }
    updateSetting('editor.zoomLevel', clean)
  }

  return [cleanZoom, setZoomLevel]
}

export default useZoomLevel
