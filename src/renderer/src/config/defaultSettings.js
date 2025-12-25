// src/config/defaultSettings.js
export const DEFAULT_SETTINGS = {
  // Welcome settings Covers all tiny components
  welcome: {
    welcomePage: '#232731',
    hideWelcomePage: false
  },
  editor: {
    editorBgColor: '#232731',
    zoomLevel: 1.0,
    fontSize: 16,
    fontFamily: 'JetBrains Mono',
    fontLigatures: true,
    lineNumbers: true,
    wordWrap: 'off',
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
    cursorShadowBoxColor: '#58a6ff'
  },
  gutter: {
    gutterBgColor: '#232731',
    gutterBorderColor: 'transparent',
    gutterBorderWidth: 0
  },
  livePreview: {
    bgColor: '#232731',
    borderColor: '#232731',
    borderWidth: 0,
    borderRound: 0,
    overlayMode: false
  },
  header: {
    bgColor: '#232731',
    textColor: '#c9d1d9',
    iconColor: '#c9d1d9',
    borderColor: '#30363d'
  },
  ui: {
    sidebarBg: '#252526',
    statusBarBg: '#232731', // Editor header status bar
    footerBg: '#232731', // System status footer
    headerBg: '#232731', // Main header
    compactMode: false,
    showSidebar: true,
    showActivityBar: true,
    showHeader: true,
    showStatusBar: true,
    showFlowMode: false,
    showPreview: false,
    sidebarIconColor: '#c9d1d9',
    sidebarWidth: 250,
    previewPosition: 'right',
    previewFontSize: 14,
    hideWelcomePage: false,
    theme: 'system'
  },
  activityBar: {
    bgColor: '#18181b',
    activeFg: '#f1be36',
    inactiveFg: 'rgba(255, 255, 255, 0.4)',
    activeBorder: '#d946ef',
    badgeBg: '#d946ef',
    badgeFg: '#ffffff'
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
    disableComplexCM: false, // Disables background highlights (active line, selection match)
    maxFileSize: 1048576 // 1MB
  }
}
