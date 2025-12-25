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
  FilePlus
} from 'lucide-react'
import iconUrl from '../../assets/icon.png'

const AutosaveIndicator = ({ status }) => {
  const [localStatus, setLocalStatus] = useState(status)

  useEffect(() => {
    setLocalStatus(status)
  }, [status])

  useEffect(() => {
    const handleStatus = (e) => {
      setLocalStatus(e.detail?.status)
    }
    window.addEventListener('autosave-status', handleStatus)
    return () => window.removeEventListener('autosave-status', handleStatus)
  }, [])

  // Auto-hide "Saved" after 2 seconds
  useEffect(() => {
    if (localStatus === 'saved') {
      const timer = setTimeout(() => {
        setLocalStatus(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [localStatus])

  if (!localStatus) return null

  return (
    <div
      className="flex items-center ml-1 pl-2 transition-opacity duration-300"
      style={{ borderLeft: '1px solid var(--color-border)' }}
    >
      <small className="whitespace-nowrap opacity-60 text-[10px] font-medium">
        {localStatus === 'pending' && '...'}
        {localStatus === 'saving' && 'Saving...'}
        {localStatus === 'saved' && 'Saved'}
        {localStatus === 'error' && <span className="text-red-400">Error</span>}
      </small>
    </div>
  )
}

const Header = ({
  isCompact,
  onToggleCompact,
  title,
  snippetTitle,
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
  onClose
}) => {
  const activityBarWidth = 48
  const sidebarAreaWidth = isSidebarOpen ? activityBarWidth + sidebarWidth : activityBarWidth

  const displayTitle = snippetTitle ? `${snippetTitle} - ${title}` : title

  return (
    <header
      className="flex items-center h-[34px] select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--color-border)',
        gap: 0,
        color: 'var(--header-text)',
        boxSizing: 'border-box'
      }}
    >
      {/* Sidebar Header Part - Aligned with Sidebar/ActivityBar */}
      <div
        className="h-full flex items-center px-1 transition-all duration-300 ease-in-out"
        style={{
          width: sidebarAreaWidth,
          backgroundColor: 'var(--header-bg)',
          borderRight: '1px solid var(--color-border)',
          WebkitAppRegion: 'no-drag'
        }}
      >
        <div className="flex items-center w-full gap-2 px-1">
          <button
            onClick={onToggleSidebar}
            className="theme-exempt bg-transparent flex items-center justify-center p-1 rounded-sm transition-colors cursor-pointer opacity-60 hover:opacity-100"
            style={{ color: 'var(--header-text)' }}
            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          {isSidebarOpen && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={onNewSnippet}
                className="theme-exempt bg-transparent flex items-center justify-center w-7 h-7 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="New Snippet"
              >
                <FilePlus size={15} />
              </button>
              <button
                onClick={onNewFolder}
                className="theme-exempt bg-transparent flex items-center justify-center w-7 h-7 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="New Folder"
              >
                <FolderPlus size={15} />
              </button>
              <button
                onClick={onSearch}
                className="theme-exempt bg-transparent flex items-center justify-center w-7 h-7 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="Search"
              >
                <Search size={15} />
              </button>
              <button
                onClick={onSave}
                className="theme-exempt bg-transparent flex items-center justify-center w-7 h-7 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="Save"
              >
                <Save size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Part - Above Editor */}
      <div className="flex-1 h-full flex items-center min-w-0">
        <div className="flex-1 h-full flex items-center px-0" style={{ WebkitAppRegion: 'drag' }}>
          <div className="flex items-center gap-2 max-w-full h-full">
            {isTab ? (
              <div
                className="relative group cursor-default px-1 transition-all duration-300 flex items-center justify-between h-full min-w-[160px] border-r border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]"
                style={{ WebkitAppRegion: 'no-drag' }}
                onDoubleClick={() => onRename && onRename()}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
                  <File size={16} className="flex-none text-cyan-500 opacity-80" />
                  <span className="text-[12px] truncate font-medium opacity-90 block normal-case">
                    {displayTitle?.replace(/\.[^/.]+$/, '') || 'Untitled'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose && onClose()
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 opacity-30 group-hover:opacity-100 transition-all flex items-center justify-center flex-none z-10"
                  style={{ color: 'var(--header-text)' }}
                >
                  <X size={16} />
                </button>
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--color-accent-primary)] transition-all duration-300 ease-out scale-x-0 group-hover:scale-x-100 origin-left opacity-70 pointer-events-none"></span>
              </div>
            ) : (
              <span className="text-[12px] font-medium opacity-60 pl-4 pr-1 normal-case flex items-center">
                {displayTitle}
              </span>
            )}

            {/* Autosave status inside the breadcrumb area */}
            <AutosaveIndicator status={autosaveStatus} />
          </div>
        </div>

        {/* Window Controls area */}
        <div
          className="flex items-center h-full ml-auto flex-none"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Custom Toggle: Compact vs Full */}
          <button
            onClick={onToggleCompact}
            className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100 hover:bg-white/5"
            style={{ color: 'var(--header-text)' }}
            title={isCompact ? 'Standard UI' : 'Compact UI'}
          >
            <Minimize2 size={14} />
          </button>

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
            <Minus size={16} />
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
            <X size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
