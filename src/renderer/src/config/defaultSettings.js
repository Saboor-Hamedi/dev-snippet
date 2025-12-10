// src/config/defaultSettings.js
export const DEFAULT_SETTINGS = {
  editor: {
    zoomLevel: 1.0,
    fontSize: 16,
    fontFamily: 'JetBrains Mono',
    lineNumbers: true,
    wordWrap: 'on',
    overlayMode: false,
    tabSize: 2,
    theme: 'dark',
    caretWidth: 3,
    caretColor: '#fefeffff',
    caretStyle: 'bar'
  },
  gutter: {
    gutterBgColor: 'var(--gutter-bg-color, transparent)',
    gutterBorderColor: 'var(--gutter-border-color, transparent)',
    gutterBorderWidth: 1
  },
  ui: {
    compactMode: false,
    showPreview: false,
    sidebarWidth: 250,
    previewPosition: 'right',
    previewFontSize: 14,
    hideWelcomePage: false,
    theme: 'system'
  },
  behavior: {
    autoSave: true,
    autoSaveDelay: 2000,
    confirmDelete: true,
    restoreSession: true
  },
  advanced: {
    enableCodeFolding: true,
    enableAutoComplete: true,
    enableLinting: false,
    maxFileSize: 1048576 // 1MB
  }
}
