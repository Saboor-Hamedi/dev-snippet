import { useEffect, useCallback } from 'react'
import { useSettings } from '../../hook/useSettingsContext'

export const useFlowMode = ({ showPreview, togglePreview }) => {
  const { settings, updateSetting } = useSettings()

  const handleToggleFlow = useCallback(() => {
    const current = settings?.ui?.showFlowMode || false
    const next = !current

    updateSetting('ui.showFlowMode', next)

    // Auto-close standard preview to avoid layout conflicts in Flow Mode
    if (next && showPreview) {
      togglePreview()
    }

    // Trigger Window Resizing if supported
    // if (next && window.api?.setFlowSize) {
    //   window.api.setFlowSize()
    // } else if (!next && window.api?.restoreDefaultSize) {
    //   window.api.restoreDefaultSize()
    // }
  }, [settings?.ui?.showFlowMode, updateSetting, showPreview, togglePreview])

  useEffect(() => {
    window.addEventListener('app:toggle-flow', handleToggleFlow)
    return () => {
      window.removeEventListener('app:toggle-flow', handleToggleFlow)
    }
  }, [handleToggleFlow])
}
