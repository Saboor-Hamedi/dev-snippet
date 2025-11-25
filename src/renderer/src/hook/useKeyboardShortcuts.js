// hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from 'react'

export const useKeyboardShortcuts = (shortcuts) => {
  // We use refs to keep the latest callback versions without restarting the event listener
  // This prevents the "remove/add listener" loop every time you type a character.
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Handle Escape
      if (e.key === 'Escape') {
        if (shortcutsRef.current.onEscape) {
          shortcutsRef.current.onEscape()
        }
      }

      // 2. Handle Save (Ctrl+S or Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault() // Stop browser "Save Page" dialog
        if (shortcutsRef.current.onSave) {
          shortcutsRef.current.onSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // Empty dependency array = Listener binds only ONCE when component mounts
}
