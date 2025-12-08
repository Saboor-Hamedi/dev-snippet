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

    // Focus when snippet changes or in create mode
    if (initialSnippet?.id || isCreateMode) {
      // Multiple timing attempts for better reliability
      setTimeout(focusEditor, 50)
      setTimeout(focusEditor, 150)
      setTimeout(focusEditor, 300)
    }
  }, [initialSnippet?.id, isCreateMode, textareaRef])
}
