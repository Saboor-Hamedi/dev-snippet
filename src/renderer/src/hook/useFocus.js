import { useEffect, useRef } from 'react'

/**
 * useFocus Hook
 * Handles editor focus restoration after UI changes
 * Used for gutter toggle, settings changes, etc.
 */
export const useFocus = (viewRef, trigger) => {
  const shouldFocus = useRef(false)

  // Mark that we should focus after the next render
  useEffect(() => {
    if (trigger !== undefined) {
      shouldFocus.current = true
    }
  }, [trigger])

  // Restore focus after render
  useEffect(() => {
    if (shouldFocus.current && viewRef.current) {
      // Double RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (viewRef.current) {
            viewRef.current.focus()
            shouldFocus.current = false
          }
        })
      })
    }
  })

  return {
    requestFocus: () => {
      shouldFocus.current = true
    }
  }
}

export default useFocus
