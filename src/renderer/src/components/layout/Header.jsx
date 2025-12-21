import React from 'react'
import { X, Minimize, Minimize2, Code2 } from 'lucide-react'
import iconUrl from '../../assets/icon.png'

const Header = ({ isCompact, onToggleCompact, title, snippetTitle, autosaveStatus }) => {
  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    height: '32px',
    // Do not set drag on the whole header — we will set a smaller
    // draggable inner area so native edge-resize remains available.
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '8px',
    paddingRight: 0,
    backgroundColor: 'var(--header-bg)',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--header-fg)',
    gap: '8px'
  }
  const displayTitle = snippetTitle ? `${snippetTitle} - ${title}` : title

  return (
    <header className="" style={headerStyle}>
      {/* Inner draggable area inset slightly from the edges so native
            edge-resize still works on Windows. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            WebkitAppRegion: 'drag',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            // inset a few pixels from each edge to leave room for the
            // OS resize handles
            width: 'calc(100% - 46px)'
          }}
        >
          <Code2
            style={{
              width: 14,
              height: 14,
              backgroundImage: `url(${iconUrl})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              color: 'var(--color-text-primary)',
              flexShrink: 0
            }}
          />
          <span
            className="text-xtiny truncate"
            style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}
          >
            {displayTitle?.replace(/\.[^/.]+$/, '') || 'Untitled'}
          </span>
          {/* Autosave indicator */}
          {autosaveStatus ? (
            <small
              className="whitespace-nowrap"
              style={{
                marginRight: 8,
                fontSize: 8,
                color: 'var(--color-text-secondary)',
                opacity: 0.9
              }}
            >
              {autosaveStatus === 'pending' && 'Saving...'}
              {autosaveStatus === 'saving' && 'Saving'}
              {autosaveStatus === 'saved' && 'Saved ✓'}
            </small>
          ) : null}
        </div>
      </div>

      <div
        style={{
          marginLeft: 'auto',
          WebkitAppRegion: 'no-drag',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: '100%'
        }}
      >
        <button
          onClick={() => window.api?.toggleMaximize?.()}
          className="theme-exempt h-3xl w-3xl flex items-center justify-center 
          bg-transparent hover:bg-[#2d3138] focus:outline-none 
          focus:ring-none cursor-pointer transition-none"
          title="Toggle maximize"
        >
          <Minimize size={12} className="text-slate-500 dark:text-slate-400" />
        </button>
        <button
          onClick={() => {
            try {
              if (typeof onToggleCompact === 'function') onToggleCompact()
              window.api?.minimize?.()
            } catch (e) {}
          }}
          className="theme-exempt h-3xl w-3xl flex items-center justify-center
          bg-transparent hover:bg-[#2d3138]
           focus:outline-none focus:ring-none cursor-pointer transition-none"
          title={
            isCompact ? 'Expand to full mode and minimize' : 'Switch to compact mode and minimize'
          }
        >
          <Minimize2 size={12} className="text-slate-500 dark:text-slate-400" />
        </button>
        <button
          onClick={() => window.api?.closeWindow?.()}
          className="theme-exempt h-3xl w-3xl flex items-center 
          justify-center bg-transparent hover:bg-red-500 
          hover:text-white focus:outline-none focus:ring-none cursor-pointer transition-none"
          title="Close"
        >
          <X size={12} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>
    </header>
  )
}

export default Header
