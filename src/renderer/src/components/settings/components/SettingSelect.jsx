import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown } from 'lucide-react'

// Helper for handling click outside
const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

/**
 * Dropdown select setting with label and description
 * Replaces native <select> with custom UI for consistent styling.
 */
const SettingSelect = ({ label, description, value, onChange, options = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef()
  useOnClickOutside(ref, () => setIsOpen(false))

  // Find the label for the current value
  const selectedOption = options.find((opt) => {
    const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt
    return optValue === value
  })
  const selectedLabel =
    selectedOption?.label || (typeof selectedOption === 'string' ? selectedOption : value)

  return (
    <div className="flex items-center justify-between p-3 gap-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        {description && (
          <p className="text-xs mt-0.5 max-w-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-36 flex items-center justify-between rounded-[5px] px-2 py-1.5 text-xs border outline-none transition-none"
          style={{
            backgroundColor: isOpen ? '#1a1d29' : 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            borderColor: isOpen ? 'var(--color-accent-primary)' : 'var(--color-border)'
          }}
        >
          <span className="truncate mr-2">{selectedLabel}</span>
          <ChevronDown size={12} className="opacity-50" />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-full rounded-[5px] border shadow-xl z-50 overflow-hidden"
            style={{
              backgroundColor: '#1a1d29',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option, idx) => {
                const optValue =
                  typeof option === 'object' && option !== null ? option.value : option
                const optLabel =
                  typeof option === 'object' && option !== null ? option.label : option
                const isSelected = optValue === value

                return (
                  <div
                    key={`${optValue}-${idx}`}
                    onClick={() => {
                      onChange(optValue)
                      setIsOpen(false)
                    }}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-accent-primary)] text-white'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                  >
                    <span>{optLabel}</span>
                    {isSelected && <span className="text-[10px] opacity-80">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

SettingSelect.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired
}

export default SettingSelect
