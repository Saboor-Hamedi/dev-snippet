import React, { memo } from 'react'
import ThemeSelector from './ThemeSelector'

/**
 * SidebarTheme - Wrapper for ThemeSelector to match the Explorer structure (SnippetSidebar).
 * This ensures that switching tabs maintains an identical workbench layout.
 */
const SidebarTheme = ({ isOpen, onToggle }) => {
  return <ThemeSelector onClose={onToggle} />
}

export default memo(SidebarTheme)
