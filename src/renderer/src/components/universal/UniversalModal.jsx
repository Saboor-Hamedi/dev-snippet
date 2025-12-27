import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { GripHorizontal } from 'lucide-react'
import { makeDraggable } from '../../utils/draggable'
import { useSettings } from '../../hook/useSettingsContext'
import './universalStyle.css'

const UniversalModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = '550px',
  height = 'auto',
  className = ''
}) => {
  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const { settings } = useSettings()

  useEffect(() => {
    if (isOpen && modalRef.current && headerRef.current) {
      const modal = modalRef.current

      // FORCE RESET if locked (Universal Lock)
      if (settings?.ui?.universalLock?.modal) {
        requestAnimationFrame(() => {
          modal.style.left = `calc(50% - ${parseInt(width) / 2}px)`
          modal.style.top = `20%`
          modal.style.transform = 'none'
          modal.style.position = 'absolute'
        })
      } else {
        // First open centering
        if (!modal.style.left) {
          modal.style.left = `calc(50% - ${parseInt(width) / 2}px)`
          modal.style.top = `20%`
        }

        // Enable Dragging
        const cleanup = makeDraggable(modal, headerRef.current)
        return cleanup
      }
    }
  }, [isOpen, width, settings?.ui?.universalLock?.modal])

  if (!isOpen) return null

  const isDragDisabled = settings?.ui?.universalLock?.modal
  // Also support the specific toggle if we want backward compat, but user said Change it.

  return ReactDOM.createPortal(
    <div
      className="universal-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className={`universal-modal ${isDragDisabled ? 'locked' : ''} ${className}`}
        style={{ width, height }}
      >
        <div
          ref={headerRef}
          className="universal-modal-header"
          style={{ cursor: isDragDisabled ? 'default' : 'move' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isDragDisabled && <GripHorizontal size={16} style={{ opacity: 0.5 }} />}
            <span className="universal-modal-title">{title}</span>
          </div>
          <button className="universal-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="universal-modal-content">{children}</div>
        {footer && <div className="universal-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export default UniversalModal
