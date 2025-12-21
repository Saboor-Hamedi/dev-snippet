import React from 'react'
import PropTypes from 'prop-types'
import {
  SettingSection,
  SettingSelect,
  SettingInput,
  SettingRow,
  SettingToggle
} from '../components'

import useFontSettings from '../../../hook/settings/useFontSettings'
import useCursorProp from '../../../hook/settings/useCursorProp'

/**
 * Appearance Settings Section
 * Handles theme, fonts, and cursor settings
 */
const AppearanceSettings = () => {
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
    width: cursorWidth,
    setCursorWidth: onCursorWidthChange,
    shape: cursorShape,
    setCursorShape: onCursorShapeChange,
    blinking: cursorBlinking,
    setCursorBlinking: onCursorBlinkingChange,
    blinkingSpeed: blinkingSpeed,
    setBlinkingSpeed: onBlinkingSpeedChange,
    selectionBackground,
    setSelectionBackground: onSelectionBackgroundChange,
    activeLineBorderWidth,
    setActiveLineBorderWidth: onActiveLineBorderWidthChange,
    activeLineGutterBorderWidth,
    setActiveLineGutterBorderWidth: onActiveLineGutterBorderWidthChange
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
        onChange={onEditorFontFamilyChange}
        options={fontOptions}
      />

      {/* Editor Font Size */}
      <SettingInput
        label="Editor Font Size"
        description="Controls the editor font size."
        type="text"
        value={editorFontSize}
        onChange={onEditorFontSizeChange}
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
        type="text"
        value={previewFontSize}
        onChange={onPreviewFontSizeChange}
      />

      {/* Cursor Width */}
      <SettingInput
        label="Cursor Width"
        description="Thickness of the text cursor."
        type="text"
        value={cursorWidth}
        onChange={onCursorWidthChange}
      />

      {/* Cursor Shape */}
      <SettingSelect
        label="Cursor Shape"
        description="Choose bar, block, or underline."
        value={cursorShape}
        onChange={onCursorShapeChange}
        options={cursorShapeOptions}
      />

      {/* Cursor Blinking */}
      <SettingToggle
        label="Cursor Blinking"
        description="Toggle text cursor blinking animation."
        checked={cursorBlinking}
        onChange={onCursorBlinkingChange}
      />

      {/* Cursor Blinking Speed */}
      <SettingInput
        label="Blinking Speed"
        description="Controls how fast the cursor blinks (ms)."
        type="text"
        value={blinkingSpeed}
        onChange={onBlinkingSpeedChange}
      />

      {/* Selection Background */}
      <SettingInput
        label="Selection Highlighting"
        description="Background color for selected text."
        value={selectionBackground}
        onChange={onSelectionBackgroundChange}
        type="text"
        placeholder="#58a6ff33"
        noBorder
      />

      <SettingInput
        label="Active Line Border"
        description="Left border width for the active line (0-10px)"
        value={activeLineBorderWidth}
        onChange={onActiveLineBorderWidthChange}
        type="text"
        placeholder="0"
      />

      <SettingInput
        label="Gutter Border"
        description="Left border width for the active line gutter (0-10px)"
        value={activeLineGutterBorderWidth}
        onChange={onActiveLineGutterBorderWidthChange}
        type="text"
        placeholder="2"
      />
    </SettingSection>
  )
}

// No props required

export default AppearanceSettings
