import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { FileEdit, Trash2, AlertCircle, Info } from 'lucide-react'

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
  icon: CustomIcon
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const inputRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false) // Reset state when opening
      if (showInput) {
        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        setTimeout(() => confirmBtnRef.current?.focus(), 100)
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
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-500',
      tagColor: 'text-emerald-500'
    },
    danger: {
      icon: <Trash2 size={16} strokeWidth={2.5} />,
      iconBg: 'bg-slate-500/10',
      iconColor: 'text-slate-500',
      confirmBtn: 'bg-red-600 hover:bg-red-500',
      tagColor: 'text-slate-500'
    },
    info: {
      icon: <Info size={16} strokeWidth={2.5} />,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      confirmBtn: 'bg-blue-600 hover:bg-blue-500',
      tagColor: 'text-blue-500'
    }
  }

  const config = configs[variant] || configs.primary
  const displayIcon = CustomIcon ? <CustomIcon size={16} strokeWidth={2.5} /> : config.icon

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-4 overflow-hidden"
      onMouseDown={onClose}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal Container */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white/95 dark:bg-[#0d1117]/95 rounded-[5px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border-none overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 text-left">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-8 h-8 rounded-[5px] ${config.iconBg} flex items-center justify-center ${config.iconColor}`}
            >
              {displayIcon}
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
          </div>

          {/* Message */}
          {message && (
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {message}
            </p>
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
                className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none focus:ring-0 rounded-[5px] px-4 py-2 text-[14px] text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                autoComplete="off"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-6 h-[30px] flex items-center justify-center text-[12px] font-normal text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-[5px] outline-none focus:outline-none"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              onClick={handleConfirm}
              disabled={isProcessing || (showInput && !inputValue?.trim())}
              className={`px-6 h-[30px] flex items-center justify-center gap-2 text-[12px] font-normal text-white rounded-[5px] shadow-none border-none outline-none focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBtn}`}
            >
              {isProcessing && (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isProcessing ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
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
