import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

const ContextMenu = ({ x, y, onClose, items = [] }) => {
  const menuRef = useRef(null)

  // Adjust position to prevent menu from going off-screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      // Adjust horizontal position if menu would go off-screen
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      // Adjust vertical position if menu would go off-screen  
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      // Only update if adjustment is needed
      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.transform = `translate(${adjustedX}px, ${adjustedY}px)`
      }
    }
  }, [x, y])

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div
        ref={menuRef}
        className="absolute rounded-md shadow-2xl border py-1"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${x}px, ${y}px)`,
          minWidth: 200,
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => {
          if (item.label === 'separator') {
            return (
              <div
                key={index}
                className="my-1 border-t"
                style={{ borderColor: 'var(--color-border)' }}
              />
            )
          }

          const IconComponent = typeof item.icon === 'string' ? null : item.icon
          const isEmoji = typeof item.icon === 'string'

          return (
            <button
              key={index}
              className={`w-full flex items-center gap-3 text-left px-3 py-2 text-[13px] font-medium transition-all duration-75 ${
                item.danger
                  ? 'hover:bg-red-500/20 text-red-500'
                  : 'hover:bg-[var(--color-accent-primary)]/15 text-[var(--color-text-primary)]'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                item.onClick?.()
                onClose()
              }}
              style={{
                fontFamily: 'var(--u-font-sans)'
              }}
            >
              <span className="flex-shrink-0 w-4 flex items-center justify-center">
                {isEmoji ? (
                  <span className="text-sm">{item.icon}</span>
                ) : IconComponent ? (
                  <IconComponent size={16} strokeWidth={2} />
                ) : null}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span
                  className="text-[11px] font-mono opacity-40"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {item.shortcut}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

ContextMenu.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  onClose: PropTypes.func,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
      onClick: PropTypes.func,
      danger: PropTypes.bool,
      shortcut: PropTypes.string
    })
  )
}

export default React.memo(ContextMenu)
