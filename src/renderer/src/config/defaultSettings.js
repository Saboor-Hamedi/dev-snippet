// src/config/defaultSettings.js
export const DEFAULT_SETTINGS = {
  welcome: {
    welcomePage: '#18181b',
    hideWelcomePage: false
  },
  editor: {
    editorBgColor: '#09090b',
    zoomLevel: 1,
    fontSize: 13,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontLigatures: true,
    lineNumbers: true,
    wordWrap: 'on',
    tabSize: 2,
    theme: 'midnight-pro' // User JSON has 'midnight-pro' in editor block but 'nebula' in ui block. Keeping strictly as provided.
  },
  syntax: {
    keyword: '#569cd6',
    string: '#ce9178',
    variable: '#9cdcfe',
    number: '#b5cea8',
    comment: '#6a9955',
    function: '#dcdcaa',
    operator: '#d4d4d4',
    bool: '#569cd6'
  },
  cursor: {
    cursorWidth: 2,
    cursorColor: '#58a6ff',
    cursorShape: 'bar',
    cursorBlinking: true,
    cursorBlinkingSpeed: 500,
    cursorSelectionBg: 'rgba(38, 79, 120, 0.5)',
    cursorActiveLineBg: 'transparent',
    cursorShadowBoxColor: '#58a6ff',
    color: '#d946ef'
  },
  gutter: {
    gutterBgColor: '#18181b',
    gutterBorderColor: '#27272a',
    gutterBorderWidth: 1,
    showGutter: true
  },
  livePreview: {
    bgColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRound: 4,
    overlayMode: false
  },
  header: {
    bgColor: '#09090b',
    textColor: '#ffffff',
    iconColor: '#ffffff',
    borderColor: '#27272a'
  },
  ui: {
    statusBarBg: '#18181b',
    footerBg: '#18181b',
    headerBg: '#09090b',
    compactMode: false,
    showActivityBar: true,
    showHeader: true,
    showStatusBar: true,
    showFlowMode: false,
    showPreview: false,
    zenFocus: false,
    previewPosition: 'right',
    previewFontSize: 13,
    theme: 'custom',
    modeSwitcher: {
      isFloating: false,
      disableDraggable: false,
      pos: {
        x: null,
        y: null
      }
    },
    universalLock: {
      modal: false
    }
  },
  sidebar: {
    bgColor: '#09090b',
    iconColor: '#0d1117',
    textColor: '#0d1117',
    borderColor: '#0d1117',
    width: 250,
    visible: true
  },
  list: {
    hoverBackground: 'rgb(124, 58, 237,0.3)',
    activeBackground: 'rgb(124, 58, 237,0.3)',
    activeForeground: '#0d1117'
  },
  statusBar: {
    showSystemStatus: true,
    showVersion: true,
    showFlowMode: true,
    showPerformance: true,
    showLanguage: true,
    showStats: true,
    showChars: true,
    showZoom: true
  },
  activityBar: {
    bgColor: '#09090b',
    activeFg: '#8778a5',
    inactiveFg: 'rgb(255, 255, 255)',
    activeBorder: '#d946ef',
    badgeBg: '#8778a5',
    badgeFg: '#151b20'
  },
  behavior: {
    autoSave: true,
    autoSaveDelay: 1000,
    confirmDelete: true,
    restoreSession: true
  },
  advanced: {
    enableCodeFolding: true,
    enableAutoComplete: true,
    enableLinting: false,
    disableComplexCM: false,
    maxFileSize: 5242880
  }
}
