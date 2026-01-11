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
  Zap,
  Lock
} from 'lucide-react'
import iconUrl from '../../../assets/icon.png'
import AutosaveIndicator from './AutosaveIndicator'
import WindowControls from '../../universal/WindowControls'
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
  onToggleZenFocus,
  actions, // New: slot for custom view-specific buttons (Right)
  centerActions, // New: slot for central search/controls
  isDirty, // New: show yellow dot for unsaved changes
  isReadOnly,
  isDoc
}) => {
  // Header is now fully fluid and top-level
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Check initial state
    const checkState = async () => {
      if (window.api?.isMaximized) {
        const result = await window.api.isMaximized()
        setIsMaximized(result)
      }
    }
    checkState()

    // Listen for changes
    let unsubs = []
    if (window.api?.onMaximized) {
      unsubs.push(window.api.onMaximized(() => setIsMaximized(true)))
    }
    if (window.api?.onUnmaximized) {
      unsubs.push(window.api.onUnmaximized(() => setIsMaximized(false)))
    }

    return () => unsubs.forEach((unsub) => unsub())
  }, [])

  const displayTitle = (() => {
    // Priority: snippetTitle (from prop) > title (from prop) > 'Dev Snippet'
    if (snippetTitle) return snippetTitle
    if (title && title !== 'Quick Snippets') return title
    return 'Dev Snippet'
  })()

  return (
    <header
      className="relative flex items-center h-[32px] select-none w-full"
      style={{
        backgroundColor: 'var(--color-bg-secondary)', // Unified with modal headers
        borderBottom: '1px solid var(--color-border)', // Standardized native-like border
        gap: 0,
        color: 'var(--header-text)',
        boxSizing: 'border-box'
      }}
    >
      {/* App Icon Area */}
      <div
        className="h-full flex items-center px-1 pb-1"
        style={{
          backgroundColor: 'transparent',
          borderRight: 'none',
          WebkitAppRegion: 'drag'
        }}
      >
        <div className="flex items-center w-full gap-1 px-1" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* App Icon/Logo - Top Left */}
          <div
            className="flex items-center justify-center mr-1 transition-opacity duration-200"
            style={{ opacity: 1 }}
          >
            <img
              src={iconUrl}
              alt="App Icon"
              className="w-4 h-4 object-contain"
              style={{}} // Remove filters to show original colors
            />
          </div>

          {/* <button
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
          </button> */}
        </div>
      </div>

      {/* Main Header Part - The Tab Bar Area */}
      <div className="flex-1 h-full flex items-end min-w-0 overflow-hidden relative">
        <div className="flex-1 h-full flex items-end px-0" style={{ WebkitAppRegion: 'drag' }}>
          <div className="flex items-end max-w-full h-full">
            <div
              className="h-full flex items-center justify-center"
              style={{
                WebkitAppRegion: 'no-drag',
                boxShadow: 'none',
                marginLeft: '6px', // Spacing from left
                zIndex: 10
              }}
            >
              <div className="flex items-center h-full px-2 opacity-60">
               <span className="text-[12px] font-medium">
                 Dev Snippet
               </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Area (e.g. Graph Search) */}
        {centerActions && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-end h-full pointer-events-none pb-1 z-[70]">
            <div className="pointer-events-auto" style={{ WebkitAppRegion: 'no-drag' }}>
              {centerActions}
            </div>
          </div>
        )}

        {/* Window Controls area - Absolute Top Right or Flex */}
        <div
          className="flex ml-auto flex-none absolute top-0 right-0 h-full"
          style={{ WebkitAppRegion: 'no-drag', zIndex: 50 }}
        >
          {/* Zen/Autosave Integration area - Always visible */}
          <div className="flex items-center h-full pr-2 gap-1.5 relative z-[60]">
            {/* View-specific actions (e.g. Magic Color for Graph) */}
            {actions && <div className="flex items-center gap-1 pr-1">{actions}</div>}

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

          {/* View/Window Controls Buttons - Standardized via WindowControls */}
          <WindowControls
            onMinimize={() => {
              try {
                window.api?.minimize?.()
              } catch (e) {}
            }}
            onMaximize={() => window.api?.toggleMaximize?.()}
            onClose={() => window.api?.closeWindow?.()}
            isMaximized={isMaximized}
            variant="app"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
