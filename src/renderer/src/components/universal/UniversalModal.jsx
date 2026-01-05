import React, { useEffect, useRef, useLayoutEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { GripHorizontal, X } from 'lucide-react'
import WindowControls from './WindowControls'
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
  onMaximize,
  isMaximized: isMaximizedExternal,
  isLocked: isLockedProp = false,
  allowMaximize = true,
  headerHeight,
  hideHeaderBorder = false,
  headerContent = null,
  hideBorder = false,
  noTab = false,
  noRadius = false,
  hideCloseButton = false
}) => {
  const [isMaximizedInternal, setIsMaximizedInternal] = useState(false)
  const isMaximized = isMaximizedExternal !== undefined ? isMaximizedExternal : isMaximizedInternal
  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const dragHandleRef = useRef(null)
  const isFirstRender = useRef(true)
  const isDraggingInternal = useRef(false)
  const { settings } = useSettings()

  useLayoutEffect(() => {
    // Prevent layout fighting during drag
    if (isDraggingInternal.current) return

    if (isOpen && modalRef.current && headerRef.current) {
      const modal = modalRef.current
      const header = headerRef.current

      modal.style.setProperty('opacity', '1', 'important')

      const isLocked = isLockedProp || settings?.ui?.universalLock?.modal

      // 1. Position & Size Setup
      if (headerHeight) {
        header.style.height = typeof headerHeight === 'number' ? `${headerHeight}px` : headerHeight
      }

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
          if (noOverlay) {
            modal.style.position = 'absolute'
            modal.style.left = '50%'
            modal.style.top = '50%'
            modal.style.transform = 'translate(-50%, -50%)'
          } else {
            modal.style.position = 'relative'
            modal.style.left = 'auto'
            modal.style.top = 'auto'
          }
          modal.style.zIndex = '1000000'
          modal.style.width = typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth
          modal.style.height =
            typeof initialHeight === 'number' ? `${initialHeight}px` : initialHeight
          modal.style.margin = '0'
        } else if (saved && (customKey.includes('graph') || customKey.includes('flow'))) {
          // Persistence only for workstations/graphs
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
          // Default: Centered all the time
          if (noOverlay) {
            modal.style.position = 'absolute'
            if (customKey === 'flow_editor_position') {
              modal.style.left = '60px'
              modal.style.top = '100px'
            } else if (customKey === 'flow_preview_position') {
              modal.style.right = '60px'
              modal.style.top = '100px'
              modal.style.left = 'auto'
            } else {
              // Centered absolute fallback for noOverlay cases
              modal.style.left = '50%'
              modal.style.top = '50%'
              modal.style.transform = 'translate(-50%, -50%)'
            }
          } else {
            // Standard Modal: Use Relative + Overlay Flexbox for absolute center
            modal.style.setProperty('position', 'relative', 'important')
            modal.style.left = 'auto'
            modal.style.top = 'auto'
          }
          modal.style.margin = '0'
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
        cleanupDrag = makeDraggable(
          modal,
          headerRef.current,
          (pos) => {
            isDraggingInternal.current = false
            savePersistentPosition(customKey, {
              ...saved,
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: modal.style.width,
              height: modal.style.height
            })
          },
          () => {
            isDraggingInternal.current = true
          }
        )
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
    isLockedProp,
    settings?.ui?.universalLock?.modal,
    settings?.ui?.theme,
    resetPosition,
    isMaximized
  ])

  const toggleMaximized = (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setIsMaximizedInternal(!isMaximized)
    if (onMaximize) onMaximize(!isMaximized)
  }

  if (!isOpen) return null

  const isDragDisabled = isLockedProp || settings?.ui?.universalLock?.modal

  const modalContent = (
    <div
      ref={modalRef}
      className={`universal-modal u-solid ${!hideBorder ? 'native-frame' : ''} ${isDragDisabled ? 'locked' : ''} ${className} ${noOverlay ? 'no-overlay' : ''} ${hideBorder ? 'borderless' : ''}`}
      style={{
        width: typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth,
        height: typeof initialHeight === 'number' ? `${initialHeight}px` : initialHeight,
        zIndex: noOverlay ? 100000 : 200000,
        pointerEvents: className.includes('click-through') ? 'none' : 'auto',
        opacity: 1,
        border: hideBorder ? 'none' : undefined,
        boxShadow: hideBorder ? 'none' : undefined,
        borderRadius: noRadius ? '0px' : undefined,
        WebkitAppRegion: 'no-drag'
      }}
    >
      <div
        ref={headerRef}
        className="universal-modal-header u-solid no-drag"
        data-no-tab={noTab}
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (customKey === 'flow_workspace_position' && typeof isMaximized !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app:maximize-station'))
          } else if (allowMaximize) {
            toggleMaximized(e)
          }
        }}
        onMouseDown={(e) => {
          // Ensure we don't start dragging if we clicked a button
          if (e.target.closest('button, input, .no-drag')) {
            e.stopPropagation()
          }
        }}
        style={{
          cursor: !isDragDisabled && !isMaximized ? 'move' : 'default',
          pointerEvents: 'auto',
          height: headerHeight
            ? typeof headerHeight === 'number'
              ? `${headerHeight}px`
              : headerHeight
            : '36px',
          borderBottom: hideHeaderBorder ? 'none' : '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-end',
          position: 'relative',
          WebkitAppRegion: 'no-drag',
          userSelect: 'none'
        }}
      >
        {/* Left Side: Title */}
        <div
          className="flex items-center h-full px-2 no-drag"
          style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {noTab ? (
            <div
              className="universal-modal-title px-2 flex items-center h-full gap-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </div>
          ) : (
            <div className="universal-modal-tab">
              <div className="universal-modal-title">{title}</div>
              {!isMaximized && <div className="universal-modal-tab-accent" />}
            </div>
          )}
        </div>

        {/* Center: Customizable Content (Absolutely Centered) */}
        {headerContent && (
          <div
            className="universal-modal-header-center no-drag"
            style={{ WebkitAppRegion: 'no-drag' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {headerContent}
          </div>
        )}

        {/* Right Side: Window Controls */}
        <div
          className="universal-modal-controls absolute top-0 right-0 h-full flex items-center pr-1 no-drag"
          style={{ WebkitAppRegion: 'no-drag', zIndex: 110, pointerEvents: 'auto' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <WindowControls
            onMaximize={allowMaximize ? toggleMaximized : null}
            onClose={onClose}
            showMinimize={false}
            showMaximize={allowMaximize}
          />
        </div>
      </div>
      <div
        className={`universal-modal-content ${className.includes('no-padding') ? 'no-padding' : ''}`}
      >
        {children}
      </div>
      {footer && (
        <div
          className={`universal-modal-footer u-solid ${className.includes('no-padding') ? 'no-padding' : ''}`}
          style={{
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
            padding: className.includes('no-padding') ? 0 : undefined
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
