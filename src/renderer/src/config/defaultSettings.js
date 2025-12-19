// src/config/defaultSettings.js
export const DEFAULT_SETTINGS = {
  // Welcome settings Covers all tiny components
  welcome: {
    welcomePage: '#232731'
  },
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
    gutterBgColor: '#232731',
    gutterBorderColor: 'transparent',
    gutterBorderWidth: 1
  },
  livePreview: {
    bgColor: '#232731',
    borderColor: '#232731',
    borderWidth: 0,
    borderRound: 0
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
