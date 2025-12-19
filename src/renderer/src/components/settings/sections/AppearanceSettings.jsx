import React from 'react'
import PropTypes from 'prop-types'
import { SunMoon } from 'lucide-react'
import { SettingSection, SettingSelect, SettingInput, SettingRow } from '../components'

/**
 * Appearance Settings Section
 * Handles theme, fonts, and caret settings
 */
const AppearanceSettings = ({
  onOpenThemeModal,
  editorFontFamily,
  onEditorFontFamilyChange,
  editorFontSize,
  onEditorFontSizeChange,
  previewFontFamily,
  onPreviewFontFamilyChange,
  previewFontSize,
  onPreviewFontSizeChange,
  caretWidth,
  onCaretWidthChange,
  caretStyle,
  onCaretStyleChange
}) => {
  const fontOptions = ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New']

  const caretStyleOptions = [
    { value: 'bar', label: 'Bar' },
    { value: 'block', label: 'Block' },
    { value: 'underline', label: 'Underline' }
  ]

  return (
    <SettingSection>
      {/* Theme Selector */}
      <SettingRow label="Color Theme" description="Select your preferred visual theme.">
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xtiny font-thin transition-all"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--hover-bg)'
            e.target.style.borderColor = 'var(--color-text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--color-bg-primary)'
            e.target.style.borderColor = 'var(--color-border)'
          }}
        >
          <SunMoon size={11} />
          Change Theme
        </button>
      </SettingRow>

      {/* Editor Font Family */}
      <SettingSelect
        label="Editor Font Family"
        description="Monospace fonts recommended."
        value={editorFontFamily}
        onChange={onEditorFontFamilyChange}
        options={fontOptions}
      />

      {/* Editor Font Size */}
      <SettingInput
        label="Editor Font Size"
        description="Controls the editor font size."
        type="number"
        value={editorFontSize}
        onChange={onEditorFontSizeChange}
        suffix="px"
      />

      {/* Preview Font Family */}
      <SettingSelect
        label="Preview Font Family"
        description="Applies to code preview blocks."
        value={previewFontFamily}
        onChange={onPreviewFontFamilyChange}
        options={fontOptions}
      />

      {/* Preview Font Size */}
      <SettingInput
        label="Preview Font Size"
        description="Controls code preview size."
        type="number"
        value={previewFontSize}
        onChange={onPreviewFontSizeChange}
        suffix="px"
      />

      {/* Caret Width */}
      <SettingInput
        label="Caret Width"
        description="Thickness of the text cursor."
        type="number"
        value={parseInt(String(caretWidth || '3px').replace('px', ''))}
        onChange={onCaretWidthChange}
        suffix="px"
      />

      {/* Caret Style */}
      <SettingSelect
        label="Caret Style"
        description="Choose bar, block, or underline."
        value={caretStyle}
        onChange={onCaretStyleChange}
        options={caretStyleOptions}
        noBorder
      />
    </SettingSection>
  )
}

AppearanceSettings.propTypes = {
  onOpenThemeModal: PropTypes.func.isRequired,
  editorFontFamily: PropTypes.string.isRequired,
  onEditorFontFamilyChange: PropTypes.func.isRequired,
  editorFontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onEditorFontSizeChange: PropTypes.func.isRequired,
  previewFontFamily: PropTypes.string.isRequired,
  onPreviewFontFamilyChange: PropTypes.func.isRequired,
  previewFontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onPreviewFontSizeChange: PropTypes.func.isRequired,
  caretWidth: PropTypes.string.isRequired,
  onCaretWidthChange: PropTypes.func.isRequired,
  caretStyle: PropTypes.string.isRequired,
  onCaretStyleChange: PropTypes.func.isRequired
}

export default AppearanceSettings
