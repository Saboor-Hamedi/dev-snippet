import React from 'react'
import PropTypes from 'prop-types'
import { SettingSection, SettingToggle } from '../components'

/**
 * Text Editor Settings Section
 * Handles word wrap, auto-save, and overlay mode
 */
const EditorSettings = ({
  wordWrap,
  onWordWrapChange,
  autoSave,
  onAutoSaveChange,
  overlayMode,
  onOverlayModeChange
}) => {
  return (
    <SettingSection>
      {/* Word Wrap */}
      <SettingToggle
        label="Word Wrap"
        description="Wrap long lines in the editor instead of scrolling horizontally."
        checked={wordWrap === 'on'}
        onChange={(checked) => onWordWrapChange(checked ? 'on' : 'off')}
      />

      {/* Auto Save */}
      <SettingToggle
        label="Auto Save"
        description="Automatically save changes as you type."
        checked={autoSave}
        onChange={onAutoSaveChange}
      />

      {/* Preview Overlay Mode */}
      <SettingToggle
        label="Preview Overlay Mode"
        description="Float preview over editor instead of side-by-side."
        checked={overlayMode}
        onChange={onOverlayModeChange}
        noBorder
      />
    </SettingSection>
  )
}

EditorSettings.propTypes = {
  wordWrap: PropTypes.string.isRequired,
  onWordWrapChange: PropTypes.func.isRequired,
  autoSave: PropTypes.bool.isRequired,
  onAutoSaveChange: PropTypes.func.isRequired,
  overlayMode: PropTypes.bool.isRequired,
  onOverlayModeChange: PropTypes.func.isRequired
}

export default EditorSettings
