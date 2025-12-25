const OVERRIDABLE_SETTINGS = {
  'editor.editorBgColor': '--editor-bg',
  'gutter.gutterBgColor': '--gutter-bg-color',
  'gutter.gutterBorderColor': '--gutter-border-color',
  'gutter.gutterBorderWidth': '--gutter-border-width',
  'cursor.color': '--caret-color',
  'cursor.width': '--caret-width',
  'livePreview.bgColor': '--live-preview-bg-color',
  'livePreview.borderColor': '--live-preview-border-color',
  'livePreview.borderWidth': '--live-preview-border-width',
  'livePreview.borderRound': '--live-preview-border-round',
  'ui.activityBarBg': '--activity-bar-bg',
  'ui.sidebarBg': '--sidebar-bg',
  'ui.sidebarIconColor': '--sidebar-icon-color',
  'ui.statusBarBg': '--statusbar-bg',
  'ui.footerBg': '--footer-bg',
  'ui.headerBg': '--header-bg',
  'welcome.welcomePage': '--welcome-bg',
  // Header Overrides
  // Header Overrides
  'header.bgColor': '--header-bg',
  'header.textColor': '--header-text',
  'header.iconColor': '--header-icon-color',
  'header.borderColor': '--header-border',
  // Activity Bar Overrides
  'activityBar.bgColor': '--activity-bar-bg',
  'activityBar.activeFg': '--activity-bar-active-fg',
  'activityBar.inactiveFg': '--activity-bar-inactive-fg',
  'activityBar.activeBorder': '--activity-bar-active-border',
  'activityBar.badgeBg': '--activity-bar-badge-bg',
  'activityBar.badgeFg': '--activity-bar-badge-fg'
}

export const applyThemeOverrides = (parsedSettings, root) => {
  Object.entries(OVERRIDABLE_SETTINGS).forEach(([settingKey, cssVar]) => {
    const keys = settingKey.split('.')
    let value = parsedSettings
    for (const key of keys) {
      value = value?.[key]
    }
    if (value !== undefined && value !== '') {
      // Add 'px' to specific variables if they are numbers
      let finalValue = value
      if (typeof value === 'number' && (cssVar.includes('width') || cssVar.includes('round'))) {
        finalValue = `${value}px`
      }
      root.style.setProperty(cssVar, finalValue)
    }
  })
}
