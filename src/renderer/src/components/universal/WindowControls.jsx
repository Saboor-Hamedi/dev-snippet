import React from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'

/**
 * Standardized Window Controls for the entire application.
 * Matches Obsidian-like minimal and robust aesthetic.
 *
 * Used in:
 * - src/renderer/src/components/layout/Header/Header.jsx (Main App)
 * - src/renderer/src/components/universal/UniversalModal.jsx (Modals)
 */
const WindowControls = ({
  onMinimize,
  onMaximize,
  onClose,
  isMaximized = false,
  variant = 'app',
  showMinimize = true,
  showMaximize = true,
  showClose = true
}) => {
  const isApp = variant === 'app'

  // Base button style logic
  // App variant uses standard Windows-like hitboxes for native feel
  // Modal variant uses more compact, integrated feel
  const width = isApp ? '42px' : '32px'
  const closeWidth = isApp ? '46px' : '32px'
  const iconSize = isApp ? 14 : 13

  const btnBaseClass =
    'theme-exempt bg-transparent h-full flex items-center justify-center transition-all duration-75'
  const idleOpacity = 'opacity-50 hover:opacity-100'

  return (
    <div
      className={`window-controls-container flex h-full items-stretch no-drag`}
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      {showMinimize && onMinimize && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMinimize()
          }}
          className={`${btnBaseClass} ${idleOpacity} hover:bg-[rgba(255,255,255,0.05)]`}
          style={{ width }}
          title="Minimize"
        >
          <Minus size={iconSize} />
        </button>
      )}

      {showMaximize && onMaximize && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMaximize()
          }}
          className={`${btnBaseClass} ${idleOpacity} hover:bg-[rgba(255,255,255,0.05)]`}
          style={{ width }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy size={iconSize - 2} strokeWidth={2.5} />
          ) : (
            <Square size={iconSize - 2} strokeWidth={2.5} />
          )}
        </button>
      )}

      {showClose && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className={`${btnBaseClass} ${isApp ? 'hover:bg-[#e81123] hover:text-white' : 'hover:bg-[rgba(255,50,50,0.15)] hover:text-red-400'} ${idleOpacity}`}
          style={{ width: closeWidth }}
          title="Close"
        >
          <X size={iconSize} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

export default WindowControls
