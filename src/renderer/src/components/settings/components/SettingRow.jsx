import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable row component for settings
 * Provides consistent layout for label + control
 */
const SettingRow = ({ label, description, children, noBorder = false, className = '' }) => {
  return (
    <div
      className={`flex items-center justify-between p-3 gap-4 ${!noBorder ? 'border-t first:border-t-0' : ''} ${className}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex-1">
        <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        {description && (
          <p className="text-xs mt-0.5 max-w-sm" style={{ color: 'var(--color-text-tertiary)' }}>
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
