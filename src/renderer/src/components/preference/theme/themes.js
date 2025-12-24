// theme.js - Centralized theme data

export const themes = [
  {
    id: 'polaris',
    name: 'Polaris',
    icon: '☀️',
    description: '',
    colors: {
      '--color-bg-primary': '#ffffff',
      '--color-bg-secondary': '#f6f8fa',
      '--color-bg-tertiary': '#f1f3f4',
      '--color-text-primary': '#24292f',
      '--color-text-secondary': '#586069',
      '--color-text-tertiary': '#6a737d',
      '--color-accent-primary': '#0366d6',
      '--color-border': '#d1d9e0',
      '--hover-bg': '#f3f4f6',
      '--hover-text': '#0366d6',
      '--selected-bg': '#ddf4ff',
      '--selected-text': '#0969da',
      '--sidebar-text': '#24292f',
      '--sidebar-header-text': '#586069',
      // Component-specific variables
      '--editor-bg': '#ffffff',
      '--editor-text': '#24292f',
      '--gutter-text-color': '#586069',
      '--statusbar-bg': '#f6f8fa',
      '--statusbar-text': '#586069',
      '--header-bg': '#ffffff',
      '--header-text': '#24292f',
      '--sidebar-bg': '#f6f8fa',
      '--sidebar-border': '#d1d9e0',
      '--welcome-bg': '#ffffff',
      '--welcome-text': '#24292f',
      // Gutter variables
      '--gutter-bg-color': '#f6f8fa',
      '--gutter-border-color': '#d1d9e0',
      '--activity-bar-bg': '#f6f8fa',
      background: '#ffffff',
      sidebar: '#f6f8fa',
      text: '#24292f',
      accent: '#0366d6',
      border: '#d1d9e0'
    },
    // Settings presets that get applied to settings.json
    settings: {
      welcome: {
        welcomePage: '#f6f8fa'
      },
      editor: {
        editorBgColor: '#ffffff'
      },
      gutter: {
        gutterBgColor: '#f6f8fa',
        gutterBorderColor: '#d1d9e0',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#050e18ff'
      },
      livePreview: {
        bgColor: '#ffffff',
        borderColor: '#d1d9e0',
        borderWidth: 1,
        borderRound: 4
      },
      ui: {
        activityBarBg: '#f6f8fa',
        sidebarBg: '#f6f8fa',
        statusBarBg: '#f6f8fa',
        footerBg: '#f6f8fa',
        headerBg: '#ffffff'
      }
    },
    previewColors: ['bg-white', 'bg-gray-50', 'bg-blue-500']
  },
  {
    id: 'midnight-pro',
    name: 'Midnight Pro',
    icon: '🌙',
    description: '',
    colors: {
      '--color-bg-primary': '#0d1117',
      '--color-bg-secondary': '#161b22',
      '--color-bg-tertiary': '#21262d',
      '--color-text-primary': '#c9d1d9',
      '--color-text-secondary': '#8b949e',
      '--color-text-tertiary': '#6e7681',
      '--color-accent-primary': '#58a6ff',
      '--color-border': '#30363d',
      '--hover-bg': '#1f2937',
      '--hover-text': '#58a6ff',
      '--selected-bg': '#264f78',
      '--selected-text': '#79c0ff',
      '--sidebar-text': '#c9d1d9',
      '--sidebar-header-text': '#8b949e',
      // Component-specific variables
      '--editor-bg': '#0d1117',
      '--editor-text': '#c9d1d9',
      '--gutter-text-color': '#8b949e',
      '--statusbar-bg': '#161b22',
      '--statusbar-text': '#8b949e',
      '--header-bg': '#0d1117',
      '--header-text': '#c9d1d9',
      '--sidebar-bg': '#161b22',
      '--sidebar-border': '#30363d',
      '--welcome-bg': '#0d1117',
      '--welcome-text': '#c9d1d9',
      // Gutter variables
      '--gutter-bg-color': '#161b22',
      '--gutter-border-color': '#30363d',
      '--activity-bar-bg': '#161b22',
      background: '#0d1117',
      sidebar: '#161b22',
      text: '#c9d1d9',
      accent: '#58a6ff',
      border: '#30363d'
    },
    // Settings presets that get applied to settings.json
    settings: {
      welcome: {
        welcomePage: '#161b22'
      },
      editor: {
        editorBgColor: '#0d1117'
      },
      gutter: {
        gutterBgColor: '#161b22',
        gutterBorderColor: '#30363d',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#58a6ff'
      },
      livePreview: {
        bgColor: '#0d1117',
        borderColor: '#30363d',
        borderWidth: 1,
        borderRound: 4
      },
      ui: {
        activityBarBg: '#161b22',
        sidebarBg: '#161b22',
        statusBarBg: '#161b22',
        footerBg: '#161b22',
        headerBg: '#0d1117'
      }
    },
    previewColors: ['bg-[#0d1117]', 'bg-[#161b22]', 'bg-blue-500']
  },
  {
    id: 'nebula',
    name: 'Nebula',
    icon: '🪐',
    description: '',
    colors: {
      '--color-bg-primary': '#09090b',
      '--color-bg-secondary': '#18181b',
      '--color-bg-tertiary': '#27272a',
      '--color-text-primary': '#e4e4e7',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-tertiary': '#71717a',
      '--color-accent-primary': '#d946ef',
      '--color-border': '#27272a',
      '--hover-bg': '#1e1b4b',
      '--hover-text': '#d946ef',
      '--selected-bg': '#4c1d95',
      '--selected-text': '#e879f9',
      '--sidebar-text': '#e4e4e7',
      '--sidebar-header-text': '#a1a1aa',
      // Component-specific variables
      '--editor-bg': '#09090b',
      '--editor-text': '#e4e4e7',
      '--gutter-text-color': '#a1a1aa',
      '--statusbar-bg': '#18181b',
      '--statusbar-text': '#a1a1aa',
      '--header-bg': '#09090b',
      '--header-text': '#e4e4e7',
      '--sidebar-bg': '#18181b',
      '--sidebar-border': '#27272a',
      '--welcome-bg': '#09090b',
      '--welcome-text': '#e4e4e7',
      // Gutter variables
      '--gutter-bg-color': '#18181b',
      '--gutter-border-color': '#27272a',
      '--activity-bar-bg': '#18181b',
      background: '#09090b',
      sidebar: '#18181b',
      text: '#e4e4e7',
      accent: '#d946ef',
      border: '#27272a'
    },
    // Settings presets that get applied to settings.json
    settings: {
      welcome: {
        welcomePage: '#18181b'
      },
      editor: {
        editorBgColor: '#09090b'
      },
      gutter: {
        gutterBgColor: '#18181b',
        gutterBorderColor: '#27272a',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#d946ef'
      },
      livePreview: {
        bgColor: '#09090b',
        borderColor: '#27272a',
        borderWidth: 1,
        borderRound: 4
      },
      ui: {
        activityBarBg: '#18181b',
        sidebarBg: '#18181b',
        statusBarBg: '#18181b',
        footerBg: '#18181b',
        headerBg: '#09090b'
      }
    },
    previewColors: ['bg-[#09090b]', 'bg-[#18181b]', 'bg-fuchsia-500']
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    description: '',
    colors: {
      '--color-bg-primary': '#1c1917',
      '--color-bg-secondary': '#292524',
      '--color-bg-tertiary': '#44403c',
      '--color-text-primary': '#e7e5e4',
      '--color-text-secondary': '#d6d3d1',
      '--color-text-tertiary': '#a8a29e',
      '--color-accent-primary': '#22c55e',
      '--color-border': '#44403c',
      '--hover-bg': '#374151',
      '--hover-text': '#22c55e',
      '--selected-bg': '#14532d',
      '--selected-text': '#4ade80',
      '--sidebar-text': '#e7e5e4',
      '--sidebar-header-text': '#d6d3d1',
      // Component-specific variables
      '--editor-bg': '#1c1917',
      '--editor-text': '#e7e5e4',
      '--gutter-text-color': '#d6d3d1',
      '--statusbar-bg': '#292524',
      '--statusbar-text': '#d6d3d1',
      '--header-bg': '#1c1917',
      '--header-text': '#e7e5e4',
      '--sidebar-bg': '#292524',
      '--sidebar-border': '#44403c',
      '--welcome-bg': '#1c1917',
      '--welcome-text': '#e7e5e4',
      // Gutter variables
      '--gutter-bg-color': '#292524',
      '--gutter-border-color': '#44403c',
      '--activity-bar-bg': '#292524',
      background: '#1c1917',
      sidebar: '#292524',
      text: '#e7e5e4',
      accent: '#22c55e',
      border: '#44403c'
    },
    // Settings presets that get applied to settings.json
    settings: {
      welcome: {
        welcomePage: '#292524'
      },
      editor: {
        editorBgColor: '#1c1917'
      },
      gutter: {
        gutterBgColor: '#292524',
        gutterBorderColor: '#44403c',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#22c55e'
      },
      livePreview: {
        bgColor: '#1c1917',
        borderColor: '#44403c',
        borderWidth: 1,
        borderRound: 4
      },
      ui: {
        activityBarBg: '#292524',
        sidebarBg: '#292524',
        statusBarBg: '#292524',
        footerBg: '#292524',
        headerBg: '#1c1917'
      }
    },
    previewColors: ['bg-[#1c1917]', 'bg-[#292524]', 'bg-emerald-500']
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    icon: '☁️',
    description: 'Clean & minimal',
    colors: {
      '--color-bg-primary': '#ffffff',
      '--color-bg-secondary': '#f6f6f6',
      '--color-bg-tertiary': '#ededed',
      '--color-text-primary': '#000000',
      '--color-text-secondary': '#404040',
      '--color-text-tertiary': '#737373',
      '--color-accent-primary': '#000000',
      '--color-border': '#e5e5e5',
      '--hover-bg': '#e5e5e5',
      '--hover-text': '#000000',
      '--selected-bg': '#e5e5e5',
      '--selected-text': '#000000',
      '--sidebar-text': '#000000',
      '--sidebar-header-text': '#000000',
      // Component-specific variables
      '--editor-bg': '#ffffff',
      '--editor-text': '#000000',
      '--gutter-text-color': '#000000',
      '--statusbar-bg': '#f6f6f6',
      '--statusbar-text': '#000000',
      '--header-bg': '#f6f6f6',
      '--header-text': '#000000',
      '--sidebar-bg': '#f6f6f6',
      '--sidebar-border': '#e5e5e5',
      '--welcome-bg': '#ffffff',
      '--welcome-text': '#000000',
      // Gutter variables
      '--gutter-bg-color': '#ffffff',
      '--gutter-border-color': '#e5e5e5',
      '--activity-bar-bg': '#f6f6f6',
      background: '#ffffff',
      sidebar: '#f6f6f6',
      text: '#000000',
      accent: '#000000',
      border: '#e5e5e5'
    },
    settings: {
      welcome: {
        welcomePage: '#ffffff'
      },
      editor: {
        editorBgColor: '#ffffff'
      },
      gutter: {
        gutterBgColor: '#ffffff',
        gutterBorderColor: '#e5e5e5',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#000000'
      },
      livePreview: {
        bgColor: '#ffffff',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        borderRound: 4
      },
      ui: {
        activityBarBg: '#f6f6f6',
        sidebarBg: '#f6f6f6',
        statusBarBg: '#f6f6f6',
        footerBg: '#f6f6f6',
        headerBg: '#f6f6f6'
      }
    },
    previewColors: ['bg-[#ffffff]', 'bg-[#f6f6f6]', 'bg-gray-900']
  }
]

// Theme application styles for main.jsx
export const themeStyles = {
  polaris: {
    hoverBg: '#f3f4f6',
    hoverText: '#0366d6',
    selectedBg: '#ddf4ff',
    selectedText: '#0969da',
    sidebarText: '#24292f',
    sidebarHeaderText: '#586069'
  },
  'midnight-pro': {
    hoverBg: '#1f2937',
    hoverText: '#58a6ff',
    selectedBg: '#264f78',
    selectedText: '#79c0ff'
  },
  nebula: {
    hoverBg: '#1e1b4b',
    hoverText: '#d946ef',
    selectedBg: '#4c1d95',
    selectedText: '#e879f9'
  },
  forest: {
    hoverBg: '#374151',
    hoverText: '#22c55e',
    selectedBg: '#14532d',
    selectedText: '#4ade80'
  },
  'minimal-gray': {
    hoverBg: '#e5e5e5',
    hoverText: '#000000',
    selectedBg: '#e5e5e5',
    selectedText: '#000000',
    sidebarText: '#000000',
    sidebarHeaderText: '#000000'
  }
}
