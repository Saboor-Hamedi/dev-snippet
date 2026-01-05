export const makeDraggable = (el, handle, onDragEnd, onDragStart) => {
  let startX = 0,
    startY = 0,
    initialX = 0,
    initialY = 0
  let rafId = null

  const mouseDownHandler = (e) => {
    // Only left click
    if (e.button !== 0) return

    // Safety check for targets (like text nodes)
    let targetEl = e.target
    if (targetEl.nodeType === 3) targetEl = targetEl.parentElement
    if (!targetEl || typeof targetEl.closest !== 'function') return

    // Don't drag if clicking interactive elements inside the handle
    const isInteractive = targetEl.closest(
      'button, input, select, textarea, a, .cm-mode-btn, [role="button"], .nexus-header-search-group'
    )
    if (isInteractive) return

    // Prevent default to stop text selection
    e.preventDefault()

    if (onDragStart) onDragStart()

    // Measure exact position relative to offsetParent
    const rect = el.getBoundingClientRect()
    const parentRect = el.offsetParent
      ? el.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0 }

    // Pin current position and clear conflicts
    initialX = rect.left - parentRect.left
    initialY = rect.top - parentRect.top

    el.style.left = `${initialX}px`
    el.style.top = `${initialY}px`
    el.style.bottom = 'auto'
    el.style.right = 'auto'
    el.style.margin = '0'
    el.style.position = 'absolute'

    // Performance & Stability hints
    el.style.willChange = 'top, left'
    el.style.setProperty('transition', 'none', 'important') // CRITICAL: Stop the "shake"

    startX = e.clientX
    startY = e.clientY

    document.addEventListener('mouseup', mouseUpHandler)
    document.addEventListener('mousemove', mouseMoveHandler)

    el.classList.add('is-dragging')
    document.body.classList.add('dragging-active')
    document.documentElement.style.setProperty('--is-dragging-global', '1')
  }

  const mouseMoveHandler = (e) => {
    if (rafId) return

    rafId = requestAnimationFrame(() => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      let newLeft = initialX + dx
      let newTop = initialY + dy

      // Containment logic
      const parent = el.offsetParent
      if (parent) {
        const maxLeft = parent.offsetWidth - el.offsetWidth
        const maxTop = parent.offsetHeight - el.offsetHeight
        newLeft = Math.max(0, Math.min(newLeft, maxLeft))
        newTop = Math.max(0, Math.min(newTop, maxTop))
      }

      el.style.left = `${Math.round(newLeft)}px`
      el.style.top = `${Math.round(newTop)}px`

      rafId = null
    })
  }

  const mouseUpHandler = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    document.removeEventListener('mouseup', mouseUpHandler)
    document.removeEventListener('mousemove', mouseMoveHandler)

    el.classList.remove('is-dragging')
    document.body.classList.remove('dragging-active')
    document.documentElement.style.setProperty('--is-dragging-global', '0')
    el.style.willChange = 'auto'
    el.style.removeProperty('transition')

    if (onDragEnd) {
      onDragEnd({ x: el.offsetLeft, y: el.offsetTop })
    }
  }

  handle.addEventListener('mousedown', mouseDownHandler)

  return () => {
    handle.removeEventListener('mousedown', mouseDownHandler)
    document.removeEventListener('mouseup', mouseUpHandler)
    document.removeEventListener('mousemove', mouseMoveHandler)
    document.body.classList.remove('dragging-active')
    if (rafId) cancelAnimationFrame(rafId)
  }
}
