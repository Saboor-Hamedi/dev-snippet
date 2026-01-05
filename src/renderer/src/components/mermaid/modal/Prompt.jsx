import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { FileEdit, Trash2, AlertCircle, Info } from 'lucide-react'
import UniversalModal from '../../universal/UniversalModal'

const Prompt = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  showInput = false,
  inputValue = '',
  onInputChange,
  placeholder = 'Type here...',
  icon: CustomIcon,
  zIndex = 200000
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const inputRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false) // Reset state when opening
      if (showInput) {
        // Use multiple attempts to ensure focus after animation/render
        const focus = () => {
          if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
          }
        }

        focus()
        setTimeout(focus, 50)
        setTimeout(focus, 150)
      }
    }
  }, [isOpen, showInput])

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsProcessing(true)

      // Safety: Give React a chance to paint the spinner
      // before potentially heavy synchronous work blocks the thread.
      await new Promise((resolve) => setTimeout(resolve, 50))

      try {
        await onConfirm(inputValue)
      } finally {
        // We don't necessarily set isProcessing to false if the modal closes,
        // but it helps if it stays open for any reason.
        setIsProcessing(false)
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showInput && !inputValue?.trim()) return
      if (isProcessing) return
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      if (isProcessing) return
      e.preventDefault()
      onClose && onClose()
    }
  }

  if (!isOpen) return null

  // Variant Mapping
  const configs = {
    primary: {
      icon: <FileEdit size={16} strokeWidth={2.5} />,
      iconBg: 'bg-[var(--color-accent-primary)]/10',
      iconColor: 'text-[var(--color-accent-primary)]',
      confirmBtn: 'bg-[var(--color-accent-primary)] hover:opacity-90',
      tagColor: 'text-[var(--color-accent-primary)]'
    },
    danger: {
      icon: <Trash2 size={16} strokeWidth={2.5} />,
      iconBg: 'bg-[var(--color-error)]/10',
      iconColor: 'text-[var(--color-error)]',
      confirmBtn: 'bg-[var(--color-error)] hover:opacity-90',
      tagColor: 'text-[var(--color-error)]'
    },
    info: {
      icon: <Info size={16} strokeWidth={2.5} />,
      iconBg: 'bg-[var(--color-info)]/10',
      iconColor: 'text-[var(--color-info)]',
      confirmBtn: 'bg-[var(--color-info)] hover:opacity-90',
      tagColor: 'text-[var(--color-info)]'
    }
  }

  const config = configs[variant] || configs.primary
  const displayIcon = CustomIcon ? <CustomIcon size={16} strokeWidth={2.5} /> : config.icon

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="300px"
      height="auto"
      className="prompt-modal"
      resetPosition={false}
      isLocked={true}
      allowMaximize={false}
      noTab={true}
      noRadius={true}
    >
      <div className=" text-left bg-[var(--color-bg-primary)]">
        {/* Message */}
        {message && (
          <div className="text-[13px] text-[var(--color-text-secondary)] mb-4 leading-relaxed opacity-90">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center ${config.iconColor} bg-opacity-20`}
              >
                {React.cloneElement(displayIcon, { size: 16 })}
              </div>
              <span className="font-semibold text-[var(--color-text-primary)]">{title}</span>
            </div>
            {message}
          </div>
        )}

        {/* Optional Input */}
        {showInput && (
          <div className="mb-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange && onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-white/5 dark:bg-black/20 border rounded-xxtiny outline-none  px-3 py-2 text-[12px] text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-tertiary)] shadow-inner"
              autoComplete="off"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={(e) => {
              e.currentTarget.blur()
              onClose && onClose()
            }}
            className="px-5 py-2 text-[12px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all rounded-xl outline-none"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={(e) => {
              e.currentTarget.blur()
              handleConfirm()
            }}
            disabled={isProcessing || (showInput && !inputValue?.trim())}
            className={`px-8 py-2 flex items-center justify-center gap-2 text-[12px] font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${config.confirmBtn} ring-1 ring-white/10 shadow-none`}
          >
            {isProcessing && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </UniversalModal>
  )
}

Prompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'danger', 'info']),
  showInput: PropTypes.bool,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  placeholder: PropTypes.string,
  icon: PropTypes.elementType
}

export default Prompt
