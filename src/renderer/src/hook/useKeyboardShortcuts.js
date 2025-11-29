// hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from 'react'

export const useKeyboardShortcuts = (shortcuts) => {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escpe close
      if (e.key === 'Escape') {
        if (shortcutsRef.current.onEscape) {
          shortcutsRef.current.onEscape()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // Empty dependency array = Listener binds only ONCE when component mounts
}
