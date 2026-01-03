const OVERRIDABLE_SETTINGS = {
  // Editor & Core
  'editor.editorBgColor': '--editor-bg',
  'editor.editorTextColor': '--editor-text',
  'gutter.gutterBgColor': '--gutter-bg-color',
  'gutter.gutterBorderColor': '--gutter-border-color',
  'gutter.gutterBorderWidth': '--gutter-border-width',
  'cursor.color': '--caret-color',
  'cursor.width': '--caret-width',

  // Syntax Highlighting (The VS Code Feel)
  'syntax.keyword': '--color-syntax-keyword',
  'syntax.string': '--color-syntax-string',
  'syntax.variable': '--color-syntax-variable',
  'syntax.number': '--color-syntax-number',
  'syntax.comment': '--color-syntax-comment',
  'syntax.function': '--color-syntax-function',
  'syntax.operator': '--color-syntax-punctuation',
  'syntax.bool': '--color-syntax-boolean',

  // Core Font Stability
  'editor.fontFamily': '--editor-font-family',
  'editor.fontSize': '--editor-font-size',

  // Live Preview
  'livePreview.bgColor': '--live-preview-bg-color',
  'livePreview.borderColor': '--live-preview-border-color',
  'livePreview.borderWidth': '--live-preview-border-width',
  'livePreview.borderRound': '--live-preview-border-round',

  // Header
  'header.bgColor': '--header-bg',
  'header.textColor': '--header-text',
  'header.iconColor': '--header-icon-color',
  'header.borderColor': '--header-border',

  // Activity Bar
  'activityBar.bgColor': '--activity-bar-bg',
  'activityBar.activeFg': '--activity-bar-active-fg',
  'activityBar.inactiveFg': '--activity-bar-inactive-fg',
  'activityBar.activeBorder': '--activity-bar-active-border',
  'activityBar.badgeBg': '--activity-bar-badge-bg',
  'activityBar.badgeFg': '--activity-bar-badge-fg',

  // Sidebar
  // Sidebar (Separated from UI as requested)
  'sidebar.bgColor': '--sidebar-bg',
  'sidebar.iconColor': '--sidebar-icon-color',
  'sidebar.textColor': '--sidebar-text',
  'sidebar.borderColor': '--sidebar-border',

  // Sidebar List Items (Robust Interaction States)
  'list.hoverBackground': '--sidebar-item-hover-bg',
  'list.activeBackground': '--sidebar-item-active-bg',
  'list.activeForeground': '--sidebar-item-active-fg',

  // Misc UI
  'ui.statusBarBg': '--statusbar-bg',
  'ui.footerBg': '--footer-bg',
  'welcome.welcomePage': '--welcome-bg',
  'ui.headerBg': '--header-bg'
}

/**
 * Deeply extracts a value from an object using a dot-notated path.
 */
const getValueByPath = (obj, path) => {
  if (!obj || !path) return undefined
  return path
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

/**
 * Applies user-defined setting overrides to CSS variables.
 * These are applied directly to the root element's style attribute for maximum priority.
 */
export const applyThemeOverrides = (parsedSettings, root) => {
  if (!parsedSettings || typeof parsedSettings !== 'object') return

  // 1. Process standard overridable settings
  Object.entries(OVERRIDABLE_SETTINGS).forEach(([settingKey, cssVar]) => {
    const value = getValueByPath(parsedSettings, settingKey)

    if (value !== undefined && value !== '' && value !== null) {
      let finalValue = value

      // Handle numeric units (px)
      if (
        typeof value === 'number' &&
        (cssVar.includes('width') || cssVar.includes('round') || cssVar.includes('size'))
      ) {
        finalValue = `${value}px`
      }

      // Apply to root for component consumption (Higher than themes.js :root)
      root.style.setProperty(cssVar, finalValue, 'important')
    }
  })

  // 2. Extra Robustness: Sync common theme variables if they exist in sub-objects
  const sidebarBg =
    getValueByPath(parsedSettings, 'ui.sidebarBg') ||
    getValueByPath(parsedSettings, 'sidebar.bgColor')
  if (sidebarBg) {
    root.style.setProperty('--sidebar-bg', sidebarBg, 'important')
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) sidebar.style.setProperty('background-color', sidebarBg, 'important')
  }

  const activityBarBg =
    getValueByPath(parsedSettings, 'activityBar.bgColor') ||
    getValueByPath(parsedSettings, 'ui.activityBarBg')
  if (activityBarBg) {
    root.style.setProperty('--activity-bar-bg', activityBarBg, 'important')
    const bar = document.querySelector('.activity-bar')
    if (bar) bar.style.setProperty('background-color', activityBarBg, 'important')
  }

  const headerBg =
    getValueByPath(parsedSettings, 'header.bgColor') ||
    getValueByPath(parsedSettings, 'ui.headerBg')
  if (headerBg) {
    root.style.setProperty('--header-bg', headerBg, 'important')
    const header = document.querySelector('.header')
    if (header) header.style.setProperty('background-color', headerBg, 'important')
  }

  // 3. Editor Visual Sync
  const editorBg = getValueByPath(parsedSettings, 'editor.editorBgColor')
  if (editorBg) {
    root.style.setProperty('--editor-bg', editorBg, 'important')
  }

  const editorText = getValueByPath(parsedSettings, 'editor.editorTextColor')
  if (editorText) {
    root.style.setProperty('--editor-text', editorText, 'important')
  }

  // 4. Universal UI Stability (The "Scientist Mode" hammer)
  // This ensures that the tokens created in index.css are always enforced at the root style level,
  // making them win over any standard theme CSS rules.
  root.style.setProperty('--u-border-width', '0px', 'important')
  root.style.setProperty('--u-border-color', 'transparent', 'important')
  root.style.setProperty('--u-shadow', 'none', 'important')
  root.style.setProperty('--u-backdrop', 'none', 'important')
  root.style.setProperty('--u-radius', '0px', 'important')

  // Suppression of UI border variables is now handled via --u- prefixed tokens
  // Avoid nuking global --color-border here as it breaks content-specific borders (like headers/tables)

  // 5. Enforce Robust Sidebar Item Defaults (Prevent Transparency Issues)
  const hoverBg = getValueByPath(parsedSettings, 'list.hoverBackground')
  if (!hoverBg) {
    // Default to a visible but subtle overlay if not set
    root.style.setProperty('--sidebar-item-hover-bg', 'var(--color-bg-secondary)', 'important')
  }

  const activeBg = getValueByPath(parsedSettings, 'list.activeBackground')
  if (!activeBg) {
    // Default to a solid active state
    root.style.setProperty('--sidebar-item-active-bg', 'var(--color-bg-tertiary)', 'important')
  }
}
