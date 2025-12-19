import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable row component for settings
 * Provides consistent layout for label + control
 */
const SettingRow = ({ label, description, children, noBorder = false, className = '' }) => {
  return (
    <div
      className={`p-4 flex items-center justify-between gap-4 ${!noBorder ? 'border-b' : ''} ${className}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex-1">
        <label
          className="block text-xtiny font-thin"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </label>
        {description && (
          <p className="text-xtiny mt-1 max-w-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

SettingRow.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  noBorder: PropTypes.bool,
  className: PropTypes.string
}

export default SettingRow
