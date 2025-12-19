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
      // Handle Escape key - check if menus are open first
      if (e.key === 'Escape' || e.key === 'Esc') {
        // Only close modals and menus with plain Escape, don't close editor
        if (shortcutsRef.current.onEscapeMenusOnly) {
          try {
            const handled = shortcutsRef.current.onEscapeMenusOnly(e)
            if (handled) {
              try {
                e.preventDefault()
                e.stopImmediatePropagation()
              } catch {}
              return
            }
          } catch {}
        }
      }

      // Ctrl+Shift+W to close editor/go to welcome (like closing a tab)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (shortcutsRef.current.onCloseEditor) {
          try {
            shortcutsRef.current.onCloseEditor(e)
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
      // Ctrl+Shift+S save (alternative)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
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
        const isBackslashKey =
          e.key === '\\' || e.key === '|' || e.code === 'Backslash' || e.code === 'IntlBackslash'
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
      // Zoom In
      const isZoomIn =
        (e.ctrlKey || e.metaKey) &&
        (e.key === '=' ||
          e.key === '+' ||
          e.code === 'Equal' ||
          e.code === 'NumpadAdd' ||
          e.key === 'Add')

      if (isZoomIn) {
        e.preventDefault()
        if (shortcutsRef.current.onZoomIn) {
          shortcutsRef.current.onZoomIn()
        }
      }

      // Zoom Out
      const isZoomOut =
        (e.ctrlKey || e.metaKey) &&
        (e.key === '-' ||
          e.key === '_' ||
          e.code === 'Minus' ||
          e.code === 'NumpadSubtract' ||
          e.key === 'Subtract')

      if (isZoomOut) {
        e.preventDefault()
        if (shortcutsRef.current.onZoomOut) {
          shortcutsRef.current.onZoomOut()
        }
      }

      // Reset Zoom
      const isZoomReset =
        (e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')

      if (isZoomReset) {
        e.preventDefault()
        if (shortcutsRef.current.onZoomReset) {
          shortcutsRef.current.onZoomReset()
        }
      }
    }

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // Standard VS Code zoom wheel behavior
        if (e.deltaY < 0) {
          if (shortcutsRef.current.onZoomIn) shortcutsRef.current.onZoomIn()
        } else if (e.deltaY > 0) {
          if (shortcutsRef.current.onZoomOut) shortcutsRef.current.onZoomOut()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
}
