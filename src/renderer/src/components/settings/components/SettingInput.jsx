import React from 'react'
import PropTypes from 'prop-types'

import SettingRow from './SettingRow'

/**
 * Input setting with label, description, and optional suffix
 */
const SettingInput = ({
  label,
  description,
  value,
  onChange,
  type = 'text',
  // eslint-disable-next-line no-unused-vars
  suffix = null,
  noBorder = false,
  min,
  max,
  placeholder
}) => {
  return (
    <SettingRow label={label} description={description} noBorder={noBorder}>
      <div className="flex-shrink-0 w-full sm:w-auto">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder={placeholder}
          onFocus={(e) => {
            e.target.style.backgroundColor = 'var(--color-bg-primary)'
            e.target.style.borderColor = 'var(--color-accent-primary)'
          }}
          onBlur={(e) => {
            e.target.style.backgroundColor = 'var(--color-bg-secondary)'
            e.target.style.borderColor = 'var(--color-border)'
          }}
          className="w-full sm:w-36 rounded-[5px] px-2 py-1.5 text-xs text-left outline-none border border-[var(--color-border)] ring-0 focus:ring-0 focus:outline-none transition-none"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            boxShadow: 'none'
          }}
        />
      </div>
    </SettingRow>
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
