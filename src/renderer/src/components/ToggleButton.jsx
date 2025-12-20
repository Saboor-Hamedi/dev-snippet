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
        relative inline-flex items-center h-5 w-9 flex-shrink-0 cursor-pointer rounded-full 
        !outline-none !ring-0 !shadow-none border-none transition-colors duration-200
        ${checked ? '' : 'bg-zinc-200 dark:bg-zinc-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundColor: checked ? 'var(--color-accent-primary)' : undefined,
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        boxShadow: 'none'
      }}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow ring-0  
          transition-transform duration-200 ease-in-out bg-white
          ${checked ? 'translate-x-[20px] ' : 'translate-x-[2px] '}
        `}
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
