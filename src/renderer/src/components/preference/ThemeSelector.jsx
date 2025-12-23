import React, { useState, memo, useMemo, useEffect, useRef } from 'react'
import { Search, X, Plus, SearchCheckIcon, Check, Circle } from 'lucide-react'
import { themeProps } from './theme/themeProps'

const ThemeSelector = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { currentThemeId, setTheme, themes } = themeProps()
  const scrollRef = useRef(null)

  // Filter themes based on search - memoized for performance
  const filteredThemes = useMemo(
    () => themes.filter((theme) => theme.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [themes, searchTerm]
  )

  // Scroll to bottom to show the last theme
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filteredThemes])

  const applyTheme = async (theme) => {
    setTheme(theme.id)
  }

  return (
    <div
      className="flex h-full w-full flex-col p-2 text-gray-300 font-sans"
      style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
    >
      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchCheckIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search themes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md bg-[#161b22] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-transparent focus:ring-cyan-500 transition-all"
        />
        <div className="absolute right-3 top-1/2 h-4 w-[1px] -translate-y-1/2 bg-cyan-500 animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar" ref={scrollRef}>
        {filteredThemes.map((theme) => {
          const isActive = currentThemeId === theme.id

          return (
            <div key={theme.id} className="group cursor-pointer" onClick={() => applyTheme(theme)}>
              <div
                className={`relative mb-2 overflow-hidden rounded-md border transition-all group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] ${
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
                  <Check size={12} className="text-cyan-400" />
                ) : (
                  <Circle size={12} className="text-gray-500" />
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

export default memo(ThemeSelector)
