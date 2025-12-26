import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Simple Context Menu Component
 * Shows a menu at cursor position on right-click
 */
const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Boundary detection
  const menuX = Math.min(x, window.innerWidth - 180)
  const menuY = Math.min(y, window.innerHeight - 250)

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.3)] border py-1 animate-in fade-in zoom-in-95 duration-75 ease-out select-none"
      style={{
        left: `${menuX}px`,
        top: `${menuY}px`,
        backgroundColor: 'var(--color-bg-tertiary)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--context-menu-shadow, 0 8px 32px rgba(0,0,0,0.4))'
      }}
    >
      {items.map((item, index) => {
        if (item.label === 'separator') {
          return (
            <div
              key={index}
              className="h-px my-1 opacity-20"
              style={{ backgroundColor: 'var(--color-text-tertiary)' }}
            />
          )
        }
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              item.onClick()
              onClose()
            }}
            className={`theme-exempt w-full px-3 py-1.5 text-left text-[11px] flex items-center justify-between transition-all duration-100 border-none outline-none bg-transparent ${
              item.danger ? 'text-red-400 hover:bg-red-500/20' : 'hover:bg-white/10'
            }`}
            style={{
              color: item.danger ? undefined : 'var(--color-text-primary)'
            }}
            disabled={item.disabled}
          >
            <div className="flex items-center gap-2.5">
              {item.icon && (
                typeof item.icon === 'string' ? (
                  <span className="text-sm opacity-70">{item.icon}</span>
                ) : (
                  <item.icon size={14} strokeWidth={1.5} className="opacity-70" />
                )
              )}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-[9px] opacity-40 font-mono tracking-tighter">
                {item.shortcut}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

ContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
      onClick: PropTypes.func.isRequired,
      danger: PropTypes.bool,
      disabled: PropTypes.bool
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired
}

export default ContextMenu
