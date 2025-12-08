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
        relative inline-flex items-center h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-1 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0 focus:ring-offset-0
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundColor: checked ? '#0525f7ff' : '#ffffffff'
      }}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-3 w-3 transform rounded-full shadow ring-0 
          transition duration-200 ease-in-out
          
        `}
        style={{
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
          backgroundColor: checked ? '#ffffffff' : '#0525f7ff'
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
