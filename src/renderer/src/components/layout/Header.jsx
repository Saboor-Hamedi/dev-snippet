import React from 'react'
import {
  X,
  Minimize,
  Minimize2,
  Code2,
  PanelLeft,
  PanelLeftClose,
  FolderPlus,
  Search,
  Save
} from 'lucide-react'
import iconUrl from '../../assets/icon.png'

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
  onSearch,
  sidebarWidth = 250
}) => {
  const activityBarWidth = 48
  const sidebarAreaWidth = isSidebarOpen ? activityBarWidth + sidebarWidth : activityBarWidth

  const displayTitle = snippetTitle ? `${snippetTitle} - ${title}` : title

  return (
    <header
      className="flex items-center h-8 select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--color-border)',
        gap: 0,
        color: 'var(--header-text)'
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
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={onNewSnippet}
                className="theme-exempt bg-transparent flex items-center justify-center p-1 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="New Folder/Snippet"
              >
                <FolderPlus size={17} />
              </button>
              <button
                onClick={onSearch}
                className="theme-exempt bg-transparent flex items-center justify-center p-1 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="Search"
              >
                <Search size={17} />
              </button>
              <button
                onClick={onSave}
                className="theme-exempt bg-transparent flex items-center justify-center p-1 rounded-sm transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
                title="Save"
              >
                <Save size={17} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Part - Above Editor */}
      <div className="flex-1 h-full flex items-center min-w-0">
        <div className="flex-1 h-full flex items-center px-3" style={{ WebkitAppRegion: 'drag' }}>
          <div className="flex items-center gap-2 max-w-full">
            <Code2
              style={{
                width: 14,
                height: 14,
                backgroundImage: `url(${iconUrl})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                color: 'inherit',
                flexShrink: 0,
                opacity: 0.7
              }}
            />
            <span className="text-[12px] truncate font-medium opacity-90">
              {displayTitle?.replace(/\.[^/.]+$/, '') || 'Untitled'}
            </span>

            {/* Autosave status inside the breadcrumb area */}
            {autosaveStatus && (
              <div
                className="flex items-center ml-2 pl-2"
                style={{ borderLeft: '1px solid var(--color-border)' }}
              >
                <small className="whitespace-nowrap opacity-60 text-[10px]">
                  {autosaveStatus === 'pending' && 'Saving...'}
                  {autosaveStatus === 'saving' && 'Saving'}
                  {autosaveStatus === 'saved' && 'Saved ✓'}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Window Controls - Updated to use theme variable for color but custom hovers */}
        <div className="flex items-center h-full ml-auto" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={() => window.api?.toggleMaximize?.()}
            className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100"
            style={{ color: 'var(--header-text)' }}
            title="Toggle maximize"
          >
            <Minimize size={14} />
          </button>
          <button
            onClick={() => {
              try {
                if (typeof onToggleCompact === 'function') onToggleCompact()
                window.api?.minimize?.()
              } catch (e) {}
            }}
            className="theme-exempt bg-transparent h-full w-10 flex items-center justify-center transition-colors opacity-60 hover:opacity-100"
            style={{ color: 'var(--header-text)' }}
            title={isCompact ? 'Expand to full mode' : 'Switch to compact mode'}
          >
            <Minimize2 size={14} />
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
