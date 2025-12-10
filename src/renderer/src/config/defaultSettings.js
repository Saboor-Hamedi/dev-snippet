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
    gutterBgColor: '#232731',
    gutterBorderColor: 'transparent',
    gutterBorderWidth: 1
  },
  preview:{
    livePreviewBgColor: '#232731',
    livePreviewBorderColor: '#232731',
    livePreviewBorderWidth: 0,
    livePreviewBorderRound: 4
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
