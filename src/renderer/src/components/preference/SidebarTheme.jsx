import React, { useState, memo } from 'react'
import { Search, X, Plus } from 'lucide-react'
import {
  Home,
  Layers,
  Command,
  Settings,
  ChevronRight,
  SearchCheck,
  PlusCircle
} from 'lucide-react' // Assuming you use lucide-react or similar icons
import ThemeSelector from './ThemeSelector'
const Sidebar = ({ isOpen = true }) => {
  // Navigation Items Data

  return (
    <aside
      className={`
        h-full border-r flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64 opacity-100 p-2' : 'w-0 opacity-0 overflow-hidden'}
      `}
      style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
    >
      {/* Header / Brand */}
      {/* Header */}
      <div>
        <div className="flex gap-3 text-cyan-400 justify-between w-full mt-2">
          <div className="font-mono text-sm tracking-wider flex items-center gap-2 ml-2 font-bold uppercase opacity-80">
            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            Themes
          </div>
          <div className="mr-2">
            <button className="rounded-md p-1 hover:bg-gray-800 transition focus:ring-0 focus:outline-none">
              <PlusCircle size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Cards Container */}
      <ThemeSelector />

      {/* Bottom Profile Card */}
      
    </aside>
  )
}

export default memo(Sidebar)
