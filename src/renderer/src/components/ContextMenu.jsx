import React from 'react'
import PropTypes from 'prop-types'
import { Scissors, Copy, Clipboard, MousePointer, Trash2 } from 'lucide-react'

const ContextMenu = ({ x, y, onClose, items = [] }) => {
  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div
        className="absolute rounded-lg shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white backdrop-blur-sm"
        style={{ left: x, top: y, minWidth: 180 }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => {
          if (item.label === 'separator') {
            return <div key={index} className="border-t border-slate-200 dark:border-slate-700" />
          }

          const IconComponent = typeof item.icon === 'string' ? null : item.icon
          const isEmoji = typeof item.icon === 'string'

          return (
            <button
              key={index}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 ${
                item.danger
                  ? 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              onClick={item.onClick}
            >
              {isEmoji ? (
                <span className="text-sm">{item.icon}</span>
              ) : IconComponent ? (
                <IconComponent size={12} />
              ) : null}
              {item.label}
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
      danger: PropTypes.bool
    })
  )
}

export default React.memo(ContextMenu)
