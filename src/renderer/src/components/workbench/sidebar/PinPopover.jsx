import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { Star, Pin, X, GripHorizontal } from 'lucide-react'
import { makeDraggable } from '../../../utils/draggable'
import { getPersistentPosition, savePersistentPosition } from '../../../utils/persistentPosition'
import './PinPopover.css'

const PinPopover = ({ x = 0, y = 0, snippet, onClose, onPing, onFavorite, isCentered = false }) => {
  const ref = useRef(null)
  const headerRef = useRef(null)
  const [position, setPosition] = useState({ left: x, top: y + 10 })

  useLayoutEffect(() => {
    if (ref.current) {
      if (isCentered) {
        // Restore last position or center via Flexbox logic (fallback)
        const parent = ref.current.parentElement
        if (parent) {
          const pRect = parent.getBoundingClientRect()
          const mRect = ref.current.getBoundingClientRect()
          const centerDefaults = {
            left: `${(pRect.width - mRect.width) / 2}px`,
            top: `${pRect.height * 0.2}px`
          }
          const saved = getPersistentPosition('pin_popover', centerDefaults)
          setPosition({
            left: saved.left,
            top: saved.top
          })
        }
        return
      }

      const rect = ref.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let nextLeft = x
      let nextTop = y + 10

      // Viewport collision detection
      if (nextLeft + rect.width > viewportWidth - 20) {
        nextLeft = viewportWidth - rect.width - 20
      }
      if (nextTop + rect.height > viewportHeight - 20) {
        nextTop = y - rect.height - 10 // Show above if no space below
      }

      // Ensure it's never negative
      nextLeft = Math.max(10, nextLeft)
      nextTop = Math.max(10, nextTop)

      setPosition({ left: nextLeft, top: nextTop })
    }
  }, [x, y, isCentered])

  useEffect(() => {
    if (ref.current && headerRef.current) {
      const cleanup = makeDraggable(ref.current, headerRef.current, (pos) => {
        if (isCentered) {
          savePersistentPosition('pin_popover', {
            left: `${pos.x}px`,
            top: `${pos.y}px`
          })
        }
      })
      return cleanup
    }
  }, [snippet, isCentered])

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }

    // Use capturing for click outside to ensure we catch it before other logic
    window.addEventListener('mousedown', handleOutside, true)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('mousedown', handleOutside, true)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  if (!snippet) return null

  const isFavorite = !!snippet.is_favorite
  const isPinned = !!snippet.is_pinned

  const content = (
    // On pin popover click, prevent closing
    <div
      className={`pin-popover-overlay ${isCentered ? 'is-centered' : ''}`}
      style={{ pointerEvents: 'none' }} /* Ensure overlay doesn't block typing */
    >
      <div
        ref={ref}
        className="pin-popover"
        style={{
          left: position.left,
          top: position.top,
          transform: position.transform,
          position: 'absolute',
          pointerEvents: 'auto' /* Re-enable pointer events for the popover itself */
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Snippet Actions"
      >
        <div ref={headerRef} className="pin-popover-header" style={{ cursor: 'move' }}>
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} style={{ opacity: 0.4 }} />
            <span className="pin-popover-title">Actions</span>
          </div>
          <button className="pin-popover-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="pin-popover-body">
          <button
            className="pin-popover-item"
            onClick={() => {
              onPing(snippet.id)
            }}
          >
            <Pin
              className="pin-icon"
              fill={isPinned ? 'var(--color-accent-primary)' : 'none'}
              style={{ opacity: isPinned ? 1 : 0.8 }}
            />
            <span>{isPinned ? 'Unpin Snippet' : 'Pin Snippet'}</span>
          </button>

          <button
            className="pin-popover-item"
            onClick={() => {
              onFavorite(snippet.id)
            }}
          >
            <Star
              className="pin-icon"
              fill={isFavorite ? 'var(--color-accent-primary)' : 'none'}
              style={{ opacity: isFavorite ? 1 : 0.8 }}
            />
            <span>{isFavorite ? 'Unfavorite' : 'Mark as Favorite'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (isCentered) return content
  return createPortal(content, document.body)
}

PinPopover.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  snippet: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onPing: PropTypes.func.isRequired,
  onFavorite: PropTypes.func.isRequired
}

export default PinPopover
