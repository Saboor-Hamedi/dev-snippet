import React, { useEffect } from 'react'
import { useTheme } from '../hook/useTheme'

const themes = [
  {
    id: 'polaris',
    name: 'Polaris',
    icon: '☀️',
    description: 'Clean, professional, airy.',
    colors: {
      '--color-bg-primary': '#ffffff',
      '--color-bg-secondary': '#f8fafc',
      '--color-bg-tertiary': '#f1f5f9',
      '--color-text-primary': '#0f172a',
      '--color-text-secondary': '#475569',
      '--color-text-tertiary': '#64748b',
      '--color-accent-primary': '#0ea5e9',
      '--color-border': '#e2e8f0',
      '--hover-bg': '#f1f5f9',
      '--hover-text': '#1e293b',
      '--selected-bg': '#e0f2fe',
      '--selected-text': '#0284c7',
      '--sidebar-text': '#334155',
      '--sidebar-header-text': '#475569',
      background: '#ffffff',
      sidebar: '#f8fafc',
      text: '#0f172a',
      accent: '#0ea5e9',
      border: '#e2e8f0'
    },
    previewColors: ['bg-white', 'bg-slate-100', 'bg-sky-500']
  },
  {
    id: 'midnight-pro',
    name: 'Midnight Pro',
    icon: '🌙',
    description: 'Standard developer dark mode.',
    colors: {
      '--color-bg-primary': '#0d1117',
      '--color-bg-secondary': '#161b22',
      '--color-bg-tertiary': '#21262d',
      '--color-text-primary': '#c9d1d9',
      '--color-text-secondary': '#8b949e',
      '--color-text-tertiary': '#6e7681',
      '--color-accent-primary': '#58a6ff',
      '--color-border': '#30363d',
      '--hover-bg': '#21262d',
      '--hover-text': '#ffffff',
      '--selected-bg': '#30363d',
      '--selected-text': '#ffffff',
      '--sidebar-text': '#c9d1d9',
      '--sidebar-header-text': '#8b949e',
      background: '#0d1117',
      sidebar: '#161b22',
      text: '#c9d1d9',
      accent: '#58a6ff',
      border: '#30363d'
    },
    previewColors: ['bg-[#0d1117]', 'bg-[#161b22]', 'bg-blue-500']
  },
  {
    id: 'nebula',
    name: 'Nebula',
    icon: '🪐',
    description: 'High contrast, futuristic, neon.',
    colors: {
      '--color-bg-primary': '#09090b',
      '--color-bg-secondary': '#18181b',
      '--color-bg-tertiary': '#27272a',
      '--color-text-primary': '#e4e4e7',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-tertiary': '#71717a',
      '--color-accent-primary': '#d946ef',
      '--color-border': '#27272a',
      '--hover-bg': 'rgba(217,70,239,0.15)',
      '--hover-text': '#f4f4f5',
      '--selected-bg': 'rgba(217,70,239,0.25)',
      '--selected-text': '#fafafa',
      '--sidebar-text': '#e4e4e7',
      '--sidebar-header-text': '#a1a1aa',
      background: '#09090b',
      sidebar: '#18181b',
      text: '#e4e4e7',
      accent: '#d946ef',
      border: '#27272a'
    },
    previewColors: ['bg-[#09090b]', 'bg-[#18181b]', 'bg-fuchsia-500']
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    description: 'Calming, natural, warm.',
    colors: {
      '--color-bg-primary': '#1c1917',
      '--color-bg-secondary': '#292524',
      '--color-bg-tertiary': '#44403c',
      '--color-text-primary': '#e7e5e4',
      '--color-text-secondary': '#d6d3d1',
      '--color-text-tertiary': '#a8a29e',
      '--color-accent-primary': '#22c55e',
      '--color-border': '#44403c',
      '--hover-bg': 'rgba(34,197,94,0.15)',
      '--hover-text': '#f5f5f4',
      '--selected-bg': 'rgba(34,197,94,0.25)',
      '--selected-text': '#fafaf9',
      '--sidebar-text': '#e7e5e4',
      '--sidebar-header-text': '#d6d3d1',
      background: '#1c1917',
      sidebar: '#292524',
      text: '#e7e5e4',
      accent: '#22c55e',
      border: '#44403c'
    },
    previewColors: ['bg-[#1c1917]', 'bg-[#292524]', 'bg-emerald-500']
  }
]

