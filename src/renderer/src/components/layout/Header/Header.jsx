import React, { useState, useEffect } from 'react'
import {
  X,
  Minimize, // Used for restore
  Maximize, // New
  Minus, // New
  Minimize2, // Used for compact toggle
  Code2,
  PanelLeft,
  PanelLeftClose,
  FolderPlus,
  Search,
  Save,
  File,
  FilePlus,
  Star,
  Zap
} from 'lucide-react'
import iconUrl from '../../../assets/icon.png'
import AutosaveIndicator from './AutosaveIndicator'
import '../../../assets/css/header.css'
import { getFileIcon } from '../../../utils/iconUtils'

const Header = ({
  isCompact,
  onToggleCompact,
  title,
  snippetTitle,
  isFavorited,
  autosaveStatus,
  isSidebarOpen,
  onToggleSidebar,
  onSave,
  onNewSnippet,
  onNewFolder,
  onSearch,
  onRename,
  isTab,
  sidebarWidth = 250,
  onClose,
  showPreview,
  onTogglePreview,
  isResizing, // New prop
  isZenFocus,
  onToggleZenFocus
}) => {
  const isMobile = window.innerWidth <= 768
  const activityBarWidth = 48 // Match Workbench

  // Use CSS variable for ultra-smooth syncing if available
  const sidebarSectionWidth =
    isSidebarOpen && !isMobile
      ? `calc(var(--sidebar-width, ${sidebarWidth}px) + ${activityBarWidth}px)`
      : `${activityBarWidth}px`

  const displayTitle = (() => {
    if (snippetTitle && title) {
      if (snippetTitle === title) return snippetTitle
      return `${snippetTitle} - ${title}`
    }
    return title || snippetTitle || 'Untitled'
  })()

  return (
    <header
      className="relative flex items-end h-[38px] select-none"
      style={{
        backgroundColor: 'var(--header-bg)', // Use themeable header-bg
        borderBottom: 'none',
        gap: 0,
        color: 'var(--header-text)',
        boxSizing: 'border-box'
      }}
    >
      {/* Sidebar Header Part - Aligned with Sidebar/ActivityBar */}
      <div
        id="header-sidebar-section"
        className={`h-full flex items-center px-1 pb-1 ${isResizing ? '' : 'transition-[width] duration-200 ease-in-out'}`}
        style={{
          width: sidebarSectionWidth,
          backgroundColor: 'transparent',
          borderRight: 'none',
          WebkitAppRegion: 'drag'
        }}
      >
        <div className="flex items-center w-full gap-2 px-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={isZenFocus ? null : onToggleSidebar}
            disabled={isZenFocus}
            className={`theme-exempt bg-transparent flex items-center focus:outline-none justify-center p-1 rounded-md transition-all ${
              isZenFocus
                ? 'opacity-20 cursor-not-allowed'
                : 'opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] cursor-pointer'
            }`}
            style={{ color: 'var(--header-icon-color, var(--header-text))' }}
            title={
              isZenFocus
                ? 'Sidebar disabled in Zen Focus'
                : isSidebarOpen
                  ? 'Hide Sidebar'
                  : 'Show Sidebar'
            }
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Main Header Part - The Tab Bar Area */}
      <div className="flex-1 h-full flex items-end min-w-0 overflow-hidden relative">
        <div className="flex-1 h-full flex items-end px-0" style={{ WebkitAppRegion: 'drag' }}>
          <div className="flex items-end max-w-full h-full">
            {isTab ? (
              <div
                className="
                  group relative flex items-center gap-2 px-3 mx-0
                  h-[calc(100%-4px)] /* Leave space at top */
                  mt-[4px] /* Push down from top edge */
                  min-w-[140px] max-w-[220px]
                  bg-[var(--color-bg-primary)] 
                  rounded-t-lg
                  rounded-b-none
                  cursor-default
                  select-none
                  transition-all duration-200
                "
                style={{
                  WebkitAppRegion: 'no-drag',
                  boxShadow: 'none',
                  marginBottom: '0px'
                }}
                onDoubleClick={() => onRename && onRename()}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {(() => {
                    const { icon: FileIcon, color: iconColor } = getFileIcon(null, displayTitle)
                    return (
                      <FileIcon
                        size={14}
                        className="flex-none transition-opacity"
                        style={{ color: iconColor }}
                      />
                    )
                  })()}
                  <span
                    className="text-[13px] truncate font-medium opacity-90 block normal-case"
                    style={{ color: 'var(--header-text, var(--color-text-primary))' }}
                  >
                    {typeof displayTitle === 'string'
                      ? displayTitle.replace(/\.[^/.]+$/, '')
                      : 'Untitled'}
                  </span>
                  {/* Favorite star next to tab title if present */}
                  {typeof isFavorited !== 'undefined' && isFavorited && (
                    <Star
                      size={12}
                      className="ml-2 text-[var(--color-accent-primary)] fill-current"
                    />
                  )}
                </div>

                {/* Close Button - Always visible but subtle, or hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose && onClose()
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="
                    ml-1 p-0.5 rounded-md
                    opacity-0 group-hover:opacity-100
                    hover:bg-[var(--color-bg-tertiary)]
                    text-[var(--header-text, var(--color-text-primary))]
                    transition-all
                    flex items-center justify-center
                  "
                >
                  <X size={14} className="opacity-70" />
                </button>

                {/* Active Tab Accent - Top 2px, inset slightly */}
                <div className="absolute top-0 left-2 right-2 h-[2px] bg-[var(--color-accent-primary)] rounded-b-sm" />
              </div>
            ) : (
              <div className="flex items-center h-full pb-1 pl-4 opacity-60">
                <span className="text-[12px] font-medium">
                  {typeof displayTitle === 'string' ? displayTitle : 'Quick Snippets'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Window Controls area - Absolute Top Right or Flex */}
        <div
          className="flex ml-auto flex-none absolute top-0 right-0 h-full"
          style={{ WebkitAppRegion: 'no-drag', zIndex: 50 }}
        >
          {/* Zen/Autosave Integration area - Always visible */}
          <div className="flex items-center h-full pr-2 gap-1.5 relative z-[60]">
            <button
              onClick={onToggleZenFocus}
              className={`theme-exempt bg-transparent p-1 rounded-md transition-all flex items-center justify-center ${
                isZenFocus
                  ? 'text-[var(--color-accent-primary)] opacity-100'
                  : 'text-[var(--header-icon-color, var(--header-text))] opacity-40 hover:opacity-100 hover:bg-white/5'
              }`}
              title={isZenFocus ? 'Exit Focus Mode' : 'Enter Zen Focus (Dim)'}
            >
              <Zap size={15} fill={isZenFocus ? 'currentColor' : 'none'} />
            </button>
            <AutosaveIndicator status={autosaveStatus} />
          </div>

          {/* View/Window Controls Buttons - Dimmed in Zen Focus via CSS */}
          <div className="flex h-full header-window-controls">
            <button
              onClick={() => {
                try {
                  window.api?.minimize?.()
                } catch (e) {}
              }}
              className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-white/5"
              style={{ color: 'var(--header-icon-color, var(--header-text))' }}
              title="Minimize"
            >
              <Minus size={14} />
            </button>

            <button
              onClick={() => window.api?.toggleMaximize?.()}
              className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-white/5"
              style={{ color: 'var(--header-icon-color, var(--header-text))' }}
              title="Maximize"
            >
              <Minimize size={14} />
            </button>

            <button
              onClick={() => window.api?.closeWindow?.()}
              className="theme-exempt bg-transparent h-full w-12 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-red-500 hover:text-white"
              style={{ color: 'var(--header-icon-color, var(--header-text))' }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
