import React, { useEffect } from 'react'
import { useTheme } from '../hook/useTheme'

const themes = [
  {
    id: 'polaris',
    name: 'Polaris',
    icon: '☀️',
    description: 'Clean, professional, airy.',
    colors: {
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
