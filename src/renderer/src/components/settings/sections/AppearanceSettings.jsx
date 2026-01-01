import React from 'react'
import PropTypes from 'prop-types'
import {
  SettingSection,
  SettingSelect,
  SettingInput,
  SettingRow,
  SettingToggle
} from '../components'

import { useToast } from '../../../hook/useToast'
import useFontSettings from '../../../hook/settings/useFontSettings'
import useCursorProp from '../../../hook/settings/useCursorProp'

/**
 * Appearance Settings Section
 * Handles theme, fonts, and cursor settings
 */
const AppearanceSettings = () => {
  const { showToast } = useToast()

  /* Helper to wrap setters with toast */
  const onSettingChange = (setter) => (val) => {
    setter(val)
    // Debounce notification for smoother UX or just notify
    showToast('✓ Settings updated')
  }

  const {
    editorFontFamily,
    updateEditorFontFamily: onEditorFontFamilyChange,
    editorFontSize,
    updateEditorFontSize: onEditorFontSizeChange,
    previewFontFamily,
    updatePreviewFontFamily: onPreviewFontFamilyChange,
    previewFontSize,
    updatePreviewFontSize: onPreviewFontSizeChange
  } = useFontSettings()

  const {
    cursorWidth,
    setCursorWidth,
    cursorShape,
    setCursorShape,
    cursorBlinking,
    setCursorBlinking,
    cursorBlinkingSpeed,
    setCursorBlinkingSpeed,
    cursorSelectionBg,
    setCursorSelectionBg,
    cursorActiveLineBorder,
    setCursorActiveLineBorder,
    cursorActiveLineGutterBorder,
    setCursorActiveLineGutterBorder,
    cursorActiveLineBg,
    setCursorActiveLineBg,
    cursorShadowBoxColor,
    setCursorShadowBoxColor
  } = useCursorProp()

  const fontOptions = ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New']

  const cursorShapeOptions = [
    { value: 'bar', label: 'Bar' },
    { value: 'block', label: 'Block' },
    { value: 'underline', label: 'Underline' }
  ]

  return (
    <SettingSection>
      {/* Editor Font Family */}
      <SettingSelect
        label="Editor Font Family"
        description="Monospace fonts recommended."
        value={editorFontFamily}
        onChange={onSettingChange(onEditorFontFamilyChange)}
        options={fontOptions}
      />

      {/* Editor Font Size */}
      <SettingInput
        label="Editor Font Size"
        description="Controls the editor font size."
        type="text"
        value={editorFontSize}
        onChange={onSettingChange(onEditorFontSizeChange)}
      />

      {/* Preview Font Family */}
      <SettingSelect
        label="Preview Font Family"
        description="Applies to code preview blocks."
        value={previewFontFamily}
        onChange={onSettingChange(onPreviewFontFamilyChange)}
        options={fontOptions}
      />

      {/* Preview Font Size */}
      <SettingInput
        label="Preview Font Size"
        description="Controls code preview size."
        type="text"
        value={previewFontSize}
        onChange={onSettingChange(onPreviewFontSizeChange)}
      />

      {/* Cursor Width */}
      <SettingInput
        label="Cursor Width"
        description="Thickness of the text cursor."
        type="text"
        value={cursorWidth}
        onChange={onSettingChange(setCursorWidth)}
      />

      {/* Cursor Shape */}
      <SettingSelect
        label="Cursor Shape"
        description="Choose bar, block, or underline."
        value={cursorShape}
        onChange={onSettingChange(setCursorShape)}
        options={cursorShapeOptions}
      />

      {/* Cursor Blinking */}
      <SettingToggle
        label="Cursor Blinking"
        description="Toggle text cursor blinking animation."
        checked={cursorBlinking}
        onChange={onSettingChange(setCursorBlinking)}
      />

      {/* Cursor Blinking Speed */}
      <SettingInput
        label="Blinking Speed"
        description="Controls how fast the cursor blinks (ms)."
        type="text"
        value={cursorBlinkingSpeed}
        onChange={onSettingChange(setCursorBlinkingSpeed)}
      />

      {/* Selection Background */}
      <SettingInput
        label="Selection Highlighting"
        description="Background color for selected text."
        value={cursorSelectionBg}
        onChange={onSettingChange(setCursorSelectionBg)}
        type="text"
        placeholder="#58a6ff33"
        noBorder
      />

      <SettingInput
        label="Active Line Border"
        description="Left border width for the active line (0-10px)"
        value={cursorActiveLineBorder}
        onChange={onSettingChange(setCursorActiveLineBorder)}
        type="text"
        placeholder="0"
      />

      <SettingInput
        label="Gutter Border"
        description="Left border width for the active line gutter (0-10px)"
        value={cursorActiveLineGutterBorder}
        onChange={onSettingChange(setCursorActiveLineGutterBorder)}
        type="text"
        placeholder="2"
      />

      <SettingInput
        label="Active Line Background"
        description="Background color for the current active line."
        value={cursorActiveLineBg}
        onChange={onSettingChange(setCursorActiveLineBg)}
        type="text"
        placeholder="rgba(88, 166, 255, 0.1)"
        noBorder
      />
      <SettingInput
        label="Shadow Box Background"
        description="Glow color (shadow) for the active line."
        value={cursorShadowBoxColor}
        onChange={onSettingChange(setCursorShadowBoxColor)}
        type="text"
        placeholder="#58a6ff"
        noBorder
      />
    </SettingSection>
  )
}

// No props required

export default AppearanceSettings
