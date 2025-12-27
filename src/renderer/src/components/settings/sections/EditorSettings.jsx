import React from 'react'
import PropTypes from 'prop-types'
import { SettingSection, SettingToggle, SettingSelect } from '../components'

/**
 * Text Editor Settings Section
 * Handles word wrap, auto-save, overlay mode, and font family
 */
const EditorSettings = ({
  wordWrap,
  onWordWrapChange,
  autoSave,
  onAutoSaveChange,
  overlayMode,
  onOverlayModeChange,
  fontFamily,
  onFontFamilyChange
}) => {
  const fontOptions = [
    { value: 'JetBrains Mono', label: 'JetBrains Mono (Monospace)' },
    { value: 'Fira Code', label: 'Fira Code (Monospace)' },
    { value: 'Consolas', label: 'Consolas (Monospace)' },
    { value: 'Monaco', label: 'Monaco (Monospace)' },
    { value: 'Courier New', label: 'Courier New (Monospace)' },
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'Roboto', label: 'Roboto (Sans-serif)' },
    { value: 'system-ui', label: 'System Default (Sans-serif)' }
  ]

  return (
    <SettingSection>
      {/* Font Family */}
      <SettingSelect
        label="Font Family"
        description="Choose between monospace (code) or sans-serif (prose) fonts."
        value={fontFamily || 'JetBrains Mono'}
        options={fontOptions}
        onChange={onFontFamilyChange}
      />

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
  onOverlayModeChange: PropTypes.func.isRequired,
  fontFamily: PropTypes.string,
  onFontFamilyChange: PropTypes.func.isRequired
}

export default EditorSettings
