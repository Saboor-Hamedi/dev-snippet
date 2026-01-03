import React, { useEffect, useRef, useLayoutEffect } from 'react'
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
  width: initialWidth = '550px',
  height: initialHeight = 'auto',
  className = '',
  resetPosition = false,
  noOverlay = false,
  customKey = 'universal_modal',
  isMaximized = false
}) => {
  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const dragHandleRef = useRef(null)
  const isFirstRender = useRef(true)
  const { settings } = useSettings()

  useLayoutEffect(() => {
    if (isOpen && modalRef.current && headerRef.current) {
      const modal = modalRef.current
      const header = headerRef.current

      modal.style.setProperty('opacity', '1', 'important')

      // Scientist Mode: Aggressive Reset Force
      const forceReset = (el) => {
        const bg = 'rgb(var(--color-bg-primary-rgb))'
        el.style.setProperty('background', bg, 'important')
        el.style.setProperty('background-color', bg, 'important')
        el.style.setProperty('border', 'none', 'important')
        el.style.setProperty('border-width', '0px', 'important')
        el.style.setProperty('border-color', 'transparent', 'important')
        el.style.setProperty('border-top', 'none', 'important')
        el.style.setProperty('border-bottom', 'none', 'important')
        el.style.setProperty('border-left', 'none', 'important')
        el.style.setProperty('border-right', 'none', 'important')
        el.style.setProperty('outline', 'none', 'important')
        el.style.setProperty('box-shadow', 'none', 'important')
        el.style.setProperty('backdrop-filter', 'none', 'important')
      }

      forceReset(modal)
      forceReset(header)
      if (modal.querySelector('.universal-modal-footer')) {
        forceReset(modal.querySelector('.universal-modal-footer'))
      }

      const isLocked = settings?.ui?.universalLock?.modal

      // 1. Position & Size Setup
      const saved = getPersistentPosition(customKey, null)

      // Disable transitions for the initial positioning to prevent "shaking"
      if (isFirstRender.current) {
        modal.classList.add('no-transition')
      }

      if (isMaximized) {
        modal.classList.add('maximized')
        modal.style.setProperty('left', '0', 'important')
        modal.style.setProperty('top', '0', 'important')
        modal.style.setProperty('width', '100vw', 'important')
        modal.style.setProperty('height', '100vh', 'important')
        modal.style.setProperty('max-width', 'none', 'important')
        modal.style.setProperty('max-height', 'none', 'important')
        modal.style.setProperty('margin', '0', 'important')
        modal.style.setProperty('position', 'fixed', 'important')
        modal.style.setProperty('border-radius', '0', 'important')
        modal.style.setProperty('z-index', '99999', 'important')
        modal.style.setProperty('transform', 'none', 'important')
      } else {
        modal.classList.remove('maximized')
        // Explicitly clear all maximization overrides
        modal.style.removeProperty('left')
        modal.style.removeProperty('top')
        modal.style.removeProperty('width')
        modal.style.removeProperty('height')
        modal.style.removeProperty('max-width')
        modal.style.removeProperty('max-height')
        modal.style.removeProperty('margin')
        modal.style.removeProperty('position')
        modal.style.removeProperty('border-radius')
        modal.style.removeProperty('z-index')
        modal.style.removeProperty('transform')

        if (isLocked || resetPosition) {
          modal.style.position = isLocked ? 'fixed' : 'absolute'
          modal.style.zIndex = '1000000'
          modal.style.width = typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth
          modal.style.height =
            typeof initialHeight === 'number' ? `${initialHeight}px` : initialHeight
          modal.style.margin = 'auto'
          modal.style.left = '50%'
          modal.style.top = '50%'
          modal.style.transform = 'translate(-50%, -50%)'
        } else if (saved) {
          modal.style.position = 'absolute'
          modal.style.left = saved.left
          modal.style.top = saved.top
          modal.style.width =
            saved.width || (typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth)
          modal.style.height =
            saved.height ||
            (typeof initialHeight === 'number' ? `${initialHeight}px` : initialHeight)
          modal.style.margin = '0'
          modal.style.transform = 'none'
        } else {
          modal.style.position = 'absolute'
          if (noOverlay) {
            if (customKey === 'flow_editor_position') {
              modal.style.left = '60px'
              modal.style.top = '100px'
            } else if (customKey === 'flow_preview_position') {
              modal.style.right = '60px'
              modal.style.top = '100px'
              modal.style.left = 'auto'
            } else if (customKey === 'flow_workspace_position') {
              // Center the workspace by default
              const w =
                typeof initialWidth === 'number' ? initialWidth : parseInt(initialWidth) || 800
              const h =
                typeof initialHeight === 'number' ? initialHeight : parseInt(initialHeight) || 700
              modal.style.left = `${Math.max(0, (window.innerWidth - w) / 2)}px`
              modal.style.top = `${Math.max(0, (window.innerHeight - h) / 2)}px`
            } else {
              modal.style.right = '40px'
              modal.style.top = '80px'
              modal.style.left = 'auto'
            }
            modal.style.margin = '0'
          } else {
            modal.style.left = '50%'
            modal.style.top = '50%'
            modal.style.transform = 'translate(-50%, -50%)'
            modal.style.margin = '0'
          }
          modal.style.width = typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth
          modal.style.height =
            typeof initialHeight === 'number' ? `${initialHeight}px` : initialHeight
        }
      }

      // Re-enable transitions after initial positioning
      if (isFirstRender.current) {
        // Force a reflow to ensure the initial position is applied without transition
        void modal.offsetHeight
        modal.classList.remove('no-transition')
        isFirstRender.current = false
      }

      // 2. Enable Dragging
      let cleanupDrag
      if (!isLocked && !isMaximized && headerRef.current) {
        cleanupDrag = makeDraggable(modal, headerRef.current, (pos) => {
          savePersistentPosition(customKey, {
            ...saved,
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: modal.style.width,
            height: modal.style.height
          })
        })
      }

      // 3. Enable Resizing (Simple bottom-right handle logic)
      let resizeHandle
      if (!isLocked && !isMaximized) {
        resizeHandle = document.createElement('div')
        resizeHandle.className = 'universal-modal-resize-handle'
        modal.appendChild(resizeHandle)

        const startResize = (e) => {
          e.preventDefault()
          const startWidth = parseInt(document.defaultView.getComputedStyle(modal).width, 10)
          const startHeight = parseInt(document.defaultView.getComputedStyle(modal).height, 10)
          const startX = e.clientX
          const startY = e.clientY

          const doResize = (moveEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startX
            const newHeight = startHeight + moveEvent.clientY - startY
            modal.style.width = `${newWidth}px`
            modal.style.height = `${newHeight}px`
          }

          const stopResize = () => {
            document.removeEventListener('mousemove', doResize)
            document.removeEventListener('mouseup', stopResize)
            savePersistentPosition(customKey, {
              left: modal.style.left,
              top: modal.style.top,
              width: modal.style.width,
              height: modal.style.height
            })
          }

          document.addEventListener('mousemove', doResize)
          document.addEventListener('mouseup', stopResize)
        }

        resizeHandle.addEventListener('mousedown', startResize)
      }

      return () => {
        if (cleanupDrag) cleanupDrag()
        if (resizeHandle && modal.contains(resizeHandle)) modal.removeChild(resizeHandle)
      }
    }
  }, [
    isOpen,
    initialWidth,
    initialHeight,
    settings?.ui?.universalLock?.modal,
    settings?.ui?.theme,
    resetPosition,
    isMaximized
  ])

  if (!isOpen) return null

  const isDragDisabled = settings?.ui?.universalLock?.modal

  const modalContent = (
    <div
      ref={modalRef}
      className={`universal-modal u-borderless u-solid ${isDragDisabled ? 'locked' : ''} ${className} ${noOverlay ? 'no-overlay' : ''}`}
      style={{
        width: typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth,
        height: typeof initialHeight === 'number' ? `${initialHeight}px` : initialHeight,
        zIndex: noOverlay ? 100000 : 200000,
        pointerEvents: className.includes('click-through') ? 'none' : 'auto',
        // Scientist Mode: Explicit Enforcement via Inline Styles
        background: 'rgb(var(--color-bg-primary-rgb))',
        backgroundColor: 'rgb(var(--color-bg-primary-rgb))',
        border: 'none',
        borderWidth: '0px',
        borderColor: 'transparent',
        boxShadow: 'none',
        outline: 'none',
        backdropFilter: 'none',
        opacity: 1
      }}
    >
      <div
        ref={headerRef}
        className="universal-modal-header u-borderless u-solid"
        onDoubleClick={() => {
          if (customKey === 'flow_workspace_position' && typeof isMaximized !== 'undefined') {
            // This is a bit hacky but it works for FlowWorkspace
            window.dispatchEvent(new CustomEvent('app:maximize-station'))
          }
        }}
        style={{
          cursor: !isDragDisabled && !isMaximized ? 'move' : 'default',
          pointerEvents: 'auto', // Header must always be interactable for dragging
          background: 'rgb(var(--color-bg-primary-rgb))',
          backgroundColor: 'rgb(var(--color-bg-primary-rgb))',
          border: 'none',
          boxShadow: 'none',
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          {!isDragDisabled && (
            <div
              style={{
                cursor: 'inherit',
                padding: '4px',
                marginLeft: '-4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <GripHorizontal size={14} style={{ opacity: 0.3 }} />
            </div>
          )}
          <div
            className="universal-modal-title"
            style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-primary)' }}
          >
            {title}
          </div>
        </div>
      </div>
      <div
        className={`universal-modal-content ${className.includes('no-padding') ? 'no-padding' : ''}`}
      >
        {children}
      </div>
      {footer && (
        <div
          className="universal-modal-footer u-borderless u-solid"
          style={{
            background: 'rgb(var(--color-bg-primary-rgb))',
            backgroundColor: 'rgb(var(--color-bg-primary-rgb))',
            border: 'none',
            boxShadow: 'none',
            outline: 'none'
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )

  if (noOverlay) {
    return ReactDOM.createPortal(modalContent, document.body)
  }

  return ReactDOM.createPortal(
    <div
      className="universal-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {modalContent}
    </div>,
    document.body
  )
}

export default UniversalModal
