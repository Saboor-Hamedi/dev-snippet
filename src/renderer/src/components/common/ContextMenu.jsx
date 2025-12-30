import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Premium VS Code-inspired Context Menu Component
 */
const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null)
  const [style, setStyle] = React.useState({ opacity: 0, visibility: 'hidden' })

  React.useLayoutEffect(() => {
    if (menuRef.current) {
      const height = menuRef.current.offsetHeight
      const width = menuRef.current.offsetWidth || 200

      const spaceAbove = y
      const spaceBelow = window.innerHeight - y

      let finalY = y
      let finalX = Math.min(x, window.innerWidth - width - 10)

      // If not enough space below, and more space above, flip it
      if (spaceBelow < height && spaceAbove > spaceBelow) {
        finalY = y - height
      }

      setStyle({
        left: `${finalX}px`,
        top: `${finalY}px`,
        opacity: 1,
        visibility: 'visible'
      })
    }
  }, [x, y, items])

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
      className="fixed z-[9999] min-w-[200px] rounded-[5px] border py-1 animate-in fade-in zoom-in-95 duration-75 ease-out select-none"
      style={{
        ...style,
        backgroundColor: 'var(--color-bg-tertiary, #1e1e1e)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)' // Matching UniversalModal shadow
      }}
    >
      <div className="flex flex-col">
        {items.map((item, index) => {
          if (item.label === 'separator') {
            return <div key={index} className="h-[1px] my-1 mx-1 bg-white/10" />
          }

          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                if (!item.disabled) {
                  item.onClick()
                  onClose()
                }
              }}
              className={`
                group relative flex w-full items-center justify-between px-3 py-[4px]
                text-left text-[12px] leading-tight outline-none border-none
                ${item.disabled ? 'opacity-40 cursor-default' : 'hover:bg-[#0060c0] hover:text-white cursor-pointer'}
                ${item.danger && !item.disabled ? 'text-red-400' : ''}
              `}
              style={{
                color: item.disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'
              }}
              disabled={item.disabled}
            >
              {/* Left Section: Icon + Label */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-4 h-4">
                  {item.icon &&
                    (typeof item.icon === 'string' ? (
                      <span className="text-[14px]">{item.icon}</span>
                    ) : (
                      <item.icon size={14} strokeWidth={1.5} className="group-hover:text-white" />
                    ))}
                </div>
                <span className="font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              </div>

              {/* Right Section: Shortcut */}
              {item.shortcut && (
                <span className="ml-8 text-[11px] font-mono opacity-50 group-hover:opacity-100 group-hover:text-white font-normal whitespace-nowrap">
                  {item.shortcut}
                </span>
              )}

              {/* Toggle indicator (VS Code style) */}
              {item.checked && (
                <div className="absolute left-1.5 flex items-center justify-center w-3 h-3 text-white">
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    stroke="currentColor"
                    className="w-2.5 h-2.5"
                  >
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
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
      onClick: PropTypes.func,
      danger: PropTypes.bool,
      disabled: PropTypes.bool,
      shortcut: PropTypes.string,
      checked: PropTypes.bool
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired
}

export default ContextMenu
