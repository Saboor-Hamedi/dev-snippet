import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Simple Prompt Modal - Replacement for deleted Mermaid Prompt
 */
const Prompt = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  showInput = false,
  inputValue = '',
  onInputChange,
  onConfirm,
  onClose
}) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && showInput && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen, showInput])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(inputValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-6 min-w-[400px] max-w-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{message}</p>

        {showInput && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 mb-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm rounded bg-[var(--color-accent-primary)] text-white hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

Prompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  showInput: PropTypes.bool,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func.isRequired
}

export default Prompt
