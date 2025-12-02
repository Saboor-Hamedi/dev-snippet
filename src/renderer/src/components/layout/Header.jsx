
import React from 'react'
import { X, Minimize, Minimize2 } from 'lucide-react'
const Header = ({isCompact, 
  onToggleCompact, 
  title, snippetTitle, autosaveStatus
}) => {
  const headerStyle = { 
   background: 'rgba(255, 255, 255, 0.2)',
   height: '32px',
   // Do not set drag on the whole header — we will set a smaller
   // draggable inner area so native edge-resize remains available.
   display: 'flex',
   alignItems: 'center',
   padding: '0 8px',
   backgroundColor: 'var(--header-bg)',
   borderBottom: '1px solid var(--border-color)',
   color: 'var(--header-fg)',
   gap: '8px',
  }
   const displayTitle = snippetTitle ? `${snippetTitle} - ${title}` : title;


    return (
      <header className="" style={headerStyle}>
        {/* Inner draggable area inset slightly from the edges so native
            edge-resize still works on Windows. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div
            style={{
              WebkitAppRegion: 'drag',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              // inset a few pixels from each edge to leave room for the
              // OS resize handles
              marginLeft: 6,
              marginRight: 6,
              width: '100%'
            }}
          >
            <div
              aria-hidden
              style={{ width: 14, height: 14, background: 'var(--accent)', borderRadius: 4 }}
            />
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--header-fg)' }}>
              {displayTitle}
            </span>
            {/* Autosave indicator */}
            {autosaveStatus ? (
              <small style={{ marginRight: 8, fontSize: 8, color: 'var(--header-fg)', opacity: 0.9 }}>
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
            gap: 8
          }}
        >
          <button
            onClick={() => window.api?.toggleMaximize?.()}
            className="p-1 hover:bg-slate-100 focus:outline-none focus:ring-none rounded-md cursor-pointer transition-colors duration-150"
            title="Toggle maximize"
          >
            <Minimize size={12} />
          </button>
          <button
            onClick={() => {
              try {
                // call parent compact toggle if provided
                if (typeof onToggleCompact === 'function') onToggleCompact()
                // also minimize the window as requested
                window.api?.minimize?.()
              } catch (e) {
                console.error('Failed to minimize window', e)
              }
            }}
            className="p-1 hover:bg-slate-100 focus:outline-none focus:ring-none rounded-md cursor-pointer transition-colors duration-150"
            title={
              isCompact ? 'Expand to full mode and minimize' : 'Switch to compact mode and minimize'
            }
          >
            <Minimize2 size={12} className="text-slate-500 dark:text-slate-400" />
          </button>
          <button
            onClick={() => window.api?.closeWindow?.()}
            className="p-1 hover:bg-slate-100 focus:outline-none focus:ring-none rounded-md cursor-pointer transition-colors duration-150"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </header>
    )
}


export default Header