const ThemeModal = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme } = useTheme()

  // Handle Escape Key
  useEffect(() => {
    const handleEsc = (e) => (e.key === 'Escape' ? onClose() : null)
    if (isOpen) window.removeEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Content: Added onClick stopPropagation so clicking inside doesn't close it */}
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-200">Theme</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              The UI uses a clean all‑black theme with soft, readable text.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            aria-label="Close modal"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Theme Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => {
            const isActive = currentTheme === theme.id

            const activeClasses = 'border-[#30363d] bg-[#161b22] ring-1 ring-[#30363d]'
            const inactiveClasses = 'border-[#30363d] hover:bg-[#161b22]'

            return (
              <button
                key={theme.id}
                onClick={async () => {
                  // Apply ALL CSS variables to document root for comprehensive theming
                  const root = document.documentElement
                  
                  // Clear any existing theme classes
                  root.classList.remove('dark')
                  
                  // Apply CSS custom properties
                  Object.entries(theme.colors).forEach(([key, value]) => {
                    if (key.startsWith('--')) {
                      root.style.setProperty(key, value)
                      console.log('🎨 Setting CSS variable:', key, '=', value)
                    }
                  })
                  
                  // Force specific variables for better reliability
                  if (theme.id === 'polaris') {
                    root.style.setProperty('--sidebar-header-text', '#475569')
                    root.style.setProperty('--color-text-primary', '#0f172a')
                    root.style.setProperty('--color-text-secondary', '#475569')
                    console.log('🌟 Applied Polaris theme overrides')
                  }
                  
                  // Apply legacy CSS variables for compatibility
                  root.style.setProperty('--color-background', theme.colors.background)
                  root.style.setProperty('--color-background-soft', theme.colors.sidebar)
                  root.style.setProperty('--color-text', theme.colors.text)
                  root.style.setProperty('--text-main', theme.colors.text)
                  root.style.setProperty('--accent', theme.colors.accent)
                  root.style.setProperty('--border-color', theme.colors.border)
                  
                  // Apply selection colors from theme CSS variables
                  if (theme.colors['--selected-bg']) root.style.setProperty('--selected-bg', theme.colors['--selected-bg'])
                  if (theme.colors['--selected-text']) root.style.setProperty('--selected-text', theme.colors['--selected-text'])
                  if (theme.colors['--hover-bg']) root.style.setProperty('--hover-bg', theme.colors['--hover-bg'])
                  if (theme.colors['--hover-text']) root.style.setProperty('--hover-text', theme.colors['--hover-text'])
                  
                  // Set dark class for non-light themes
                  if (theme.id !== 'polaris') {
                    root.classList.add('dark')
                  }
                  
                  // Set theme attribute for CSS selectors
                  root.setAttribute('data-theme', theme.id)
                  
                  // Force body background update
                  document.body.style.backgroundColor = theme.colors.background
                  document.body.style.color = theme.colors.text
                  
                  setTheme(theme.id, theme.colors)
                  if (window.api?.saveTheme) {
                    await window.api.saveTheme({
                      id: 'current',
                      name: theme.id,
                      colors: JSON.stringify(theme.colors)
                    })
                  }
                }}
                className={`relative group flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isActive ? activeClasses : inactiveClasses
                }`}
                aria-pressed={isActive}
              >
                <div className="flex items-start justify-between mb-3 w-full">
                  <span className="text-3xl" role="img" aria-label={theme.name}>
                    {theme.icon}
                  </span>
                  {isActive && (
                    <span className="bg-[#30363d] text-white text-[10px] font-semibold px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>

                <h3
                  className={`font-medium text-lg mb-1 ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-white'}`}
                >
                  {theme.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {theme.description}
                </p>

                <div className="flex gap-2 mt-auto pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                  {theme.previewColors.map((colorClass, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-6 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${colorClass}`}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-slate-200 font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThemeModal
