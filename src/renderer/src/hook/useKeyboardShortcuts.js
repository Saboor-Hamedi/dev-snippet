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
      if (e.key === 'Escape' || e.key === 'Esc') {
        // Prefer a context-aware escape handler if provided. If it
        // returns a truthy value we treat the event as handled and
        // stop further processing so other components (e.g., editor)
        // don't also react to Escape.
        if (shortcutsRef.current.onEscapeWithContext) {
          try {
            const handled = shortcutsRef.current.onEscapeWithContext(e)
            if (handled) {
              try {
                e.preventDefault()
                e.stopImmediatePropagation()
              } catch {}
              return
            }
          } catch {}
        }

        // Fallback: generic onEscape handler (non-contextual)
        if (shortcutsRef.current.onEscape) {
          try {
            shortcutsRef.current.onEscape(e)
          } catch {}
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
      // Ctrl+, toggles Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        if (shortcutsRef.current.onToggleSettings) {
          shortcutsRef.current.onToggleSettings()
        }
      }
      // Ctrl+Shift+C copies selected snippet to clipboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        if (shortcutsRef.current.onCopyToClipboard) {
          shortcutsRef.current.onCopyToClipboard()
        }
      }
      // Ctrl+Shift+\ toggles live preview. Support multiple key/code variants
      // to handle different keyboard layouts (Backslash, IntlBackslash, '|' with Shift).
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const isBackslashKey = e.key === '\\' || e.key === '|' || e.code === 'Backslash' || e.code === 'IntlBackslash'
        if (isBackslashKey) {
          try {
            e.preventDefault()
          } catch {}
          if (shortcutsRef.current.onTogglePreview) {
            try {
              shortcutsRef.current.onTogglePreview()
            } catch {}
          }
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
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
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
