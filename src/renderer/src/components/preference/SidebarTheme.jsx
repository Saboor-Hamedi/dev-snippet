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
import SidebarHeader from '../layout/SidebarHeader'

const Sidebar = ({ isOpen = true, onToggle }) => {
  return (
    <div
      className="h-full flex flex-col w-full"
      style={{
        backgroundColor: 'var(--sidebar-bg)'
      }}
    >
      <div className="flex-1 overflow-hidden h-full">
        <ThemeSelector onClose={onToggle} />
      </div>
    </div>
  )
}

export default Sidebar
