import React, { useEffect } from 'react'
import { useTheme } from '../hook/useTheme'
const themes = [
  {
    id: 'light',
    name: 'Light Modern',
    icon: '☀️',
    description: 'Clean and bright, perfect for well-lit environments.',
    previewColors: ['bg-white', 'bg-slate-100', 'bg-primary-500']
  },
  {
    id: 'dark',
    name: 'Dark Modern',
    icon: '🌙',
    description: 'Easy on the eyes, high contrast for coding.',
    previewColors: ['bg-slate-900', 'bg-slate-800', 'bg-primary-900']
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    icon: '🌌',
    description: 'Deep purple tones for a mystical coding vibe.',
    previewColors: ['bg-[#0f0518]', 'bg-[#1e0a2e]', 'bg-purple-500']
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    icon: '🌊',
    description: 'Calming teal and blue shades for focus.',
    previewColors: ['bg-[#04181d]', 'bg-[#082f3a]', 'bg-cyan-500']
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
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Select Color Theme
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose a theme that fits your style.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            // Extracted classes for readability
            const activeClasses =
              'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 ring-1 ring-primary-500/50'
            const inactiveClasses =
              'border-slate-200 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'

            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
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
                    <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
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

                {/* Color Preview Swatches */}
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
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThemeModal
