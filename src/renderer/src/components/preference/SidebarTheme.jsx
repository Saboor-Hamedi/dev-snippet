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

// Renders the ThemeSelector to manage application styling
const Sidebar = ({ onToggle }) => {
  return <ThemeSelector onClose={onToggle} />
}

export default Sidebar
