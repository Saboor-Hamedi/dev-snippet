import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { GripHorizontal } from 'lucide-react'
import { makeDraggable } from '../../utils/draggable'
import { useSettings } from '../../hook/useSettingsContext'
import { getPersistentPosition, savePersistentPosition } from '../../utils/persistentPosition'
import './universalStyle.css'

const UniversalModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = '550px',
  height = 'auto',
  className = '',
  resetPosition = false
}) => {
  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const { settings } = useSettings()

  useEffect(() => {
    if (isOpen && modalRef.current && headerRef.current) {
      const modal = modalRef.current
      const header = headerRef.current
      const isLocked = settings?.ui?.universalLock?.modal

      // 1. Position Setup
      if (isLocked || resetPosition) {
        // Clear styles to let flexbox/CSS center it
        modal.style.left = ''
        modal.style.top = ''
        modal.style.margin = 'auto' // Center in flex
        modal.style.position = isLocked ? 'relative' : 'absolute'
      } else {
        const saved = getPersistentPosition('universal_modal', null)
        if (saved) {
          modal.style.left = saved.left
          modal.style.top = saved.top
          modal.style.margin = '0'
          modal.style.position = 'absolute'
        } else {
          modal.style.left = ''
          modal.style.top = ''
          modal.style.margin = 'auto'
          modal.style.position = 'absolute'
        }
      }

      // 2. Enable Dragging (unless locked)
      let cleanup
      if (!isLocked) {
        cleanup = makeDraggable(modal, header, (pos) => {
          savePersistentPosition('universal_modal', {
            left: `${pos.x}px`,
            top: `${pos.y}px`
          })
        })
      }

      return cleanup
    }
  }, [isOpen, width, settings?.ui?.universalLock?.modal, resetPosition])

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
            {!isDragDisabled && <GripHorizontal size={14} style={{ opacity: 0.3 }} />}
            <span className="universal-modal-title">{title}</span>
          </div>
        </div>
        <div
          className={`universal-modal-content ${className.includes('no-padding') ? 'no-padding' : ''}`}
        >
          {children}
        </div>
        {footer && <div className="universal-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export default UniversalModal
