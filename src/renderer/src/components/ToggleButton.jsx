import React from 'react'
import PropTypes from 'prop-types'

const ToggleButton = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundColor: checked ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)'
      }}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
        `}
        style={{
          transform: checked ? 'translateX(16px)' : 'translateX(0)'
        }}
      />
    </button>
  )
}

ToggleButton.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default ToggleButton
