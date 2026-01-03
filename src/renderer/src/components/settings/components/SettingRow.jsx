import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable row component for settings
 * Provides consistent layout for label + control
 */
const SettingRow = ({ label, description, children, noBorder = false, className = '' }) => {
  return (
    <div
      className={`flex flex-row items-center justify-between py-1 px-2 gap-3 ${!noBorder ? 'border-t first:border-t-0' : ''} ${className}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex-1 min-w-0">
        <label
          className="block text-[9px] font-bold uppercase tracking-wide truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </label>
        {description && (
          <p
            className="text-[8px] leading-none opacity-50 truncate"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 scale-90 origin-right">{children}</div>
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
