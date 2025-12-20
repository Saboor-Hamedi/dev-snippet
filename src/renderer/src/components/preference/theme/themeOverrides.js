const OVERRIDABLE_SETTINGS = {
  'gutter.gutterBgColor': '--color-bg-primary',
  'gutter.gutterBorderColor': '--gutter-border-color',
  'gutter.gutterBorderWidth': '--gutter-border-width',
  'cursor.color': '--caret-color',
  'cursor.width': '--caret-width',
  'livePreview.bgColor': '--live-preview-bg-color'
}

export const applyThemeOverrides = (parsedSettings, root) => {
  Object.entries(OVERRIDABLE_SETTINGS).forEach(([settingKey, cssVar]) => {
    const keys = settingKey.split('.')
    let value = parsedSettings
    for (const key of keys) {
      value = value?.[key]
    }
    if (value !== undefined) {
      root.style.setProperty(cssVar, value)
    }
  })
}
