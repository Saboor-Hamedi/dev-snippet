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
      // Syntax Highlighting (Light Mode)
      '--color-syntax-string': '#0a3069',
      '--color-syntax-variable': '#953800',
      '--color-syntax-number': '#0550ae',
      '--color-syntax-boolean': '#0550ae',
      '--color-syntax-null': '#24292f',
      '--color-syntax-keyword': '#cf222e',
      '--color-syntax-comment': '#6e7781',
      '--color-syntax-punctuation': '#57606a',
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
      '--activity-bar-active-fg': '#24292f',
      '--activity-bar-inactive-fg': 'rgba(36, 41, 47, 0.4)',
      '--activity-bar-active-border': '#0969da',
      '--activity-bar-badge-bg': '#0969da',
      '--activity-bar-badge-fg': '#ffffff',
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
      activityBar: {
        bgColor: '#f6f8fa',
        activeFg: '#24292f',
        inactiveFg: 'rgba(36, 41, 47, 0.4)',
        activeBorder: '#0969da',
        badgeBg: '#0969da',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: '#ffffff',
        textColor: '#24292f',
        iconColor: '#24292f',
        borderColor: '#d1d9e0'
      },
      ui: {
        sidebarBg: '#f6f8fa',
        sidebarIconColor: '#24292f',
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
      // Syntax Highlighting (Dark Mode)
      '--color-syntax-string': '#a5d6ff', // Light Blue/Green
      '--color-syntax-variable': '#79c0ff', // Blue
      '--color-syntax-number': '#d2a8ff', // Purple
      '--color-syntax-boolean': '#ff7b72', // Red/Orange
      '--color-syntax-null': '#79c0ff',
      '--color-syntax-keyword': '#ff7b72', // Red
      '--color-syntax-comment': '#8b949e', // Grey
      '--color-syntax-punctuation': '#8b949e',
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
      '--activity-bar-active-fg': '#c9d1d9',
      '--activity-bar-inactive-fg': 'rgba(201, 209, 217, 0.4)',
      '--activity-bar-active-border': '#58a6ff',
      '--activity-bar-badge-bg': '#58a6ff',
      '--activity-bar-badge-fg': '#ffffff',
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
      activityBar: {
        bgColor: '#161b22',
        activeFg: '#c9d1d9',
        inactiveFg: 'rgba(201, 209, 217, 0.4)',
        activeBorder: '#58a6ff',
        badgeBg: '#58a6ff',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: '#0d1117',
        textColor: '#c9d1d9',
        iconColor: '#c9d1d9',
        borderColor: '#30363d'
      },
      ui: {
        sidebarBg: '#161b22',
        sidebarIconColor: '#c9d1d9',
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
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#ffffff',
      '--color-text-tertiary': '#ffffff',
      '--color-accent-primary': '#d946ef',
      '--color-border': '#27272a',
      '--hover-bg': '#1e1b4b',
      '--hover-text': '#d946ef',
      '--selected-bg': '#4c1d95',
      '--selected-text': '#e879f9',
      '--sidebar-text': '#ffffff',
      '--sidebar-header-text': '#ffffff',
      // Syntax Highlighting (Nebula)
      '--color-syntax-string': '#d946ef',
      '--color-syntax-variable': '#e879f9',
      '--color-syntax-number': '#f0abfc',
      '--color-syntax-boolean': '#c026d3',
      '--color-syntax-null': '#fae8ff',
      '--color-syntax-keyword': '#c026d3',
      '--color-syntax-comment': '#71717a',
      '--color-syntax-punctuation': '#a1a1aa',
      // Component-specific variables
      '--editor-bg': '#09090b',
      '--editor-text': '#ffffff',
      '--gutter-text-color': '#ffffff',
      '--statusbar-bg': '#18181b',
      '--statusbar-text': '#ffffff',
      '--header-bg': '#09090b',
      '--header-text': '#ffffff',
      '--sidebar-bg': '#18181b',
      '--sidebar-border': '#27272a',
      '--welcome-bg': '#09090b',
      '--welcome-text': '#ffffff',
      // Gutter variables
      '--gutter-bg-color': '#18181b',
      '--gutter-border-color': '#27272a',
      '--activity-bar-bg': '#18181b',
      '--activity-bar-active-fg': '#d946ef',
      '--activity-bar-inactive-fg': 'rgba(255, 255, 255, 0.4)',
      '--activity-bar-active-border': '#d946ef',
      '--activity-bar-badge-bg': '#d946ef',
      '--activity-bar-badge-fg': '#ffffff',
      background: '#09090b',
      sidebar: '#18181b',
      text: '#ffffff',
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
      activityBar: {
        bgColor: '#18181b',
        activeFg: '#d946ef',
        inactiveFg: 'rgba(255, 255, 255, 0.4)',
        activeBorder: '#d946ef',
        badgeBg: '#d946ef',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: '#09090b',
        textColor: '#ffffff',
        iconColor: '#ffffff',
        borderColor: '#27272a'
      },
      ui: {
        sidebarBg: '#18181b',
        sidebarIconColor: '#d946ef',
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
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#ffffff',
      '--color-text-tertiary': '#ffffff',
      '--color-accent-primary': '#22c55e',
      '--color-border': '#44403c',
      '--hover-bg': '#374151',
      '--hover-text': '#22c55e',
      '--selected-bg': '#14532d',
      '--selected-text': '#4ade80',
      '--sidebar-text': '#ffffff',
      '--sidebar-header-text': '#ffffff',
      // Syntax Highlighting (Forest)
      '--color-syntax-string': '#4ade80',
      '--color-syntax-variable': '#86efac',
      '--color-syntax-number': '#bef264',
      '--color-syntax-boolean': '#16a34a',
      '--color-syntax-null': '#dcfce7',
      '--color-syntax-keyword': '#16a34a',
      '--color-syntax-comment': '#57534e',
      '--color-syntax-punctuation': '#a8a29e',
      // Component-specific variables
      '--editor-bg': '#1c1917',
      '--editor-text': '#ffffff',
      '--gutter-text-color': '#ffffff',
      '--statusbar-bg': '#292524',
      '--statusbar-text': '#ffffff',
      '--header-bg': '#1c1917',
      '--header-text': '#ffffff',
      '--sidebar-bg': '#292524',
      '--sidebar-border': '#44403c',
      '--welcome-bg': '#1c1917',
      '--welcome-text': '#ffffff',
      // Gutter variables
      '--gutter-bg-color': '#292524',
      '--gutter-border-color': '#44403c',
      '--activity-bar-bg': '#292524',
      '--activity-bar-active-fg': '#4ade80',
      '--activity-bar-inactive-fg': 'rgba(255, 255, 255, 0.4)',
      '--activity-bar-active-border': '#22c55e',
      '--activity-bar-badge-bg': '#22c55e',
      '--activity-bar-badge-fg': '#ffffff',
      background: '#1c1917',
      sidebar: '#292524',
      text: '#ffffff',
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
      activityBar: {
        bgColor: '#292524',
        activeFg: '#4ade80',
        inactiveFg: 'rgba(255, 255, 255, 0.4)',
        activeBorder: '#22c55e',
        badgeBg: '#22c55e',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: '#1c1917',
        textColor: '#ffffff',
        iconColor: '#ffffff',
        borderColor: '#44403c'
      },
      ui: {
        sidebarBg: '#292524',
        sidebarIconColor: '#22c55e',
        statusBarBg: '#292524',
        footerBg: '#292524',
        headerBg: '#1c1917'
      }
    },
    previewColors: ['bg-[#1c1917]', 'bg-[#292524]', 'bg-emerald-500']
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    icon: '👑',
    description: 'Gold & Purple on Dark',
    colors: {
      '--color-bg-primary': '#18181b',
      '--color-bg-secondary': '#27272a',
      '--color-bg-tertiary': '#3f3f46',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-tertiary': '#71717a',
      '--color-accent-primary': '#f1be36',
      '--color-border': '#3f3f46',
      '--hover-bg': '#3f3f46',
      '--hover-text': '#f1be36',
      '--selected-bg': '#f1be36',
      '--selected-text': '#18181b',
      '--sidebar-text': '#ffffff',
      '--sidebar-header-text': '#ffffff',
      // Syntax Highlighting
      '--color-syntax-string': '#f1be36',
      '--color-syntax-variable': '#d946ef',
      '--color-syntax-number': '#fcd34d',
      '--color-syntax-boolean': '#d946ef',
      '--color-syntax-null': '#fef3c7',
      '--color-syntax-keyword': '#d946ef',
      '--color-syntax-comment': '#71717a',
      '--color-syntax-punctuation': '#a1a1aa',
      // Component-specific variables
      '--editor-bg': '#18181b',
      '--editor-text': '#ffffff',
      '--gutter-text-color': '#71717a',
      '--statusbar-bg': '#27272a',
      '--statusbar-text': '#f1be36',
      '--header-bg': '#18181b',
      '--header-text': '#ffffff',
      '--sidebar-bg': '#27272a',
      '--sidebar-border': '#3f3f46',
      '--welcome-bg': '#18181b',
      '--welcome-text': '#ffffff',
      // Gutter variables
      '--gutter-bg-color': '#27272a',
      '--gutter-border-color': '#3f3f46',
      '--activity-bar-bg': '#18181b',
      '--activity-bar-active-fg': '#f1be36',
      '--activity-bar-inactive-fg': 'rgba(241, 190, 54, 0.6)',
      '--activity-bar-active-border': '#f1be36',
      '--activity-bar-badge-bg': '#f1be36',
      '--activity-bar-badge-fg': '#18181b',
      background: '#18181b',
      sidebar: '#27272a',
      text: '#ffffff',
      accent: '#f1be36',
      border: '#3f3f46'
    },
    settings: {
      welcome: {
        welcomePage: '#18181b'
      },
      editor: {
        editorBgColor: '#18181b'
      },
      gutter: {
        gutterBgColor: '#27272a',
        gutterBorderColor: '#3f3f46',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#f1be36'
      },
      livePreview: {
        bgColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        borderRound: 4
      },
      activityBar: {
        bgColor: '#18181b',
        activeFg: '#f1be36',
        inactiveFg: 'rgba(241, 190, 54, 0.6)',
        activeBorder: '#f1be36',
        badgeBg: '#f1be36',
        badgeFg: '#18181b'
      },
      header: {
        bgColor: '#18181b',
        textColor: '#ffffff',
        iconColor: '#f1be36',
        borderColor: '#3f3f46'
      },
      ui: {
        sidebarBg: '#27272a',
        sidebarIconColor: '#f1be36',
        statusBarBg: '#27272a',
        footerBg: '#27272a',
        headerBg: '#18181b'
      }
    },
    previewColors: ['bg-[#18181b]', 'bg-[#27272a]', 'bg-yellow-500']
  },
  {
    id: 'oceanic',
    name: 'Oceanic',
    icon: '🌊',
    description: 'Deep Blue & Cyan',
    colors: {
      '--color-bg-primary': '#0f172a', // Slate 900
      '--color-bg-secondary': '#1e293b', // Slate 800
      '--color-bg-tertiary': '#334155', // Slate 700
      '--color-text-primary': '#f8fafc', // Slate 50
      '--color-text-secondary': '#94a3b8', // Slate 400
      '--color-text-tertiary': '#64748b', // Slate 500
      '--color-accent-primary': '#38bdf8', // Sky 400
      '--color-border': '#334155',
      '--hover-bg': '#334155',
      '--hover-text': '#38bdf8',
      '--selected-bg': '#0c4a6e', // Sky 900
      '--selected-text': '#7dd3fc', // Sky 300
      '--sidebar-text': '#f8fafc',
      '--sidebar-header-text': '#94a3b8',
      // Syntax Highlighting
      '--color-syntax-string': '#38bdf8',
      '--color-syntax-variable': '#818cf8', // Indigo
      '--color-syntax-number': '#34d399', // Emerald
      '--color-syntax-boolean': '#f472b6',
      '--color-syntax-null': '#94a3b8',
      '--color-syntax-keyword': '#818cf8',
      '--color-syntax-comment': '#64748b',
      '--color-syntax-punctuation': '#94a3b8',
      // Components
      '--editor-bg': '#0f172a',
      '--editor-text': '#f8fafc',
      '--gutter-text-color': '#64748b',
      '--statusbar-bg': '#1e293b',
      '--statusbar-text': '#f8fafc',
      '--header-bg': '#0f172a',
      '--header-text': '#f8fafc',
      '--sidebar-bg': '#1e293b',
      '--sidebar-border': '#334155',
      '--welcome-bg': '#0f172a',
      '--welcome-text': '#f8fafc',
      '--gutter-bg-color': '#1e293b',
      '--gutter-border-color': '#334155',
      '--activity-bar-bg': '#1e293b',
      '--activity-bar-active-fg': '#38bdf8',
      '--activity-bar-inactive-fg': 'rgba(255, 255, 255, 0.4)',
      '--activity-bar-active-border': '#38bdf8',
      '--activity-bar-badge-bg': '#38bdf8',
      '--activity-bar-badge-fg': '#0f172a',
      background: '#0f172a',
      sidebar: '#1e293b',
      text: '#f8fafc',
      accent: '#38bdf8',
      border: '#334155'
    },
    settings: {
      welcome: { welcomePage: '#1e293b' },
      editor: { editorBgColor: '#0f172a' },
      gutter: { gutterBgColor: '#1e293b', gutterBorderColor: '#334155', gutterBorderWidth: 1 },
      cursor: { color: '#38bdf8' },
      livePreview: { bgColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRound: 4 },
      activityBar: {
        bgColor: '#1e293b',
        activeFg: '#38bdf8',
        inactiveFg: 'rgba(255, 255, 255, 0.4)',
        activeBorder: '#38bdf8',
        badgeBg: '#38bdf8',
        badgeFg: '#0f172a'
      },
      header: {
        bgColor: '#0f172a',
        textColor: '#f8fafc',
        iconColor: '#f8fafc',
        borderColor: '#334155'
      },
      ui: {
        sidebarBg: '#1e293b',
        sidebarIconColor: '#38bdf8',
        statusBarBg: '#1e293b',
        footerBg: '#1e293b',
        headerBg: '#0f172a'
      }
    },
    previewColors: ['bg-[#0f172a]', 'bg-[#1e293b]', 'bg-sky-400']
  },
  {
    id: 'magma',
    name: 'Magma',
    icon: '🌋',
    description: 'Fiery Red & Dark',
    colors: {
      '--color-bg-primary': '#171717', // Neutral 900
      '--color-bg-secondary': '#262626', // Neutral 800
      '--color-bg-tertiary': '#404040', // Neutral 700
      '--color-text-primary': '#fafafa', // Neutral 50
      '--color-text-secondary': '#a3a3a3', // Neutral 400
      '--color-text-tertiary': '#737373', // Neutral 500
      '--color-accent-primary': '#f97316', // Orange 500
      '--color-border': '#404040',
      '--hover-bg': '#404040',
      '--hover-text': '#f97316',
      '--selected-bg': '#431407', // Orange 950
      '--selected-text': '#fdba74', // Orange 300
      '--sidebar-text': '#fafafa',
      '--sidebar-header-text': '#a3a3a3',
      // Syntax Highlighting
      '--color-syntax-string': '#fb923c', // Orange 400
      '--color-syntax-variable': '#f87171', // Red 400
      '--color-syntax-number': '#fcd34d', // Amber 300
      '--color-syntax-boolean': '#f87171',
      '--color-syntax-null': '#d4d4d4',
      '--color-syntax-keyword': '#ef4444', // Red 500
      '--color-syntax-comment': '#737373',
      '--color-syntax-punctuation': '#a3a3a3',
      // Components
      '--editor-bg': '#171717',
      '--editor-text': '#fafafa',
      '--gutter-text-color': '#737373',
      '--statusbar-bg': '#262626',
      '--statusbar-text': '#fafafa',
      '--header-bg': '#171717',
      '--header-text': '#fafafa',
      '--sidebar-bg': '#262626',
      '--sidebar-border': '#404040',
      '--welcome-bg': '#171717',
      '--welcome-text': '#fafafa',
      '--gutter-bg-color': '#262626',
      '--gutter-border-color': '#404040',
      '--activity-bar-bg': '#262626',
      '--activity-bar-active-fg': '#f97316',
      '--activity-bar-inactive-fg': 'rgba(255, 255, 255, 0.4)',
      '--activity-bar-active-border': '#ef4444',
      '--activity-bar-badge-bg': '#ef4444',
      '--activity-bar-badge-fg': '#ffffff',
      background: '#171717',
      sidebar: '#262626',
      text: '#fafafa',
      accent: '#f97316',
      border: '#404040'
    },
    settings: {
      welcome: { welcomePage: '#262626' },
      editor: { editorBgColor: '#171717' },
      gutter: { gutterBgColor: '#262626', gutterBorderColor: '#404040', gutterBorderWidth: 1 },
      cursor: { color: '#f97316' },
      livePreview: { bgColor: '#171717', borderColor: '#404040', borderWidth: 1, borderRound: 4 },
      activityBar: {
        bgColor: '#262626',
        activeFg: '#f97316',
        inactiveFg: 'rgba(255, 255, 255, 0.4)',
        activeBorder: '#ef4444',
        badgeBg: '#ef4444',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: '#171717',
        textColor: '#fafafa',
        iconColor: '#fafafa',
        borderColor: '#404040'
      },
      ui: {
        sidebarBg: '#262626',
        sidebarIconColor: '#f97316',
        statusBarBg: '#262626',
        footerBg: '#262626',
        headerBg: '#171717'
      }
    },
    previewColors: ['bg-[#171717]', 'bg-[#262626]', 'bg-orange-500']
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
      '--color-text-secondary': '#000000',
      '--color-text-tertiary': '#000000',
      '--color-accent-primary': '#000000',
      '--color-border': '#e5e5e5',
      '--hover-bg': '#e5e5e5',
      '--hover-text': '#000000',
      '--selected-bg': '#e5e5e5',
      '--selected-text': '#000000',
      '--sidebar-text': '#000000',
      '--sidebar-header-text': '#000000',
      // Syntax Highlighting (Minimal)
      '--color-syntax-string': '#404040',
      '--color-syntax-variable': '#171717',
      '--color-syntax-number': '#262626',
      '--color-syntax-boolean': '#000000',
      '--color-syntax-null': '#525252',
      '--color-syntax-keyword': '#000000',
      '--color-syntax-comment': '#737373',
      '--color-syntax-punctuation': '#404040',
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
      '--gutter-bg-color': '#f6f6f6',
      '--gutter-border-color': '#e5e5e5',
      '--activity-bar-bg': '#f6f6f6',
      '--activity-bar-active-fg': '#000000',
      '--activity-bar-inactive-fg': 'rgba(0, 0, 0, 0.4)',
      '--activity-bar-active-border': '#000000',
      '--activity-bar-badge-bg': '#000000',
      '--activity-bar-badge-fg': '#ffffff',
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
        gutterBgColor: '#f6f6f6',
        gutterBorderColor: '#e5e5e5',
        gutterBorderWidth: 1
      },
      cursor: {
        color: '#000000'
      },
      livePreview: {
        bgColor: '#f6f6f6',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        borderRound: 4
      },
      activityBar: {
        bgColor: '#f6f6f6',
        activeFg: '#000000',
        inactiveFg: 'rgba(0, 0, 0, 0.4)',
        activeBorder: '#000000',
        badgeBg: '#000000',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: '#f6f6f6',
        textColor: '#000000',
        iconColor: '#000000',
        borderColor: '#e5e5e5'
      },
      ui: {
        sidebarBg: '#f6f6f6',
        sidebarIconColor: '#000000',
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
  oceanic: {
    hoverBg: '#334155',
    hoverText: '#38bdf8',
    selectedBg: '#0c4a6e',
    selectedText: '#7dd3fc'
  },
  magma: {
    hoverBg: '#404040',
    hoverText: '#f97316',
    selectedBg: '#431407',
    selectedText: '#fdba74'
  },
  'royal-gold': {
    hoverBg: '#3f3f46',
    hoverText: '#f1be36',
    selectedBg: '#f1be36',
    selectedText: '#18181b'
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
