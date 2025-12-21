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
    theme: 'dark'
  },
  cursor: {
    cursorWidth: 3,
    cursorColor: '#58a6ff',
    cursorShape: 'bar',
    cursorBlinking: true,
    cursorBlinkingSpeed: 500,
    cursorSelectionBg: '#58a6ff33',
    cursorActiveLineBg: 'rgba(88, 166, 255, 0.1)',
    cursorActiveLineBorder: 0,
    cursorActiveLineGutterBorder: 0,
    cursorShadowBoxColor: '#58a6ff'
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
