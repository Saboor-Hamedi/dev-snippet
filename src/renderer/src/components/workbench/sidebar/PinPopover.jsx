import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'

const PinPopover = ({ x = 0, y = 0, snippet, onClose, onPing, onFavorite }) => {
  const ref = useRef(null)
  const firstBtnRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (!ref.current) return
      // If a keyboard open just happened, ignore the immediate first mousedown
      try {
        if (window.__suppressNextMousedownClose) {
          window.__suppressNextMousedownClose = false
          return
        }
      } catch (err) {}
      if (!ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [onClose])

  useEffect(() => {
    // focus the first button for keyboard users
    if (firstBtnRef.current) firstBtnRef.current.focus()
  }, [])

  if (!snippet) return null

  const favorited = !!snippet.is_favorite

  const style = {
    position: 'fixed',
    left: x,
    top: y + 10,
    zIndex: 2147483647,
    background: 'var(--popover-bg, white)',
    color: 'var(--popover-text, var(--color-text))',
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    borderRadius: 4,
    padding: '6px',
    minWidth: 160
  }

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
      e.preventDefault()
      // focus next
      if (e.target.nextElementSibling) e.target.nextElementSibling.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (e.target.previousElementSibling) e.target.previousElementSibling.focus()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const content = (
    <div ref={ref} style={style} role="dialog" aria-label="Favorite Actions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          ref={firstBtnRef}
          type="button"
          onClick={() => {
            try {
              console.debug('[PinPopover] Ping click', snippet.id)
            } catch (e) {}
            onPing(snippet.id)
            onClose()
          }}
          onKeyDown={(e) => handleKeyDown(e, () => {
            onPing(snippet.id)
            onClose()
          })}
          className="px-3 py-1 rounded-sm text-sm theme-exempt bg-transparent hover:bg-[var(--color-bg-tertiary)]"
        >
          Ping
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              console.debug('[PinPopover] Favorite click', snippet.id)
            } catch (e) {}
            onFavorite(snippet.id)
            onClose()
          }}
          onKeyDown={(e) => handleKeyDown(e, () => {
            onFavorite(snippet.id)
            onClose()
          })}
          className="px-3 py-1 rounded-sm text-sm theme-exempt bg-transparent hover:bg-[var(--color-bg-tertiary)]"
        >
          {favorited ? '★ Favorite' : '☆ Favorite'}
        </button>
      </div>
    </div>
  )

  // Render in a portal so the popover is above all app UI (LivePreview/overlays)
  try {
    return createPortal(content, document.body)
  } catch (err) {
    // Fallback if portal fails (SSR or test env)
    return content
  }
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
