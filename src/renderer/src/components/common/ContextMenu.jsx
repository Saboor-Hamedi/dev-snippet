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

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-[#1e1e1e] border border-white/10 rounded-md shadow-2xl py-1"
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
            item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-white/5'
          }`}
          disabled={item.disabled}
        >
          {item.icon && <item.icon size={14} strokeWidth={1.5} />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

ContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      onClick: PropTypes.func.isRequired,
      danger: PropTypes.bool,
      disabled: PropTypes.bool
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired
}

export default ContextMenu
