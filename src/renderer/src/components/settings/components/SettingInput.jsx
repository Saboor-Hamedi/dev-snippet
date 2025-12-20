import React from 'react'
import PropTypes from 'prop-types'

/**
 * Input setting with label, description, and optional suffix
 */
const SettingInput = ({
  label,
  description,
  value,
  onChange,
  type = 'text',
  suffix = null,
  noBorder = false,
  min,
  max,
  placeholder
}) => {
  return (
    <div
      className={`flex items-center justify-between p-3 gap-4 ${!noBorder ? 'border-t first:border-t-0' : ''}`}
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

      <div className="flex-shrink-0">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder={placeholder}
          onFocus={(e) => {
            e.target.style.backgroundColor = '#1a1d29'
          }}
          onBlur={(e) => {
            e.target.style.backgroundColor = 'var(--color-bg-secondary)'
          }}
          className="w-36 rounded-[5px] px-2 py-1.5 text-xs text-left outline-none border border-[var(--color-border)] ring-0 focus:ring-0 focus:outline-none transition-none"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            boxShadow: 'none'
          }}
        />
      </div>
    </div>
  )
}

SettingInput.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  noBorder: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number
}

export default SettingInput
