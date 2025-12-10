import React, { useState } from 'react'
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
        h-full bg-[#111111] border-r border-gray-800/50 
        flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden p-0'}
      `}
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
      <div className="mt-auto pt-4">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-3 border border-gray-800 hover:border-gray-700 transition-all">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-200">Dev User</span>
            <span className="text-[10px] text-gray-500">Pro Plan</span>
          </div>
          <ChevronRight size={16} className="ml-auto text-gray-600" />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
