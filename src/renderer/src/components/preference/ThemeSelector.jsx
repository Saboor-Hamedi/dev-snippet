import React, { useState, memo, useMemo, useEffect, useRef } from 'react'
import { Search, X, Check, Circle, PanelLeftClose, Palette, Plus } from 'lucide-react'
import { themeProps } from './theme/themeProps'
import {
  SidebarPane,
  SidebarHeader as PaneHeader,
  SidebarBody
} from '../layout/SidebarPane/SidebarPane'

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

    // Shield the editor from the resulting settings change to prevent jumping
    window.__isSavingSettings = true
    setTimeout(() => {
      window.__isSavingSettings = false
    }, 1500)

    setTheme(theme.id)
  }

  return (
    <SidebarPane className="overflow-hidden">
      <PaneHeader className="pr-1 pb-3 pt-1 px-1">
        <div className="flex items-center gap-2 w-full">
          <div className="relative group flex-1 h-7">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-70 transition-opacity text-[var(--color-text-primary)] pointer-events-none">
              <Search size={12} />
            </div>
            <input
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full rounded-[5px] pl-8 pr-8 text-[12px] outline-none border border-transparent focus:border-[var(--color-accent-primary)]/30 bg-[var(--color-bg-tertiary)] hover:brightness-110 focus:brightness-125 text-[var(--color-text-primary)] placeholder:text-[11px] placeholder:opacity-30 transition-all focus:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.1)]"
            />
          </div>
          {/* Action Icons - Matched Container */}
          <div className="flex items-center gap-px shrink-0">
            <button
              onClick={() => {
                // Placeholder for 'Create Custom Theme' or similar action
                // Using openModal here would allow checking if modal works
              }}
              className="h-7 w-7 flex items-center justify-center rounded-[5px] opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn shrink-0"
              title="Create Custom Theme"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <Plus
                size={14}
                strokeWidth={2.5}
                className="group-hover/btn:scale-110 transition-transform"
              />
            </button>
          </div>
        </div>
      </PaneHeader>

      <SidebarBody>
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
      </SidebarBody>
    </SidebarPane>
  )
}

export default ThemeSelector
