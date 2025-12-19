import React from 'react'
import PropTypes from 'prop-types'

/**
 * Display component for keyboard shortcuts
 * Shows action name, description, and key combination
 */
const KeyboardShortcutItem = ({ action, description, shortcut }) => {
  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 rounded"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div>
        <div className="text-xtiny font-thin" style={{ color: 'var(--color-text-primary)' }}>
          {action}
        </div>
        {description && (
          <div className="text-xtiny" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </div>
        )}
      </div>
      <kbd
        className="px-1.5 py-0.5 rounded text-xtiny"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
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
