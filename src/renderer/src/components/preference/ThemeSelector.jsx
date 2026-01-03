import React, { useState, memo, useMemo, useEffect, useRef } from 'react'
import { Search, X, Check, Circle, PanelLeftClose, Palette } from 'lucide-react'
import { themeProps } from './theme/themeProps'
import SidebarHeader from '../layout/SidebarHeader'

const ThemeSelector = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { currentThemeId: contextThemeId, setTheme, themes } = themeProps()
  const [currentThemeId, setCurrentThemeId] = useState(contextThemeId)

  // Sync local state when context updates
  useEffect(() => {
    setCurrentThemeId(contextThemeId)
  }, [contextThemeId])

  // Filter themes based on search - memoized for performance
  const filteredThemes = useMemo(
    () => themes.filter((theme) => theme.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [themes, searchTerm]
  )

  const applyTheme = (theme) => {
    // Immediate local feedback for the tick mark
    setCurrentThemeId(theme.id)
    setTheme(theme.id)
  }

  return (
    <div
      className="flex h-full w-full flex-col p-0 text-gray-300 font-sans overflow-hidden"
      style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
    >
      <SidebarHeader className="z-10 relative pr-1 border-b border-[var(--color-border)] pb-3 pt-1 px-1">
        <div className="flex items-center gap-2 w-full">
          <div className="relative group flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 group-focus-within:opacity-70 transition-opacity text-[var(--color-text-primary)]" />
            <input
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[8px] py-1.5 pl-8 pr-4 text-[12px] outline-none border border-transparent focus:border-[var(--color-accent-primary)]/30 bg-[var(--color-bg-tertiary)] hover:brightness-110 focus:brightness-125 text-[var(--color-text-primary)] placeholder:text-[11px] placeholder:opacity-30 transition-all focus:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.1)]"
            />
          </div>
        </div>
      </SidebarHeader>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {filteredThemes.map((theme) => {
          const isActive = currentThemeId === theme.id

          return (
            <div key={theme.id} className="group cursor-pointer" onClick={() => applyTheme(theme)}>
              <div
                className={`relative mb-2 overflow-hidden border group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] ${
                  isActive
                    ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'border-gray-800'
                }`}
                style={{ backgroundColor: theme.colors.background }}
              >
                {/* Terminal Content */}
                <div className="p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-bold">ls</span>
                  </div>
                  <div className="flex gap-4">
                    <span style={{ color: theme.colors.accent }} className="font-semibold">
                      dir
                    </span>
                    <span style={{ color: theme.colors['--color-accent-primary'] }}>
                      executable
                    </span>
                    <span style={{ color: theme.colors.text }}>file</span>
                  </div>

                  {/* Blinking Cursor Line */}
                  <div className="mt-4 flex items-center gap-1">
                    <div className="h-4 w-[2px] bg-cyan-500 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Theme Name and Icon */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{theme.icon}</span>
                  <span
                    className={`text-sm font-medium ${isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'} transition-colors`}
                  >
                    {theme.name}
                  </span>
                </div>
                {isActive ? (
                  <Check size={14} className="text-cyan-400" />
                ) : (
                  <Circle
                    size={10}
                    className="text-gray-600 transition-colors group-hover:text-gray-400"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 px-1">{theme.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeSelector
