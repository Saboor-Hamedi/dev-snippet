import React, { useState, memo, useMemo, useEffect, useRef } from 'react'
import { Search, X, Plus, Check, Circle, PanelLeftClose } from 'lucide-react'
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
      className="flex h-full w-full flex-col p-0 text-gray-300 font-sans"
      style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
    >
      <SidebarHeader className="gap-2 z-10 relative">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-1.5 pl-8 pr-4 text-[12px] outline-none ring-1 ring-transparent focus:ring-[var(--color-accent-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder:text-xtiny placeholder-[var(--color-text-secondary)]"
          />
          <div className="absolute right-3 top-1/2 h-3 w-[1px] -translate-y-1/2 bg-cyan-500 animate-pulse" />
        </div>
      </SidebarHeader>

      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
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
