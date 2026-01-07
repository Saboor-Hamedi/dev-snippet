import React from 'react'
import PropTypes from 'prop-types'
import { GripVertical } from 'lucide-react'

const EditorModeSwitcher = ({
  isFloating,
  setIsFloating,
  switcherRef,
  dragHandleRef,
  activeMode,
  updateSetting,
  settings,
  initialSnippet,
  onFavorite,
  onPing,
  onImageExport,
  isFlow
}) => {
  const isLocked = settings?.ui?.universalLock?.modal
  const disableDraggable = settings?.ui?.modeSwitcher?.disableDraggable

  return (
    <div
      ref={switcherRef}
      className={`cm-editor-mode-switcher ${
        isFloating ? 'is-floating' : ''
      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Drag Handle - Only show if draggable is enabled AND currently floating */}
      {isFloating && !disableDraggable && !isLocked && (
        <div
          ref={dragHandleRef}
          className="cm-mode-item"
          title="Drag to move"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            cursor: isFloating ? 'move' : 'default',
            opacity: isFloating ? 1 : 0.3
          }}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* Action Buttons Group */}
      <div className="flex items-center">
        {/* Pin/Float Toggle - Only show if draggable is enabled */}
        {!disableDraggable && !isLocked && (
          <button
            className="cm-mode-item"
            title={isFloating ? "Dock to Bottom" : "Float / Move"}
            onClick={(e) => {
              e.currentTarget.blur()
              if (switcherRef.current) {
                switcherRef.current.style.top = ''
                switcherRef.current.style.left = ''
                switcherRef.current.style.bottom = ''
                switcherRef.current.style.right = ''
                switcherRef.current.style.margin = ''
              }
              const newState = !isFloating
              setIsFloating(newState)
              updateSetting('ui.modeSwitcher.isFloating', newState)
            }}
          >
            {isFloating ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10V4a2 2 0 0 0-2-2h-6"></path>
                <path d="M3 14v6a2 2 0 0 0 2 2h6"></path>
                <path d="M16 2l6 6"></path>
                <path d="M2 16l6 6"></path>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"></path>
              </svg>
            )}
          </button>
        )}

        <div className="cm-mode-divider"></div>

        {/* Action: Image Export */}
        {!isFlow && onImageExport && (
          <button
            className="cm-mode-btn"
            title="Export as Image"
            onClick={() => onImageExport?.()}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        )}

        {/* Action: Favorite */}
        {!isFlow && onFavorite && (
          <button
            className={`cm-mode-btn ${initialSnippet?.is_favorite ? 'is-active text-yellow-500' : ''}`}
            title={initialSnippet?.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            onClick={() => onFavorite?.(initialSnippet?.id)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill={initialSnippet?.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        )}

        {/* Action: Ping (Pin) */}
        {!isFlow && onPing && (
          <button
            className={`cm-mode-btn ${initialSnippet?.is_pinned ? 'is-active text-blue-400' : ''}`}
            title={initialSnippet?.is_pinned ? 'Unpin from Top' : 'Pin to Top'}
            onClick={() => onPing?.(initialSnippet?.id)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </button>
        )}

        <div className="cm-mode-divider"></div>

        {/* Mode Selectors */}
        {[
          {
            id: 'source',
            label: 'Source',
            icon: (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            )
          },
          {
            id: 'live_preview',
            label: 'Live',
            icon: (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )
          },
          {
            id: 'reading',
            label: 'Read',
            icon: (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            )
          }
        ].map((m) => (
          <button
            key={m.id}
            className={`cm-mode-btn ${activeMode === m.id ? 'is-active' : ''}`}
            title={`${m.label} Mode`}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('app:set-editor-mode', { detail: { mode: m.id } })
              )
            }}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

EditorModeSwitcher.propTypes = {
  isFloating: PropTypes.bool.isRequired,
  setIsFloating: PropTypes.func.isRequired,
  switcherRef: PropTypes.object.isRequired,
  dragHandleRef: PropTypes.object.isRequired,
  activeMode: PropTypes.string.isRequired,
  updateSetting: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  initialSnippet: PropTypes.object,
  onFavorite: PropTypes.func,
  onPing: PropTypes.func,
  onImageExport: PropTypes.func,
  isFlow: PropTypes.bool
}

export default EditorModeSwitcher
