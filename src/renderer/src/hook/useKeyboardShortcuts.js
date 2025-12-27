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
       * Handle Escape key - check if menus are open first
       */
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
      const isPKey = e.key?.toLowerCase() === 'p' && (e.ctrlKey || e.metaKey)
      if (isPKey) {
        e.preventDefault()
        if (shortcutsRef.current.onToggleCommandPalette) {
          // If Shift is pressed, open in Command Mode (>)
          const isCommandMode = e.shiftKey
          shortcutsRef.current.onToggleCommandPalette(isCommandMode)
        }
      }

      // Ctrl+B sidebar toggle (Shift explicitly excluded)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault()
        if (shortcutsRef.current.onToggleSidebar) {
          shortcutsRef.current.onToggleSidebar()
        }
      }

      // Ctrl+F search (handled directly in CodeEditor component)
      // The CodeEditor component listens for Ctrl+F and opens the custom search panel
      // Escape to close is handled by the SearchPanel component itself

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

      // Ctrl+\ or Ctrl+E or Alt+E toggles live preview
      const isBackslashKey =
        (e.ctrlKey || e.metaKey) &&
        (e.key === '\\' || e.key === '|' || e.code === 'Backslash' || e.code === 'IntlBackslash')
      const isObsidianPreviewKey =
        (e.ctrlKey || e.metaKey || e.altKey) && e.key?.toLowerCase() === 'e'

      if (isBackslashKey || isObsidianPreviewKey) {
        e.preventDefault()
        if (shortcutsRef.current.onTogglePreview) {
          try {
            shortcutsRef.current.onTogglePreview()
          } catch {}
        }
      }

      // Ctrl + / Cycles Modes (Obsidian style)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        if (shortcutsRef.current.onToggleMode) {
          shortcutsRef.current.onToggleMode()
        }
      }

      // Ctrl+R rename selected snippet
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'r' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        if (shortcutsRef.current.onRenameSnippet) {
          try {
            shortcutsRef.current.onRenameSnippet()
          } catch (err) {
            console.error('❌ Error in onRenameSnippet:', err)
          }
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

      // Alt+P toggle pin
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        if (shortcutsRef.current.onTogglePin) {
          shortcutsRef.current.onTogglePin()
        }
      }

      // Ctrl+Shift+F toggle flow mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (shortcutsRef.current.onToggleFlow) {
          shortcutsRef.current.onToggleFlow()
        }
      }
    }

    // VS Code-style smooth wheel zoom
    let wheelAccumulator = 0
    const WHEEL_THRESHOLD = 50 // Faster trigger for better UX

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        wheelAccumulator += e.deltaY
        if (Math.abs(wheelAccumulator) >= WHEEL_THRESHOLD) {
          if (wheelAccumulator > 0) {
            // Mouse Wheel Down -> Zoom Out (Editor Only)
            if (shortcutsRef.current.onEditorZoomOut) {
              shortcutsRef.current.onEditorZoomOut()
            } else if (shortcutsRef.current.onZoomOut) {
              // Fallback to global if local handler not provided
              shortcutsRef.current.onZoomOut()
            }
          } else {
            // Mouse Wheel Up -> Zoom In (Editor Only)
            if (shortcutsRef.current.onEditorZoomIn) {
              shortcutsRef.current.onEditorZoomIn()
            } else if (shortcutsRef.current.onZoomIn) {
              // Fallback to global
              shortcutsRef.current.onZoomIn()
            }
          }
          wheelAccumulator = 0
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // Use capture to strictly intercept before Editor
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
}
