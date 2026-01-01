import React from 'react'
import PropTypes from 'prop-types'

export const Toggle = ({ value, onChange, label, description }) => (
  <div className="flex items-center justify-between py-1.5 group hover:bg-[var(--hover-bg)] rounded-lg px-2 -mx-2 transition-colors">
    <div className="flex-1 pr-4">
      <div className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</div>
      {description && (
        <div className="text-[10px] leading-tight text-[var(--color-text-secondary)] mt-0.5">
          {description}
        </div>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`theme-exempt relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
        value
          ? 'bg-[var(--color-accent-primary)]'
          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg)] border-[var(--color-border)]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--text-main)] shadow ring-0 transition duration-200 ease-in-out ${
          value ? 'translate-x-5 bg-white' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)

export const Select = ({ value, onChange, options, label, description }) => (
  <div className="flex items-center justify-between py-1.5 group hover:bg-[var(--hover-bg)] rounded-lg px-2 -mx-2 transition-colors">
    <div className="flex-1 pr-4">
      <div className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</div>
      {description && (
        <div className="text-[10px] leading-tight text-[var(--color-text-secondary)] mt-0.5">
          {description}
        </div>
      )}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="theme-exempt block w-40 rounded-md border-0 py-1 pl-2 pr-8 text-[var(--color-text-primary)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-accent-primary)] text-xs bg-[var(--bg-tertiary)]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
)

export const Input = ({ value, onChange, label, description, type = 'text', placeholder }) => (
  <div className="py-1.5 group hover:bg-[var(--hover-bg)] rounded-lg px-2 -mx-2 transition-colors">
    <div className="mb-1">
      <div className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</div>
      {description && (
        <div className="text-[10px] leading-tight text-[var(--color-text-secondary)] mt-0.5">
          {description}
        </div>
      )}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="theme-exempt block w-full rounded-md border-0 py-1 text-[var(--color-text-primary)] shadow-sm ring-1 ring-inset ring-[var(--color-border)] placeholder:text-[var(--color-text-tertiary)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent-primary)] text-xs bg-[var(--bg-tertiary)]"
    />
  </div>
)

// Helper prop types
const commonProps = {
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string
}

Toggle.propTypes = commonProps
Select.propTypes = {
  ...commonProps,
  options: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.any }))
}
Input.propTypes = { ...commonProps, type: PropTypes.string, placeholder: PropTypes.string }
