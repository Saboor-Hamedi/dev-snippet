import React from 'react'
import PropTypes from 'prop-types'

/**
 * Dropdown select setting with label and description
 */
const SettingSelect = ({ label, description, value, onChange, options = [], noBorder = false }) => {
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md px-3 py-2 text-xtiny outline-none transition-all"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }}
      >
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  )
}

SettingSelect.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
      })
    ])
  ).isRequired,
  noBorder: PropTypes.bool
}

export default SettingSelect
