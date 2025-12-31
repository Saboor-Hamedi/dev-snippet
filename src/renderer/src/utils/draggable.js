/**
 * DRY Draggable Engine
 * Makes any DOM element draggable within its offset parent.
 * @param {HTMLElement} el The element to move
 * @param {HTMLElement} handle The element that triggers the drag
 * @param {Function} onDragEnd Optional callback when dragging stops
 */
export const makeDraggable = (el, handle, onDragEnd) => {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0

  const mouseDownHandler = (e) => {
    // Only left click
    if (e.button !== 0) return

    // Don't drag if clicking buttons inside the handle
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return

    // Prevent default to stop text selection
    e.preventDefault()

    // Pin current position and clear margin to prevent jumping
    const rect = el.getBoundingClientRect()
    const parentRect = el.offsetParent
      ? el.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0 }

    el.style.left = `${rect.left - parentRect.left}px`
    el.style.top = `${rect.top - parentRect.top}px`
    el.style.margin = '0'
    el.style.position = 'absolute'

    // Performance hint: Tell the browser this element will move
    el.style.willChange = 'top, left'

    pos3 = e.clientX
    pos4 = e.clientY

    document.addEventListener('mouseup', mouseUpHandler)
    document.addEventListener('mousemove', mouseMoveHandler)

    el.classList.add('is-dragging')
    document.body.classList.add('dragging-active')
  }

  const mouseMoveHandler = (e) => {
    // No preventDefault here to keep it lean, or keep it if needed for text selection
    // e.preventDefault()

    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY

    let newTop = el.offsetTop - pos2
    let newLeft = el.offsetLeft - pos1

    const parent = el.offsetParent
    if (parent) {
      const maxLeft = parent.offsetWidth - el.offsetWidth
      const maxTop = parent.offsetHeight - el.offsetHeight
      newLeft = Math.max(0, Math.min(newLeft, maxLeft))
      newTop = Math.max(0, Math.min(newTop, maxTop))
    }

    el.style.top = `${newTop}px`
    el.style.left = `${newLeft}px`
    el.style.bottom = 'auto'
    el.style.right = 'auto'
    el.style.margin = '0'
  }

  const mouseUpHandler = () => {
    document.removeEventListener('mouseup', mouseUpHandler)
    document.removeEventListener('mousemove', mouseMoveHandler)

    el.classList.remove('is-dragging')
    document.body.classList.remove('dragging-active')
    el.style.willChange = 'auto'

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
  }
}
