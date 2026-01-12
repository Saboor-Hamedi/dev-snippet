import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import UniversalModal from './UniversalModal'
import { Trash2, Type, AlertTriangle, Check } from 'lucide-react'

/**
 * Enhanced Prompt Modal - uses UniversalModal for consistency
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
  onClose,
  zIndex = 300000,
  variant = 'primary', // 'primary', 'danger', 'success', 'warning'
  icon: customIcon = null
}) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && showInput && inputRef.current) {
      // Small delay to ensure modal is rendered and accessible
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 0)
      return () => clearTimeout(timer)
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

  // Determine Icon
  const getIcon = () => {
    if (customIcon) return customIcon
    if (variant === 'danger') return <Trash2 size={14} className="text-red-500" />
    if (variant === 'warning') return <AlertTriangle size={14} className="text-amber-500" />
    if (variant === 'success') return <Check size={14} className="text-emerald-500" />
    if (showInput) return <Type size={14} className="text-[var(--color-accent-primary)]" />
    return null
  }

  const icon = getIcon()

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <button
        onClick={onClose}
        className="px-4 h-[28px] flex items-center justify-center text-xs font-medium rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-all active:scale-95 border border-[var(--color-border)]"
      >
        {cancelLabel}
      </button>
      <button
        onClick={handleConfirm}
        className={`px-4 h-[28px] flex items-center justify-center text-xs font-medium rounded transition-all active:scale-95 border ${
          variant === 'danger'
            ? 'bg-red-500 text-white hover:bg-red-600 border-red-500'
            : variant === 'success'
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500'
              : 'bg-[var(--color-accent-primary)] text-white hover:opacity-90 border-[var(--color-accent-primary)]'
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  )

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
      }
      footer={footer}
      width="400px"
      height="auto"
      className="prompt-modal snappy"
      noTab={true}
      zIndex={zIndex}
      allowResize={false}
      hideBorder={true}
      hideHeaderBorder={true}
      allowMaximize={false}
      headerHeight={28}
    >
      <div className="p-0">
        {message && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
            {message}
          </p>
        )}

        {showInput && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 h-[28px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-primary)] focus:outline-none transition-all"
          />
        )}
      </div>
    </UniversalModal>
  )
}

Prompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  showInput: PropTypes.bool,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  zIndex: PropTypes.number,
  variant: PropTypes.string,
  icon: PropTypes.node
}

export default Prompt
