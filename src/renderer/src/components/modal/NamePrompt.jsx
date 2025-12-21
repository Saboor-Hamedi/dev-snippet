import React from 'react'
import PropTypes from 'prop-types'

const NamePrompt = ({ open, value, onChange, onCancel, onConfirm }) => {
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value?.trim()) {
      e.preventDefault()
      onConfirm && onConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel && onCancel()
    }
  }

  if (!open) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded p-4 w-80">
        <div className="text-sm mb-2 text-slate-700 dark:text-slate-200">
          Enter a name (optionally with extension)
        </div>
        <input
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-[#30363d] rounded text-slate-800 dark:text-slate-200"
          placeholder="e.g. hello.js or notes"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!value?.trim()}
            className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

NamePrompt.propTypes = {
  open: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func
}

export default NamePrompt
