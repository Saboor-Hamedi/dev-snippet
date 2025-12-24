import React from 'react'
import PropTypes from 'prop-types'

export const Toggle = ({ value, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors">
    <div className="flex-1 pr-4">
      <div className="font-medium text-slate-700 dark:text-slate-200">{label}</div>
      {description && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`theme-exempt relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        value
          ? 'bg-blue-600 hover:bg-blue-700'
          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)

export const Select = ({ value, onChange, options, label, description }) => (
  <div className="flex items-center justify-between py-3 group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors">
    <div className="flex-1 pr-4">
      <div className="font-medium text-slate-700 dark:text-slate-200">{label}</div>
      {description && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
      )}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="theme-exempt block w-48 rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 bg-transparent dark:bg-slate-800"
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
  <div className="py-3 group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors">
    <div className="mb-2">
      <div className="font-medium text-slate-700 dark:text-slate-200">{label}</div>
      {description && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
      )}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="theme-exempt block w-full rounded-md border-0 py-1.5 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-transparent dark:bg-slate-800/50"
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
