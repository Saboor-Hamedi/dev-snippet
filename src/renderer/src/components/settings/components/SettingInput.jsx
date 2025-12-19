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
  max
}) => {
  return (
    <div
      className={`p-2 ${!noBorder ? 'border-t' : ''}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <label
        className="block text-xtiny font-thin mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {label}
      </label>
      {description && (
        <p className="text-xtiny mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          {description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="flex-1 rounded-md px-3 py-2 text-xtiny outline-none transition-all"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          }}
        />
        {suffix && (
          <span className="text-xtiny" style={{ color: 'var(--color-text-tertiary)' }}>
            {suffix}
          </span>
        )}
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
  suffix: PropTypes.string,
  noBorder: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number
}

export default SettingInput
