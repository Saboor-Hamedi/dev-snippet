// hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from 'react'

export const useKeyboardShortcuts = (shortcuts) => {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  
  useEffect(() => {
    
    
    const handleKeyDown = (e) => {
      


      /*
       * This will basically stop other handlers when a modal is open
       * For example, if a delete confirmation modal is open, we don't want
       * the global shortcuts to trigger actions in the background.
      */
      if (e.key === 'Escape'){
        if (shortcutsRef.current.onEscape) {
          shortcutsRef.current.onEscapeWithContext()
        }
      }
      // Escape close
      if (e.key === 'Escape') {
        if (shortcutsRef.current.onEscape) {
          shortcutsRef.current.onEscape()
        }
      }
      // Ctrl+S save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (shortcutsRef.current.onSave) {
          e.preventDefault()
          shortcutsRef.current.onSave()
        }
      }
      // Ctrl+N creates new snippet
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault()
        if (shortcutsRef.current.onCreateSnippet) {
          shortcutsRef.current.onCreateSnippet()
        }
      }
      // Ctrl+Shift+W goes to Welcome page
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (shortcutsRef.current.onGoToWelcome) {
          shortcutsRef.current.onGoToWelcome()
        }
      }
      // Ctrl+P toggles Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault()
        if (shortcutsRef.current.onToggleCommandPalette) {
          shortcutsRef.current.onToggleCommandPalette()
        }
      }
      // Ctrl+Shift+C copies selected snippet to clipboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        if (shortcutsRef.current.onCopyToClipboard) {
          shortcutsRef.current.onCopyToClipboard()
        }
      }
      // Ctrl+R rename selected snippet
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'r' && !e.shiftKey) {
        e.preventDefault()
        if (shortcutsRef.current.onRenameSnippet) {
          shortcutsRef.current.onRenameSnippet()
        }
      }
      // Ctrl+delete delete selected snippet
      if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
        e.preventDefault()
        if (shortcutsRef.current.onDeleteSnippet) {
          shortcutsRef.current.onDeleteSnippet()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
