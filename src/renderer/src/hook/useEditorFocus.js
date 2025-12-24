import { useEffect } from 'react'

export const useEditorFocus = ({ initialSnippet, isCreateMode, textareaRef }) => {
  useEffect(() => {
    const focusEditor = () => {
      try {
        // Multiple attempts with different selectors for better reliability
        const selectors = [
          '.cm-editor .cm-content',
          '.cm-editor',
          '.editor-container textarea',
          'textarea'
        ]

        for (const selector of selectors) {
          const element = document.querySelector(selector)
          if (element && typeof element.focus === 'function') {
            element.focus()
            return true
          }
        }

        // Try ref as backup
        if (textareaRef?.current && typeof textareaRef.current.focus === 'function') {
          textareaRef.current.focus()
          return true
        }

        return false
      } catch (err) {
        return false
      }
    }

    // Focus ONLY when entering create mode or on initial mount.
    // We intentionally removed initialSnippet changes from dependencies
    // to prevent stealing focus while browsing the sidebar with arrow keys.
    if (isCreateMode) {
      setTimeout(focusEditor, 50)
      setTimeout(focusEditor, 150)
    }
    // If it's the very first load (mounting), we might want focus?
    // Actually, 'useEffect' runs on mount. If we want to focus on mount,
    // we can just run it. But for browsing, we don't want it.
    // Let's assume hitting "New" handles createMode.
    // If opening a snippet from "Welcome", we might want focus.
    // But if we are in the list, we don't.
    // For now, removing snippet dependencies is safe.
  }, [isCreateMode, textareaRef])
}
