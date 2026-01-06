/**
 * makeDraggable
 *
 * A high-performance, vanilla JS utility to enable dragging on any DOM element.
 *
 * Features:
 * - Direct DOM manipulation for buttery smooth movement (skips React cycles).
 * - RAF (RequestAnimationFrame) debouncing for optimized screen updates.
 * - Interactive element protection (stops dragging when clicking buttons/inputs).
 * - Custom bounds support (confinement to a specific area).
 * - Persistent state lifecycle (onDragStart, onDragEnd).
 *
 * @param {HTMLElement} el The element to be moved
 * @param {HTMLElement} handle The element acting as the drag handle
 * @param {Function} onDragEnd Callback when dragging stops { x, y }
 * @param {Function} onDragStart Callback when dragging starts
 * @param {Function} getBounds Function returning { left, top, right, bottom } for confinement
 */
export const makeDraggable = (el, handle, onDragEnd, onDragStart, getBounds) => {
  let startX = 0,
    startY = 0,
    initialX = 0,
    initialY = 0
  let rafId = null

  /**
   * Mouse Down - Setup the drag session
   */
  const mouseDownHandler = (e) => {
    // Only allow left clicks (button 0)
    if (e.button !== 0) return

    // Resolve target element (handle text nodes safely)
    let targetEl = e.target
    if (targetEl.nodeType === 3) targetEl = targetEl.parentElement
    if (!targetEl || typeof targetEl.closest !== 'function') return

    // INDUSTRIAL UI SHIELD: Don't trigger drag if clicking an interactive control
    // This allows buttons and inputs inside a draggable header to function normally.
    const isInteractive = targetEl.closest(
      'button, input, select, textarea, a, .cm-mode-btn, [role="button"], .nexus-header-search-group'
    )
    if (isInteractive) return

    // Prevent default browser behavior (text selection, ghosting)
    e.preventDefault()

    if (onDragStart) onDragStart()

    // Measure active coordinates relative to the offsetParent
    const rect = el.getBoundingClientRect()
    const parentRect = el.offsetParent
      ? el.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0 }

    // Logic: Absolute position values are relative to the offsetParent
    initialX = rect.left - parentRect.left
    initialY = rect.top - parentRect.top

    // Stabilize the element's positioning before movement starts
    el.style.left = `${initialX}px`
    el.style.top = `${initialY}px`
    el.style.bottom = 'auto'
    el.style.right = 'auto'
    el.style.margin = '0'

    // Support both 'absolute' and 'fixed' positioning modes
    const currentPosStyle = window.getComputedStyle(el).position
    if (currentPosStyle !== 'fixed') {
      el.style.position = 'absolute'
    }

    // Performance hints for the browser
    el.style.willChange = 'top, left'
    el.style.setProperty('transition', 'none', 'important') // SHIELD: Disable transitions during active drag

    startX = e.clientX
    startY = e.clientY

    // Register global listeners for movement and release
    document.addEventListener('mouseup', mouseUpHandler)
    document.addEventListener('mousemove', mouseMoveHandler)

    // Visual state triggers
    el.classList.add('is-dragging')
    document.body.classList.add('dragging-active')
    document.documentElement.style.setProperty('--is-dragging-global', '1')
  }

  /**
   * Mouse Move - Update position via RAF
   */
  const mouseMoveHandler = (e) => {
    if (rafId) return // Skip if a frame is already pending

    rafId = requestAnimationFrame(() => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      let newLeft = initialX + dx
      let newTop = initialY + dy

      // --- CONTAINMENT LOGIC ---
      const parent = el.offsetParent
      if (getBounds) {
        // Use external bounds function if provided (e.g. Snippet Sidebar confinement)
        const bounds = getBounds()
        if (bounds) {
          newLeft = Math.max(bounds.left, Math.min(newLeft, bounds.right - el.offsetWidth))
          newTop = Math.max(bounds.top, Math.min(newTop, bounds.bottom - el.offsetHeight))
        }
      } else if (parent) {
        // Default: Confinement to offsetParent
        const maxLeft = parent.offsetWidth - el.offsetWidth
        const maxTop = parent.offsetHeight - el.offsetHeight
        newLeft = Math.max(0, Math.min(newLeft, maxLeft))
        newTop = Math.max(0, Math.min(newTop, maxTop))
      }

      // Final DOM application (Round for pixel-perfection)
      el.style.left = `${Math.round(newLeft)}px`
      el.style.top = `${Math.round(newTop)}px`

      rafId = null
    })
  }

  /**
   * Mouse Up - Release & Persistence
   */
  const mouseUpHandler = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    // Cleanup listeners
    document.removeEventListener('mouseup', mouseUpHandler)
    document.removeEventListener('mousemove', mouseMoveHandler)

    // Reset visual and perf states
    el.classList.remove('is-dragging')
    document.body.classList.remove('dragging-active')
    document.documentElement.style.setProperty('--is-dragging-global', '0')
    el.style.willChange = 'auto'
    el.style.removeProperty('transition')

    // Persist the final outcome
    if (onDragEnd) {
      onDragEnd({ x: el.offsetLeft, y: el.offsetTop })
    }
  }

  // Register Handle Listener
  handle.addEventListener('mousedown', mouseDownHandler)

  /**
   * Detach function - Cleanup resources
   */
  return () => {
    handle.removeEventListener('mousedown', mouseDownHandler)
    document.removeEventListener('mouseup', mouseUpHandler)
    document.removeEventListener('mousemove', mouseMoveHandler)
    document.body.classList.remove('dragging-active')
    if (rafId) cancelAnimationFrame(rafId)
  }
}
