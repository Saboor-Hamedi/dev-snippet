import { useCallback, useRef } from 'react'

/**
 * useSnippetOperations - Handles specialized snippet actions 
 * 
 * Features:
 * - handleSplitSnippet: Logic for splitting large markdown files with bridge links
 */
export const useSnippetOperations = ({
  title,
  code,
  setCode,
  setIsDirty,
  initialSnippet,
  snippets,
  onSave,
  onNew,
  showToast
}) => {
  const isSplitting = useRef(false)

  const handleSplitSnippet = useCallback(() => {
    if (!title || !code || isSplitting.current) return
    isSplitting.current = true

    try {
      const nameWithoutExt = title.replace(/\.md$/, '')
      let nextBase = ''

      if (!nameWithoutExt.includes('continue')) {
        nextBase = `${nameWithoutExt} continue`
      } else {
        const match = nameWithoutExt.match(/(.*? continue)\s?(\d+)?$/)
        nextBase = match ? match[1] : nameWithoutExt
      }

      const folderSnippets = (snippets || []).filter(
        (s) => (s.folder_id || null) === (initialSnippet?.folder_id || null)
      )
      const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')

      let counter = 1
      let nextPartName = nextBase

      while (folderSnippets.some((s) => normalize(s.title) === normalize(nextPartName))) {
        counter++
        nextPartName = `${nextBase} ${counter}`
      }

      const splitLink = `\n\n---\n[[${nextPartName}]]`
      const updatedCode = code + splitLink

      setCode(updatedCode)
      setIsDirty(true)

      onSave({
        ...(initialSnippet || {}),
        code: updatedCode,
        timestamp: Date.now(),
        _skipSelectionSwitch: true
      })

      const initialPartCode = `[[${title}]]\n\n# ${nextPartName}\n\n`

      if (onNew) {
        onNew(nextPartName, initialSnippet?.folder_id || null, {
          initialCode: initialPartCode
        })
      }

      if (showToast) {
        setTimeout(() => {
          showToast(`Split complete: Continuing in ${nextPartName}`, 'success')
        }, 100)
      }
    } finally {
      setTimeout(() => {
        isSplitting.current = false
      }, 1000)
    }
  }, [title, code, snippets, initialSnippet, onSave, showToast, onNew, setCode, setIsDirty])

  return { handleSplitSnippet }
}
