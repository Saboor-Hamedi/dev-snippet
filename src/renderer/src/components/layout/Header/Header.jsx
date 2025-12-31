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
  Star
} from 'lucide-react'
import iconUrl from '../../../assets/icon.png'
import AutosaveIndicator from './AutosaveIndicator'
import '../../../assets/css/header.css'

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
  showPreview, // New prop
  onTogglePreview // New prop
}) => {
  const isMobile = window.innerWidth <= 768
  const activityBarWidth = 40
  const sidebarAreaWidth =
    isSidebarOpen && !isMobile ? activityBarWidth + sidebarWidth : activityBarWidth

  const displayTitle = (() => {
    if (snippetTitle && title) {
      if (snippetTitle === title) return snippetTitle
      return `${snippetTitle} - ${title}`
    }
    return title || snippetTitle || 'Untitled'
  })()

  return (
    <header
      className="relative flex items-end h-[38px] select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-secondary)', // Header matches app frame (darker)
        borderBottom: '1px solid var(--color-border)', // Subtle separation from editor
        gap: 0,
        color: 'var(--header-text)',
        boxSizing: 'border-box'
      }}
    >
      {/* Sidebar Header Part - Aligned with Sidebar/ActivityBar */}
      <div
        className="h-full flex items-center px-1 transition-all duration-300 ease-in-out pb-1"
        style={{
          width: sidebarAreaWidth,
          backgroundColor: 'transparent',
          borderRight: '1px solid var(--color-border)', // Match border
          WebkitAppRegion: 'drag'
        }}
      >
        <div className="flex items-center w-full gap-2 px-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={onToggleSidebar}
            className="theme-exempt bg-transparent flex items-center focus:outline-none justify-center p-1 rounded-md transition-colors cursor-pointer opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--header-text)' }}
            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
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
                  boxShadow:
                    '0 -1px 0 var(--color-border), 1px 0 0 var(--color-border), -1px 0 0 var(--color-border)',
                  marginBottom: '0px'
                }}
                onDoubleClick={() => onRename && onRename()}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File
                    size={14}
                    className="flex-none opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--color-accent-primary)' }}
                  />
                  <span
                    className="text-[13px] truncate font-medium opacity-90 block normal-case"
                    style={{ color: 'var(--color-text-primary)' }}
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
                    text-[var(--color-text-primary)]
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
          {/* Zen/Autosave Integration area */}
          <div className="flex items-center h-full pr-2">
            <AutosaveIndicator status={autosaveStatus} />
          </div>

          {/* Custom Toggle: Compact vs Full */}
          <button
            onClick={() => {
              try {
                window.api?.minimize?.()
              } catch (e) {}
            }}
            className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-white/5"
            style={{ color: 'var(--header-text)' }}
            title="Minimize"
          >
            <Minus size={14} />
          </button>

          <button
            onClick={() => window.api?.toggleMaximize?.()}
            className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-white/5"
            style={{ color: 'var(--header-text)' }}
            title="Maximize"
          >
            <Minimize size={14} />
          </button>

          <button
            onClick={() => window.api?.closeWindow?.()}
            className="theme-exempt bg-transparent h-full w-12 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-red-500 hover:text-white"
            style={{ color: 'var(--header-text)' }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
