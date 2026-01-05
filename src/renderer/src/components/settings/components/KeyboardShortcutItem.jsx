import React from 'react'
import PropTypes from 'prop-types'

/**
 * Display component for keyboard shortcuts
 * Shows action name, description, and key combination
 */
const KeyboardShortcutItem = ({ action, description, shortcut }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {action}
        </div>
        {description && (
          <div className="text-xtiny" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </div>
        )}
      </div>
      <kbd
        className="px-1.5 py-0.5 rounded text-[8px]"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-secondary)'
        }}
      >
        {shortcut}
      </kbd>
    </div>
  )
}

KeyboardShortcutItem.propTypes = {
  action: PropTypes.string.isRequired,
  description: PropTypes.string,
  shortcut: PropTypes.string.isRequired
}

export default KeyboardShortcutItem
