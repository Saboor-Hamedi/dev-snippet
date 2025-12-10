import React, { useState } from 'react'
import { Search, X, Plus, SearchCheckIcon } from 'lucide-react'

const ThemeSelector = () => {
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data to simulate the Warp themes
  // In a real app, these hex codes would come from your actual theme config
  const themes = [
    {
      id: 'adeberry',
      name: 'Adeberry',
      bg: '#1e1e1e',
      dir: '#61afef',
      exe: '#e06c75',
      file: '#abb2bf'
    },
    {
      id: 'phenomenon',
      name: 'Phenomenon',
      bg: '#0f111a',
      dir: '#89ddff',
      exe: '#f07178',
      file: '#eeffff'
    },
    {
      id: 'dark',
      name: 'Dark',
      bg: '#000000',
      dir: '#3b8eea',
      exe: '#cd3131',
      file: '#cccccc'
    },
    {
      id: 'dracula',
      name: 'Dracula',
      bg: '#282a36',
      dir: '#bd93f9',
      exe: '#ff5555',
      file: '#f8f8f2'
    }
  ]

  // Filter themes based on search
  const filteredThemes = themes.filter((theme) =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-full w-full flex-col bg-[#0b1215] p-2 text-gray-300 font-sans">
      {/* Themes List */}
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
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {filteredThemes.map((theme) => (
          <div key={theme.id} className="group cursor-pointer">
            {/* The "Terminal Preview" Card */}
            <div
              className="relative mb-2 overflow-hidden rounded-md border border-gray-800 transition-all group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              style={{ backgroundColor: theme.bg }}
            >
              {/* Terminal Content */}
              <div className="p-4 font-mono text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold">ls</span>
                </div>
                <div className="flex gap-4">
                  <span style={{ color: theme.dir }} className="font-semibold">
                    dir
                  </span>
                  <span style={{ color: theme.exe }}>executable</span>
                  <span style={{ color: theme.file }}>file</span>
                </div>

                {/* Blinking Cursor Line */}
                <div className="mt-4 flex items-center gap-1">
                  <div className="h-4 w-[2px] bg-cyan-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Theme Name */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                {theme.name}
              </span>
              {/* Optional: Checkmark if active */}
              {/* <Check size={14} className="text-cyan-500 opacity-0 group-hover:opacity-100" /> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ThemeSelector
