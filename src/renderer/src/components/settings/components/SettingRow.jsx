import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable row component for settings
 * Provides consistent layout for label + control
 */
const SettingRow = ({ label, description, children, noBorder = false, className = '' }) => {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-4 py-2 px-0 ${className}`}>
      <div className="flex flex-col gap-0.5 justify-center">
        <label className="text-[10px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        {description && (
          <p className="text-[9px] leading-tight" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end">{children}</div>
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
