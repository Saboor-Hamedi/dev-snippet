/*
 * src/renderer/src/components/splitPanels/useAdvancedSplitPane.js
 * Custom hook to manage advanced split pane settings
 * including background color, border width, border color, and border roundness.
 * This hook interacts with the settings context to read and update these values.
 */
import { useCallback, useMemo } from 'react'
import { useSettings } from '../../hook/useSettingsContext'
import { clamp, roundTo, useRoundedClamp } from '../../hook/useRoundedClamp.js'

const useAdvancedSplitPane = () => {
  const MAX_BORDER_WIDTH = 25
  const MIN_BORDER_WIDTH = 0
  const DEFAULT_BORDER_WIDTH = 1

  // Read the reactive settings object so hook updates when settings change
  const { settings, updateSetting } = useSettings()

  const raw = settings?.livePreview?.borderWidth ?? DEFAULT_BORDER_WIDTH
  const bgColor = settings?.livePreview?.bgColor ?? '#232731'
  const borderColor = settings?.livePreview?.borderColor ?? '#232731'
  const borderRoundRaw = settings?.livePreview?.borderRound ?? 0

  /*
    !. Important borderWidth and borderRound do not allow the max to be exceeded.
    !. Let's say the max is 25px, and user tries to set 30px, we clamp it to 25px. -5
  */
  const borderWidth = useRoundedClamp(raw, 1, MIN_BORDER_WIDTH, MAX_BORDER_WIDTH)
  const borderRound = useRoundedClamp(borderRoundRaw, 1, MIN_BORDER_WIDTH, MAX_BORDER_WIDTH)

  // This is the whole bg color
  const setBgColor = useCallback(
    async (value) => {
      await updateSetting('livePreview.bgColor', value)
    },
    [updateSetting]
  )
  // This is the border color like border-color
  const setBorderColor = useCallback(
    async (value) => {
      await updateSetting('livePreview.borderColor', value)
    },
    [updateSetting]
  )

  // This is the border width like 1px solid
  const setBorderWidth = useCallback(
    async (value) => {
      const clamped = clamp(roundTo(value), MIN_BORDER_WIDTH, MAX_BORDER_WIDTH)
      await updateSetting('livePreview.borderWidth', clamped)
    },
    [updateSetting]
  )

  /*
    !. This is my border round like border-radius
  */
  const setBorderRound = useCallback(
    async (value) => {
      const clamped = clamp(roundTo(value), MIN_BORDER_WIDTH, MAX_BORDER_WIDTH)
      await updateSetting('livePreview.borderRound', clamped)
    },
    [updateSetting]
  )

  /* Return all relevant values and setters */

  return {
    bgColor,
    setBgColor,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
    borderRound,
    setBorderRound
  }
}

export default useAdvancedSplitPane
