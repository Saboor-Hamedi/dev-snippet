import React from 'react'
import PropTypes from 'prop-types'
import './ToggleButton.css'

const useToggleButton = ({ checked, onChange, disabled, width = 36, height = 20, padding = 3 }) => {
  const thumbSize = height - padding * 2
  const translate = width - height

  const style = {
    '--toggle-width': `${width}px`,
    '--toggle-height': `${height}px`,
    '--toggle-padding': `${padding}px`,
    '--thumb-size': `${thumbSize}px`,
    '--thumb-translate': `${translate}px`
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`toggle-root ${disabled ? 'disabled' : ''}`}
      style={style}
    >
      <span className="sr-only">Use setting</span>
      <span aria-hidden="true" className="toggle-thumb" />
    </button>
  )
}

useToggleButton.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  padding: PropTypes.number
}

export default useToggleButton
