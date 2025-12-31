// theme.js - Centralized theme data

export const themes = [
  {
    id: 'polaris',
    name: 'Polaris',
    icon: '☀️',
    description: '',
    colors: {
      '--color-bg-primary': 'rgba(255, 255, 255, 0.7)', // Frosty White Glass
      '--color-tooltip-bg': '#ffffff',
      '--color-bg-secondary': 'rgba(246, 248, 250, 0.6)',
      '--color-bg-tertiary': 'rgba(241, 243, 244, 0.5)',
      '--color-text-primary': '#000000',
      '--color-text-secondary': '#000000',
      '--color-text-tertiary': '#404040',
      '--color-accent-primary': '#0366d6',
      '--color-border': 'rgba(3, 102, 214, 0.2)',
      '--hover-bg': 'rgba(3, 102, 214, 0.1)',
      '--hover-text': '#0366d6',
      '--selected-bg': 'rgba(3, 102, 214, 0.15)',
      '--selected-text': '#0969da',
      '--sidebar-text': '#000000',
      '--sidebar-header-text': '#000000',
      // Syntax Highlighting (Light Mode)
      '--color-syntax-string': '#404040',
      '--color-syntax-variable': '#171717',
      '--color-syntax-number': '#262626',
      '--color-syntax-boolean': '#000000',
      '--color-syntax-null': '#525252',
      '--color-syntax-keyword': '#000000',
      '--color-syntax-comment': '#737373',
      '--color-syntax-punctuation': '#404040',
      // Component-specific variables
      '--editor-bg': 'rgba(255, 255, 255, 0.7)',
      '--editor-text': '#000000',
      '--gutter-text-color': '#000000',
      '--statusbar-bg': 'rgba(246, 248, 250, 0.85)',
      '--statusbar-text': '#000000',
      '--header-bg': 'rgba(255, 255, 255, 0.8)',
      '--header-text': '#000000',
      '--sidebar-bg': 'rgba(246, 248, 250, 0.65)',
      '--sidebar-border': 'rgba(209, 217, 224, 0.3)',
      '--welcome-bg': 'rgba(255, 255, 255, 0.7)',
      '--welcome-text': '#000000',

      '--gutter-bg-color': 'rgba(246, 248, 250, 0.05)',
      '--gutter-border-color': 'rgba(3, 102, 214, 0.05)',
      '--activity-bar-bg': 'rgba(246, 248, 250, 0.6)',
      '--activity-bar-active-fg': '#000000',
      '--activity-bar-inactive-fg': 'rgba(0, 0, 0, 0.4)',
      '--activity-bar-active-border': '#0969da',
      '--activity-bar-badge-bg': '#0969da',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(255, 255, 255, 0.7)',
      sidebar: 'rgba(246, 248, 250, 0.65)',
      text: '#000000',
      accent: '#0366d6',
      border: 'rgba(3, 102, 214, 0.2)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
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
    description: 'Deep Cosmic Glass',
    colors: {
      '--color-bg-primary': 'rgba(13, 17, 23, 0.55)', // Glassy Midnight Void
      '--color-tooltip-bg': '#0d1117',
      '--color-bg-secondary': 'rgba(13, 17, 23, 0.45)',
      '--color-bg-tertiary': 'rgba(22, 27, 34, 0.45)',
      '--color-text-primary': '#c9d1d9',
      '--color-text-secondary': '#8b949e',
      '--color-text-tertiary': '#6e7681',
      '--color-accent-primary': '#58a6ff',
      '--color-border': 'rgba(88, 166, 255, 0.3)',
      '--hover-bg': 'rgba(88, 166, 255, 0.15)',
      '--hover-text': '#79c0ff',
      '--selected-bg': 'rgba(88, 166, 255, 0.25)',
      '--selected-text': '#a5d6ff',
      '--sidebar-text': '#c9d1d9',
      '--sidebar-header-text': '#8b949e',
      // Syntax Highlighting (Dark Mode)
      '--color-syntax-string': '#f1be36',
      '--color-syntax-variable': '#d946ef',
      '--color-syntax-number': '#fcd34d',
      '--color-syntax-boolean': '#d946ef',
      '--color-syntax-null': '#fef3c7',
      '--color-syntax-keyword': '#d946ef',
      '--color-syntax-comment': '#71717a',
      '--color-syntax-punctuation': '#a1a1aa',
      // Component-specific variables
      '--editor-bg': 'rgba(13, 17, 23, 0.55)',
      '--editor-text': '#c9d1d9',
      '--gutter-text-color': '#8b949e',
      '--statusbar-bg': 'rgba(13, 17, 23, 0.8)',
      '--statusbar-text': '#8b949e',
      '--header-bg': 'rgba(13, 17, 23, 0.7)',
      '--header-text': '#c9d1d9',
      '--sidebar-bg': 'rgba(13, 17, 23, 0.45)',
      '--sidebar-border': 'rgba(88, 166, 255, 0.2)',
      '--welcome-bg': 'rgba(13, 17, 23, 0.55)',
      '--welcome-text': '#c9d1d9',

      '--gutter-bg-color': 'rgba(13, 17, 23, 0.05)',
      '--gutter-border-color': 'rgba(88, 166, 255, 0.1)',
      '--activity-bar-bg': 'rgba(13, 17, 23, 0.5)',
      '--activity-bar-active-fg': '#58a6ff',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#58a6ff',
      '--activity-bar-badge-bg': '#58a6ff',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(13, 17, 23, 0.55)',
      sidebar: 'rgba(13, 17, 23, 0.45)',
      text: '#c9d1d9',
      accent: '#58a6ff',
      border: 'rgba(88, 166, 255, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
    },
    settings: {
      welcome: { welcomePage: '#161b22' },
      editor: { editorBgColor: '#0d1117' },
      gutter: { gutterBgColor: '#161b22', gutterBorderColor: '#30363d', gutterBorderWidth: 1 },
      cursor: { color: '#58a6ff' },
      livePreview: { bgColor: '#0d1117', borderColor: '#30363d', borderWidth: 1, borderRound: 4 },
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
      '--color-bg-primary': 'rgba(9, 9, 11, 0.55)', // Glassy Cosmic Void
      '--color-tooltip-bg': '#09090b',
      '--color-bg-secondary': 'rgba(9, 9, 11, 0.45)',
      '--color-bg-tertiary': 'rgba(24, 24, 27, 0.45)',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#e2e8f0',
      '--color-text-tertiary': '#94a3b8',
      '--color-accent-primary': '#d946ef', // Nebula Fuchsia
      '--color-border': 'rgba(217, 70, 239, 0.3)',
      '--hover-bg': 'rgba(217, 70, 239, 0.15)',
      '--hover-text': '#f0abfc',
      '--selected-bg': 'rgba(139, 92, 246, 0.4)', // Deep Violet Highlight (Fixed white issue)
      '--selected-text': '#ffffff',
      '--sidebar-text': '#ffffff',
      '--sidebar-header-text': '#e2e8f0',
      // Syntax Highlighting (Nebula)
      '--color-syntax-string': '#38bdf8',
      '--color-syntax-variable': '#818cf8',
      '--color-syntax-number': '#34d399',
      '--color-syntax-boolean': '#f472b6',
      '--color-syntax-null': '#94a3b8',
      '--color-syntax-keyword': '#818cf8',
      '--color-syntax-comment': '#64748b',
      '--color-syntax-punctuation': '#94a3b8',
      // Component-specific variables
      '--editor-bg': 'rgba(9, 9, 11, 0.55)',
      '--editor-text': '#ffffff',
      '--gutter-text-color': '#ffffff',
      '--statusbar-bg': 'rgba(9, 9, 11, 0.8)',
      '--statusbar-text': '#ffffff',
      '--header-bg': 'rgba(9, 9, 11, 0.7)',
      '--header-text': '#ffffff',
      '--sidebar-bg': 'rgba(9, 9, 11, 0.45)',
      '--sidebar-border': 'rgba(217, 70, 239, 0.2)',
      '--welcome-bg': 'rgba(9, 9, 11, 0.55)',
      '--welcome-text': '#ffffff',

      '--gutter-bg-color': 'rgba(9, 9, 11, 0.05)',
      '--gutter-border-color': 'rgba(217, 70, 239, 0.1)',
      '--activity-bar-bg': 'rgba(9, 9, 11, 0.5)',
      '--activity-bar-active-fg': '#d946ef',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#d946ef',
      '--activity-bar-badge-bg': '#d946ef',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(9, 9, 11, 0.55)',
      sidebar: 'rgba(9, 9, 11, 0.45)',
      text: '#ffffff',
      accent: '#d946ef',
      border: 'rgba(217, 70, 239, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
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
      '--color-bg-primary': 'rgba(23, 28, 25, 0.55)', // Glassy Forest Void
      '--color-tooltip-bg': '#1c1917',
      '--color-bg-secondary': 'rgba(23, 28, 25, 0.45)',
      '--color-bg-tertiary': 'rgba(34, 42, 38, 0.45)',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#ffffff',
      '--color-text-tertiary': '#ffffff',
      '--color-accent-primary': '#22c55e', // Forest Green
      '--color-border': 'rgba(34, 197, 94, 0.3)',
      '--hover-bg': 'rgba(34, 197, 94, 0.15)',
      '--hover-text': '#4ade80',
      '--selected-bg': 'rgba(34, 197, 94, 0.25)',
      '--selected-text': '#86efac',
      '--sidebar-text': '#ffffff',
      '--sidebar-header-text': '#ffffff',
      // Syntax Highlighting (Forest)
      '--color-syntax-string': '#fb923c',
      '--color-syntax-variable': '#f87171',
      '--color-syntax-number': '#fcd34d',
      '--color-syntax-boolean': '#f87171',
      '--color-syntax-null': '#d4d4d4',
      '--color-syntax-keyword': '#ef4444',
      '--color-syntax-comment': '#737373',
      '--color-syntax-punctuation': '#a3a3a3',
      // Component-specific variables
      '--editor-bg': 'rgba(23, 28, 25, 0.55)',
      '--editor-text': '#ffffff',
      '--gutter-text-color': '#ffffff',
      '--statusbar-bg': 'rgba(23, 28, 25, 0.8)',
      '--statusbar-text': '#ffffff',
      '--header-bg': 'rgba(23, 28, 25, 0.7)',
      '--header-text': '#ffffff',
      '--sidebar-bg': 'rgba(23, 28, 25, 0.45)',
      '--sidebar-border': 'rgba(34, 197, 94, 0.2)',
      '--welcome-bg': 'rgba(23, 28, 25, 0.55)',
      '--welcome-text': '#ffffff',

      '--gutter-bg-color': 'rgba(23, 28, 25, 0.05)',
      '--gutter-border-color': 'rgba(34, 197, 94, 0.1)',
      '--activity-bar-bg': 'rgba(23, 28, 25, 0.5)',
      '--activity-bar-active-fg': '#4ade80',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#22c55e',
      '--activity-bar-badge-bg': '#22c55e',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(23, 28, 25, 0.55)',
      sidebar: 'rgba(23, 28, 25, 0.45)',
      text: '#ffffff',
      accent: '#22c55e',
      border: 'rgba(34, 197, 94, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
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
    description: 'Luxurious Gold Glass',
    colors: {
      '--color-bg-primary': 'rgba(24, 24, 27, 0.55)', // Glassy Zinc Void
      '--color-tooltip-bg': '#18181b',
      '--color-bg-secondary': 'rgba(24, 24, 27, 0.45)',
      '--color-bg-tertiary': 'rgba(39, 39, 42, 0.45)',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-tertiary': '#71717a',
      '--color-accent-primary': '#f1be36', // Royal Gold
      '--color-border': 'rgba(241, 190, 54, 0.3)',
      '--hover-bg': 'rgba(241, 190, 54, 0.15)',
      '--hover-text': '#fbd24e',
      '--selected-bg': 'rgba(241, 190, 54, 0.25)',
      '--selected-text': '#ffffff',
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
      '--editor-bg': 'rgba(24, 24, 27, 0.55)',
      '--editor-text': '#ffffff',
      '--gutter-text-color': '#71717a',
      '--statusbar-bg': 'rgba(24, 24, 27, 0.8)',
      '--statusbar-text': '#f1be36',
      '--header-bg': 'rgba(24, 24, 27, 0.7)',
      '--header-text': '#ffffff',
      '--sidebar-bg': 'rgba(24, 24, 27, 0.45)',
      '--sidebar-border': 'rgba(241, 190, 54, 0.2)',
      '--welcome-bg': 'rgba(24, 24, 27, 0.55)',
      '--welcome-text': '#ffffff',

      '--gutter-bg-color': 'rgba(24, 24, 27, 0.05)',
      '--gutter-border-color': 'rgba(241, 190, 54, 0.1)',
      '--activity-bar-bg': 'rgba(24, 24, 27, 0.5)',
      '--activity-bar-active-fg': '#f1be36',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#f1be36',
      '--activity-bar-badge-bg': '#f1be36',
      '--activity-bar-badge-fg': '#18181b',
      background: 'rgba(24, 24, 27, 0.55)',
      sidebar: 'rgba(24, 24, 27, 0.45)',
      text: '#ffffff',
      accent: '#f1be36',
      border: 'rgba(241, 190, 54, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
    },
    settings: {
      welcome: { welcomePage: '#18181b' },
      editor: { editorBgColor: '#18181b' },
      gutter: { gutterBgColor: '#27272a', gutterBorderColor: '#3f3f46', gutterBorderWidth: 1 },
      cursor: { color: '#f1be36' },
      livePreview: { bgColor: '#18181b', borderColor: '#3f3f46', borderWidth: 1, borderRound: 4 },
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
      '--color-bg-primary': 'rgba(15, 23, 42, 0.55)', // Deep Sea Glass Void
      '--color-tooltip-bg': '#0f172a',
      '--color-bg-secondary': 'rgba(15, 23, 42, 0.45)',
      '--color-bg-tertiary': 'rgba(30, 41, 59, 0.45)',
      '--color-text-primary': '#f8fafc',
      '--color-text-secondary': '#94a3b8',
      '--color-text-tertiary': '#64748b',
      '--color-accent-primary': '#38bdf8', // Oceanic Cyan
      '--color-border': 'rgba(56, 189, 248, 0.3)',
      '--hover-bg': 'rgba(56, 189, 248, 0.15)',
      '--hover-text': '#7dd3fc',
      '--selected-bg': 'rgba(56, 189, 248, 0.25)',
      '--selected-text': '#bae6fd',
      '--sidebar-text': '#f8fafc',
      '--sidebar-header-text': '#94a3b8',
      // Syntax Highlighting
      '--color-syntax-string': '#38bdf8',
      '--color-syntax-variable': '#818cf8',
      '--color-syntax-number': '#34d399',
      '--color-syntax-boolean': '#f472b6',
      '--color-syntax-null': '#94a3b8',
      '--color-syntax-keyword': '#818cf8',
      '--color-syntax-comment': '#64748b',
      '--color-syntax-punctuation': '#94a3b8',
      // Components
      '--editor-bg': 'rgba(15, 23, 42, 0.55)',
      '--editor-text': '#f8fafc',
      '--gutter-text-color': '#64748b',
      '--statusbar-bg': 'rgba(15, 23, 42, 0.8)',
      '--statusbar-text': '#f8fafc',
      '--header-bg': 'rgba(15, 23, 42, 0.7)',
      '--header-text': '#f8fafc',
      '--sidebar-bg': 'rgba(15, 23, 42, 0.45)',
      '--sidebar-border': 'rgba(56, 189, 248, 0.2)',
      '--welcome-bg': 'rgba(15, 23, 42, 0.55)',
      '--welcome-text': '#f8fafc',
      '--gutter-bg-color': 'rgba(15, 23, 42, 0.05)',
      '--gutter-border-color': 'rgba(56, 189, 248, 0.1)',
      '--activity-bar-bg': 'rgba(15, 23, 42, 0.5)',
      '--activity-bar-active-fg': '#38bdf8',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#38bdf8',
      '--activity-bar-badge-bg': '#38bdf8',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(15, 23, 42, 0.55)',
      sidebar: 'rgba(15, 23, 42, 0.45)',
      text: '#f8fafc',
      accent: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
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
      '--color-bg-primary': 'rgba(28, 25, 23, 0.55)', // Glassy Ember Void
      '--color-tooltip-bg': '#171717',
      '--color-bg-secondary': 'rgba(28, 25, 23, 0.45)',
      '--color-bg-tertiary': 'rgba(45, 38, 32, 0.45)',
      '--color-text-primary': '#fafafa',
      '--color-text-secondary': '#a3a3a3',
      '--color-text-tertiary': '#737373',
      '--color-accent-primary': '#f97316', // Magma Orange
      '--color-border': 'rgba(249, 115, 22, 0.3)',
      '--hover-bg': 'rgba(249, 115, 22, 0.15)',
      '--hover-text': '#fb923c',
      '--selected-bg': 'rgba(249, 115, 22, 0.25)',
      '--selected-text': '#fdba74',
      '--sidebar-text': '#fafafa',
      '--sidebar-header-text': '#a3a3a3',
      // Syntax Highlighting
      '--color-syntax-string': '#fb923c',
      '--color-syntax-variable': '#f87171',
      '--color-syntax-number': '#fcd34d',
      '--color-syntax-boolean': '#f87171',
      '--color-syntax-null': '#d4d4d4',
      '--color-syntax-keyword': '#ef4444',
      '--color-syntax-comment': '#737373',
      '--color-syntax-punctuation': '#a3a3a3',
      // Components
      '--editor-bg': 'rgba(28, 25, 23, 0.55)',
      '--editor-text': '#fafafa',
      '--gutter-text-color': '#737373',
      '--statusbar-bg': 'rgba(28, 25, 23, 0.8)',
      '--statusbar-text': '#fafafa',
      '--header-bg': 'rgba(28, 25, 23, 0.7)',
      '--header-text': '#fafafa',
      '--sidebar-bg': 'rgba(28, 25, 23, 0.45)',
      '--sidebar-border': 'rgba(249, 115, 22, 0.2)',
      '--welcome-bg': 'rgba(28, 25, 23, 0.55)',
      '--welcome-text': '#fafafa',

      '--gutter-bg-color': 'rgba(28, 25, 23, 0.05)',
      '--gutter-border-color': 'rgba(249, 115, 22, 0.1)',
      '--activity-bar-bg': 'rgba(28, 25, 23, 0.5)',
      '--activity-bar-active-fg': '#f97316',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#ef4444',
      '--activity-bar-badge-bg': '#ef4444',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(28, 25, 23, 0.55)',
      sidebar: 'rgba(28, 25, 23, 0.45)',
      text: '#fafafa',
      accent: '#f97316',
      border: 'rgba(249, 115, 22, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
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
      '--color-bg-primary': 'rgba(255, 255, 255, 0.7)', // Steel Glass Void
      '--color-tooltip-bg': '#ffffff',
      '--color-bg-secondary': 'rgba(246, 246, 246, 0.6)',
      '--color-bg-tertiary': 'rgba(237, 237, 237, 0.5)',
      '--color-text-primary': '#000000',
      '--color-text-secondary': '#404040',
      '--color-text-tertiary': '#737373',
      '--color-accent-primary': '#000000',
      '--color-border': 'rgba(0, 0, 0, 0.1)',
      '--hover-bg': 'rgba(0, 0, 0, 0.05)',
      '--hover-text': '#000000',
      '--selected-bg': 'rgba(0, 0, 0, 0.1)',
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
      '--editor-bg': 'rgba(255, 255, 255, 0.7)',
      '--editor-text': '#000000',
      '--gutter-text-color': '#000000',
      '--statusbar-bg': 'rgba(246, 246, 246, 0.8)',
      '--statusbar-text': '#000000',
      '--header-bg': 'rgba(246, 246, 246, 0.7)',
      '--header-text': '#000000',
      '--sidebar-bg': 'rgba(246, 246, 246, 0.6)',
      '--sidebar-border': 'rgba(0, 0, 0, 0.05)',
      '--welcome-bg': 'rgba(255, 255, 255, 0.7)',
      '--welcome-text': '#000000',

      '--gutter-bg-color': 'rgba(246, 246, 246, 0.05)',
      '--gutter-border-color': 'rgba(0, 0, 0, 0.05)',
      '--activity-bar-bg': 'rgba(246, 246, 246, 0.6)',
      '--activity-bar-active-fg': '#000000',
      '--activity-bar-inactive-fg': '#737373',
      '--activity-bar-active-border': '#000000',
      '--activity-bar-badge-bg': '#000000',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(255, 255, 255, 0.7)',
      sidebar: 'rgba(246, 246, 246, 0.6)',
      text: '#000000',
      accent: '#000000',
      border: 'rgba(0, 0, 0, 0.1)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)'
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
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    icon: '🔮',
    description: 'Glassmorphism with Purple Glow',
    colors: {
      '--color-bg-primary': 'rgba(34, 30, 42, 0.5)', // Purple-tinted Void
      '--color-tooltip-bg': '#1e1e2e',
      '--color-bg-secondary': 'rgba(34, 30, 42, 0.4)',
      '--color-bg-tertiary': 'rgba(48, 44, 62, 0.45)',
      '--color-text-primary': '#dcddde',
      '--color-text-secondary': '#999999',
      '--color-text-tertiary': '#666666',
      '--color-accent-primary': '#7c3aed', // Obsidian Purple
      '--color-border': 'rgba(124, 58, 237, 0.3)',
      '--hover-bg': 'rgba(124, 58, 237, 0.15)',
      '--hover-text': '#a78bfa',
      '--selected-bg': 'rgba(124, 58, 237, 0.25)',
      '--selected-text': '#c4b5fd',
      '--sidebar-text': '#dcddde',
      '--sidebar-header-text': '#999999',
      // Syntax Highlighting (Vibrant Obsidian)
      '--color-syntax-string': '#ce9178',
      '--color-syntax-variable': '#9cdcfe',
      '--color-syntax-number': '#b5cea8',
      '--color-syntax-boolean': '#569cd6',
      '--color-syntax-null': '#569cd6',
      '--color-syntax-keyword': '#c586c0',
      '--color-syntax-comment': '#6a9955',
      '--color-syntax-punctuation': '#d4d4d4',
      // Component Variables
      '--editor-bg': 'rgba(34, 30, 42, 0.5)',
      '--editor-text': '#dcddde',
      '--gutter-text-color': '#4a4a4a',
      '--statusbar-bg': 'rgba(34, 30, 42, 0.8)',
      '--statusbar-text': '#666666',
      '--header-bg': 'rgba(34, 30, 42, 0.7)',
      '--header-text': '#dcddde',
      '--sidebar-bg': 'rgba(34, 30, 42, 0.4)',
      '--sidebar-border': 'rgba(124, 58, 237, 0.2)',
      '--welcome-bg': 'rgba(34, 30, 42, 0.5)',
      '--welcome-text': '#dcddde',
      '--gutter-bg-color': 'rgba(34, 30, 42, 0.05)',
      '--gutter-border-color': 'rgba(124, 58, 237, 0.1)',
      '--activity-bar-bg': 'rgba(34, 30, 42, 0.5)',
      '--activity-bar-active-fg': '#7c3aed',
      '--activity-bar-inactive-fg': '#404040',
      '--activity-bar-active-border': '#7c3aed',
      '--activity-bar-badge-bg': '#7c3aed',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(34, 30, 42, 0.5)',
      sidebar: 'rgba(34, 30, 42, 0.4)',
      text: '#dcddde',
      accent: '#7c3aed',
      border: 'rgba(124, 58, 237, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
    },
    settings: {
      welcome: { welcomePage: 'rgba(22, 22, 22, 0.85)' },
      editor: {
        editorBgColor: 'rgba(22, 22, 22, 0.85)',
        fontFamily: 'JetBrains Mono'
      },
      gutter: {
        gutterBgColor: 'rgba(22, 22, 22, 0.85)',
        gutterBorderColor: 'rgba(124, 58, 237, 0.2)',
        gutterBorderWidth: 1
      },
      cursor: { color: '#7c3aed' },
      livePreview: {
        bgColor: 'rgba(22, 22, 22, 0.85)',
        borderColor: 'rgba(124, 58, 237, 0.3)',
        borderWidth: 1,
        borderRound: 8
      },
      activityBar: {
        bgColor: 'rgba(32, 32, 32, 0.75)',
        activeFg: '#7c3aed',
        inactiveFg: '#404040',
        activeBorder: '#7c3aed',
        badgeBg: '#7c3aed',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: 'rgba(32, 32, 32, 0.85)',
        textColor: '#dcddde',
        iconColor: '#9f67ff',
        borderColor: 'rgba(124, 58, 237, 0.2)'
      },
      ui: {
        sidebarBg: 'rgba(32, 32, 32, 0.75)',
        sidebarIconColor: '#7c3aed',
        statusBarBg: 'rgba(32, 32, 32, 0.75)',
        footerBg: 'rgba(32, 32, 32, 0.75)',
        headerBg: 'rgba(32, 32, 32, 0.85)',
        commandPaletteBg: 'rgba(22, 22, 22, 0.95)'
      }
    },
    previewColors: ['bg-[#1a1a1a]', 'bg-[rgba(32,32,32,0.75)]', 'bg-purple-600']
  },
  {
    id: 'glass-blue',
    name: 'Glass Blue',
    icon: '💎',
    description: 'Glassmorphism with Blue Glow',
    colors: {
      '--color-bg-primary': 'rgba(30, 41, 59, 0.75)', // Unified Glassy Cobalt
      '--color-tooltip-bg': '#0f172a',
      '--color-bg-secondary': 'rgba(30, 41, 59, 0.65)',
      '--color-bg-tertiary': 'rgba(51, 65, 85, 0.5)',
      '--color-text-primary': '#f1f5f9',
      '--color-text-secondary': '#94a3b8',
      '--color-text-tertiary': '#64748b',
      '--color-accent-primary': '#3b82f6',
      '--color-border': 'rgba(59, 130, 246, 0.3)',
      '--hover-bg': 'rgba(59, 130, 246, 0.15)',
      '--hover-text': '#60a5fa',
      '--selected-bg': 'rgba(59, 130, 246, 0.3)',
      '--selected-text': '#93c5fd',
      '--sidebar-text': '#f1f5f9',
      '--sidebar-header-text': '#cbd5e1',
      // Search Highlighting
      '--search-match-bg': 'rgba(59, 130, 246, 0.3)',
      '--search-match-border': 'rgba(59, 130, 246, 0.5)',
      '--search-match-current-bg': 'rgba(59, 130, 246, 0.5)',
      '--search-match-current-border': 'rgba(147, 197, 253, 0.8)',
      // Livewire/Blade Syntax Highlighting
      '--color-syntax-string': '#38bdf8',
      '--color-syntax-variable': '#818cf8',
      '--color-syntax-number': '#fbbf24',
      '--color-syntax-boolean': '#f472b6',
      '--color-syntax-null': '#94a3b8',
      '--color-syntax-keyword': '#60a5fa',
      '--color-syntax-comment': '#475569',
      '--color-syntax-punctuation': '#cbd5e1',
      // Component-specific variables
      '--editor-bg': 'rgba(30, 41, 59, 0.75)', // Matches primary background
      '--editor-text': '#f1f5f9',
      '--gutter-text-color': '#475569',
      '--statusbar-bg': 'rgba(30, 41, 59, 0.9)',
      '--statusbar-text': '#94a3b8',
      '--header-bg': 'rgba(30, 41, 59, 0.8)',
      '--header-text': '#f1f5f9',
      '--sidebar-bg': 'rgba(30, 41, 59, 0.65)',
      '--sidebar-border': 'rgba(59, 130, 246, 0.2)',
      '--welcome-bg': 'rgba(30, 41, 59, 0.75)',
      '--welcome-text': '#f1f5f9',
      // Gutter variables
      '--gutter-bg-color': 'rgba(30, 41, 59, 0.05)', // Very subtle gutter
      '--gutter-border-color': 'rgba(59, 130, 246, 0.1)',
      '--activity-bar-bg': 'rgba(30, 41, 59, 0.7)',
      '--activity-bar-active-fg': '#3b82f6',
      '--activity-bar-inactive-fg': '#64748b',
      '--activity-bar-active-border': '#3b82f6',
      '--activity-bar-badge-bg': '#3b82f6',
      '--activity-bar-badge-fg': '#ffffff',
      background: 'rgba(30, 41, 59, 0.75)',
      sidebar: 'rgba(30, 41, 59, 0.65)',
      text: '#f1f5f9',
      accent: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.3)',
      // ENABLING GLASS BLUR
      backdropFilter: 'blur(16px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    },
    settings: {
      welcome: { welcomePage: 'rgba(30, 41, 59, 0.75)' },
      editor: {
        editorBgColor: 'rgba(15, 23, 42, 0.85)',
        fontFamily: 'JetBrains Mono'
      },
      gutter: {
        gutterBgColor: 'rgba(30, 41, 59, 0.75)',
        gutterBorderColor: 'rgba(59, 130, 246, 0.2)',
        gutterBorderWidth: 1
      },
      cursor: { color: '#3b82f6' },
      livePreview: {
        bgColor: 'rgba(15, 23, 42, 0.85)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        borderRound: 8
      },
      activityBar: {
        bgColor: 'rgba(30, 41, 59, 0.75)',
        activeFg: '#3b82f6',
        inactiveFg: 'rgba(241, 245, 249, 0.4)',
        activeBorder: '#3b82f6',
        badgeBg: '#3b82f6',
        badgeFg: '#ffffff'
      },
      header: {
        bgColor: 'rgba(15, 23, 42, 0.85)',
        textColor: '#f1f5f9',
        iconColor: '#60a5fa',
        borderColor: 'rgba(59, 130, 246, 0.2)'
      },
      ui: {
        sidebarBg: 'rgba(30, 41, 59, 0.75)',
        sidebarIconColor: '#3b82f6',
        statusBarBg: 'rgba(30, 41, 59, 0.75)',
        footerBg: 'rgba(30, 41, 59, 0.75)',
        headerBg: 'rgba(15, 23, 42, 0.85)',
        commandPaletteBg: 'rgba(15, 23, 42, 0.95)' // More opaque for readability
      }
    },
    previewColors: ['bg-[rgba(15,23,42,0.85)]', 'bg-[rgba(30,41,59,0.75)]', 'bg-blue-500']
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
  },
  'glass-blue': {
    hoverBg: 'rgba(59, 130, 246, 0.15)',
    hoverText: '#60a5fa',
    selectedBg: 'rgba(59, 130, 246, 0.25)',
    selectedText: '#93c5fd',
    sidebarText: '#f1f5f9',
    sidebarHeaderText: '#cbd5e1'
  }
}
